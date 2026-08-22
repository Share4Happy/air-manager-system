import ScheduledJob from "@/models/schedule";
import ZaloAccount from "@/models/zalo";
import Customer from "@/models/customer";
import Student from "@/models/student";
import Variant from "@/models/variant";
import Logs from "@/models/log";
import { sendBatch, sendFriendBatch } from '@/function/zalolite';

const BATCH_MAX = 10;
const GATEWAY_ACTIONS = ['sendMessage', 'addFriend'];

async function formatMessage(template, targetDoc, zaloAccountDoc) {
    if (!template) return "";
    let message = template;

    message = message.replace(/{name}/g, targetDoc.name || "");
    message = message.replace(/{nameparent}/g, targetDoc.nameparent || "");
    message = message.replace(/{namezalo}/g, targetDoc.zaloname || "");

    const variantPlaceholders = message.match(/{[^{}]+}/g) || [];
    for (const placeholder of variantPlaceholders) {
        const variantName = placeholder.slice(1, -1);
        const variant = await Variant.findOne({ name: variantName }).lean();
        if (variant && variant.phrases && variant.phrases.length > 0) {
            const randomPhrase = variant.phrases[Math.floor(Math.random() * variant.phrases.length)];
            message = message.replace(placeholder, randomPhrase);
        }
    }

    return message;
}

function getTargetPhone(targetDoc) {
    return targetDoc?.phone || targetDoc?.Phone || '';
}

function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

async function writeBatchLog({ task, job, message, success, errorMessage }) {
    const isStudent = task.person.type === true;
    const logTargetField = isStudent ? { student: task.person._id, customer: null } : { customer: task.person._id, student: null };
    const newLog = await Logs.create({
        message,
        status: {
            status: success,
            message: success ? 'Gửi thành công' : (errorMessage || 'Gửi thất bại'),
            data: {
                error_code: success ? 0 : -1,
                error_message: success ? '' : (errorMessage || ''),
            }
        },
        type: job.actionType,
        createBy: job.createdBy,
        ...logTargetField,
        zalo: job.zaloAccount,
        schedule: job._id,
    });
    return newLog._id;
}

async function markTaskDone({ job, task, logId, success }) {
    const updateOps = {
        $set: {
            'tasks.$.history': logId,
            'tasks.$.campaignId': '',
        },
        $inc: { [success ? 'statistics.completed' : 'statistics.failed']: 1 },
    };
    const updatedJob = await ScheduledJob.findOneAndUpdate(
        { _id: job._id, 'tasks._id': task._id },
        updateOps,
        { new: true }
    ).lean();
    if (updatedJob) {
        const { completed, failed, total } = updatedJob.statistics;
        if ((completed + failed) >= total) {
            await ZaloAccount.findByIdAndUpdate(
                job.zaloAccount,
                { $pull: { action: job._id } }
            );
        }
    }
}

async function updateResolvedUid(targetDoc, result, zaloAccountId, isStudent) {
    if (!result?.uid) return;
    if (isStudent) {
        if (!targetDoc.Uid) {
            await Student.findByIdAndUpdate(targetDoc._id, { $set: { Uid: result.uid } });
        }
        return;
    }
    const hasUidForAccount = (targetDoc.uid || []).some(u => String(u.zalo) === String(zaloAccountId));
    if (!hasUidForAccount) {
        await Customer.findByIdAndUpdate(
            targetDoc._id,
            { $push: { uid: { zalo: zaloAccountId, uid: result.uid, isFriend: 0, isReques: 0 } } }
        );
    }
}

async function sendBatchChunk({ job, zaloAccount, actionType, text, entries }) {
    const recipients = entries.map(e => ({ phone: getTargetPhone(e.targetDoc) }));
    const botId = zaloAccount.botId;

    let resp;
    try {
        if (actionType === 'sendMessage') {
            resp = await sendBatch(botId, { recipients, text, mode: 'safe' });
        } else {
            resp = await sendFriendBatch(botId, { recipients, message: text, aliasPrefix: 'KH_', mode: 'safe' });
        }
    } catch (err) {
        const errorMessage = err?.message || 'Lỗi gọi ZaloLite Gateway';
        for (const e of entries) {
            const logId = await writeBatchLog({ task: e.task, job, message: text, success: false, errorMessage });
            await markTaskDone({ job, task: e.task, logId, success: false });
        }
        return;
    }

    if (resp.async) {
        const campaignId = resp.data?.campaign_id;
        if (campaignId) {
            await ScheduledJob.updateOne(
                { _id: job._id, 'tasks._id': { $in: entries.map(e => e.task._id) } },
                {
                    $set: {
                        'tasks.$[].campaignId': campaignId,
                        campaignId,
                    },
                }
            );
        }
        return;
    }

    const results = resp.data?.results || [];
    for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const result = results[i] || {};
        const success = result.status === 'success';
        const errorMessage = result.error_message || result.message || '';
        const logId = await writeBatchLog({ task: e.task, job, message: text, success, errorMessage });
        await markTaskDone({ job, task: e.task, logId, success });
        if (success && result.uid && result.uid !== e.task.person.uid) {
            updateResolvedUid(e.targetDoc, result, job.zaloAccount, e.task.person.type === true);
        }
        if (actionType === 'addFriend' && success) {
            await Customer.updateOne(
                { _id: e.task.person._id, 'uid.zalo': job.zaloAccount },
                { $set: { 'uid.$.isReques': 1 } },
            );
        }
    }
}

async function processBatchJob(job, zaloAccount, dueTasks) {
    const actionType = job.actionType;
    if (!zaloAccount.botId) {
        const errorMessage = `Tài khoản Zalo "${zaloAccount.name || ''}" chưa có botId (chưa cấu hình ZaloLite).`;
        for (const task of dueTasks) {
            const logId = await writeBatchLog({ task, job, message: job.config?.messageTemplate || '', success: false, errorMessage });
            await markTaskDone({ job, task, logId, success: false });
        }
        return;
    }

    const entries = [];
    for (const task of dueTasks) {
        const isStudent = task.person.type === true;
        const TargetModel = isStudent ? Student : Customer;
        const targetDoc = await TargetModel.findById(task.person._id).lean();
        if (!targetDoc) {
            const errorMessage = `Không tìm thấy ${isStudent ? 'học sinh' : 'khách hàng'} với _id: ${task.person._id}`;
            const logId = await writeBatchLog({ task, job, message: job.config?.messageTemplate || '', success: false, errorMessage });
            await markTaskDone({ job, task, logId, success: false });
            continue;
        }
        let text = '';
        if (actionType === 'sendMessage') {
            text = await formatMessage(job.config?.messageTemplate, targetDoc, zaloAccount);
        } else {
            text = job.config?.messageTemplate || '';
        }
        entries.push({ task, targetDoc, text });
    }
    if (entries.length === 0) return;

    const groups = new Map();
    for (const e of entries) {
        const key = actionType === 'sendMessage' ? e.text : 'same';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(e);
    }

    for (const [text, groupEntries] of groups) {
        for (const chunkEntries of chunk(groupEntries, BATCH_MAX)) {
            await sendBatchChunk({ job, zaloAccount, actionType, text, entries: chunkEntries });
        }
    }
}

async function processSingleTask(taskDetail) {
    const { task, job, zaloAccount } = taskDetail;

    try {
        const isStudent = task.person.type === true;
        const logTargetField = isStudent ? { student: task.person._id, customer: null } : { customer: task.person._id, student: null };

        const actionType = job.actionType;
        const noticeMessage = actionType === 'findUid'
            ? 'Không cần lịch tìm UID riêng: ZaloLite Gateway tự resolve phone → UID khi gửi tin nhắn.'
            : 'Không cần lịch kiểm tra bạn bè riêng: ZaloLite Gateway tự xác định trạng thái bạn bè khi gửi tin nhắn.';

        const newLog = await Logs.create({
            message: noticeMessage,
            status: { status: true, message: 'Không cần thực hiện (Gateway xử lý tự động)', data: { error_code: 0, error_message: '' } },
            type: actionType,
            createBy: job.createdBy,
            ...logTargetField,
            zalo: job.zaloAccount,
            schedule: job._id,
        });
        await ScheduledJob.updateOne(
            { _id: job._id, 'tasks._id': task._id },
            { $set: { 'tasks.$.history': newLog._id } }
        );

        const updatedJob = await ScheduledJob.findByIdAndUpdate(
            job._id,
            { $inc: { 'statistics.completed': 1 } },
            { new: true }
        ).lean();
        if (updatedJob) {
            const { completed, failed, total } = updatedJob.statistics;
            if ((completed + failed) >= total) {
                await ZaloAccount.findByIdAndUpdate(
                    job.zaloAccount,
                    { $pull: { action: job._id } }
                );
            }
        }
    } catch (error) {
        console.error(`[Scheduler][ZaloJob] Task ${task._id} from job ${job._id} error:`, error);
        await ScheduledJob.findByIdAndUpdate(job._id, { $inc: { 'statistics.failed': 1 } });
    }
}

export async function processZaloCampaignsJob() {
    const now = new Date();
    const oneMinuteLater = new Date(now.getTime() + 60 * 1000);
    const dueTasksDetails = await ScheduledJob.aggregate([
        { $match: { 'tasks.status': false, 'tasks.campaignId': { $in: [null, ''] }, 'tasks.scheduledFor': { $lte: oneMinuteLater } } },
        { $unwind: '$tasks' },
        { $match: { 'tasks.status': false, 'tasks.campaignId': { $in: [null, ''] }, 'tasks.scheduledFor': { $lte: oneMinuteLater } } },
        {
            $lookup: {
                from: 'zaloaccounts',
                localField: 'zaloAccount',
                foreignField: '_id',
                as: 'zaloAccountInfo'
            }
        },
        { $match: { 'zaloAccountInfo': { $ne: [] } } },
        { $sort: { 'tasks.scheduledFor': 1 } },
        {
            $project: {
                _id: 0,
                job: { _id: '$_id', jobName: '$jobName', actionType: '$actionType', zaloAccount: '$zaloAccount', config: '$config', createdBy: '$createdBy' },
                task: '$tasks',
                zaloAccount: { $arrayElemAt: ['$zaloAccountInfo', 0] }
            }
        }
    ]);

    if (dueTasksDetails.length === 0) {
        return { count: 0 };
    }

    const taskUpdateOperations = dueTasksDetails.map(detail => ({
        updateOne: {
            filter: { _id: detail.job._id, 'tasks._id': detail.task._id },
            update: { $set: { 'tasks.$.status': true } }
        }
    }));
    await ScheduledJob.bulkWrite(taskUpdateOperations);

    const byJob = new Map();
    for (const detail of dueTasksDetails) {
        const key = String(detail.job._id);
        if (!byJob.has(key)) byJob.set(key, []);
        byJob.get(key).push(detail);
    }

    for (const [jobId, details] of byJob) {
        const actionType = details[0].job.actionType;
        const zaloAccount = details[0].zaloAccount;
        if (GATEWAY_ACTIONS.includes(actionType)) {
            processBatchJob(details[0].job, zaloAccount, details.map(d => d.task)).catch(err => {
                console.error(`[Scheduler][ZaloJob] Batch job ${jobId} error:`, err);
            });
        } else {
            for (const detail of details) {
                processSingleTask(detail);
            }
        }
    }

    return { count: dueTasksDetails.length };
}
