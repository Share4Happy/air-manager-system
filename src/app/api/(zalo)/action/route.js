import { NextResponse } from 'next/server';
import ScheduledJob from "@/models/schedule";
import ZaloAccount from "@/models/zalo";
import Customer from "@/models/customer";
import Student from "@/models/student";
import Variant from "@/models/variant";
import Logs from "@/models/log";
import dbConnect from "@/config/connectDB";
import { actionZalo } from '@/function/drive/appscript';
import { sendBatch, sendFriendBatch, pollCampaign } from '@/function/zalolite';
import ReportConfig from '@/models/reportConfig';
import { computeNextRunAt, executeReportConfig } from '@/function/report';

const BATCH_MAX = 10;
const GATEWAY_ACTIONS = ['sendMessage', 'addFriend'];
const LEGACY_ACTIONS = ['findUid', 'checkFriend'];

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
        const TargetModel = isStudent ? Student : Customer;
        const targetId = task.person._id;
        const logTargetField = isStudent ? { student: targetId, customer: null } : { customer: targetId, student: null };

        const targetDoc = await TargetModel.findById(targetId).lean();

        if (!targetDoc) {
            throw new Error(`Target document not found in ${isStudent ? 'Student' : 'Customer'} with _id: ${targetId}`);
        }

        let apiResponse;
        let errorMessageForLog = null;
        const actionType = job.actionType;
        let uidPerson = null;
        if (isStudent) {
            uidPerson = targetDoc.Uid || null;
        } else {
            if (actionType === 'addFriend' || actionType === 'sendMessage' || actionType === 'checkFriend') {
                const uidEntry = targetDoc.uid?.find(u => u.zalo?.toString() === zaloAccount._id.toString());
                if (!uidEntry || !uidEntry.uid) {
                    errorMessageForLog = "Không tìm thấy UID của khách hàng tương ứng với tài khoản Zalo thực hiện.";
                    apiResponse = { status: false, message: errorMessageForLog, content: { error_code: -1, error_message: errorMessageForLog, data: {} } };
                } else {
                    uidPerson = uidEntry.uid;
                }
            }
        }


        let finalMessage = "";
        if (!errorMessageForLog) {
            finalMessage = await formatMessage(job.config.messageTemplate, targetDoc, zaloAccount);
            apiResponse = await actionZalo({
                phone: targetDoc.phone,
                uidPerson: uidPerson,
                actionType: actionType,
                message: finalMessage,
                uid: zaloAccount.uid,
            });
        }
        const logPayload = {
            message: finalMessage || errorMessageForLog,
            status: {
                status: apiResponse.status,
                message: apiResponse.message,
                data: {
                    error_code: apiResponse.content?.error_code,
                    error_message: apiResponse.content?.error_message,
                }
            },
            type: actionType,
            createBy: job.createdBy,
            ...logTargetField,
            zalo: job.zaloAccount,
            schedule: job._id,
        };
        const newLog = await Logs.create(logPayload);
        const errorCode = apiResponse.content?.error_code;
        if (actionType === 'findUid') {
            if (errorCode === 0) {
                const updateData = {
                    zaloavt: apiResponse.content.data.avatar,
                    zaloname: apiResponse.content.data.zalo_name,
                };
                await TargetModel.findByIdAndUpdate(targetId, { $set: updateData });

                const newUidValue = apiResponse.content.data.uid;
                const updateResult = await TargetModel.updateOne(
                    { _id: targetId, 'uid.zalo': zaloAccount._id },
                    { $set: { 'uid.$.uid': newUidValue } }
                );
                if (updateResult.matchedCount === 0) {
                    await TargetModel.findByIdAndUpdate(
                        targetId,
                        { $push: { uid: { zalo: zaloAccount._id, uid: newUidValue } } }
                    );
                }
            }
            else if ([216, 212, 219].includes(errorCode)) {
                await TargetModel.findByIdAndUpdate(targetId, { $set: { uid: null } });
            }
        }
        if (actionType === 'checkFriend') {
            const friendStatus = Number(apiResponse.content?.error_message);
            if (!isNaN(friendStatus)) {
                await TargetModel.updateOne(
                    { _id: targetId },
                    { $set: { "uid.$[elem].isFriend": friendStatus } },
                    { arrayFilters: [{ "elem.zalo": zaloAccount._id }] }
                );
            }
        }
        if (actionType === 'addFriend' && apiResponse.status === true) {
            await TargetModel.updateOne(
                { _id: targetId },
                { $set: { "uid.$[elem].isReques": 1 } },
                { arrayFilters: [{ "elem.zalo": zaloAccount._id }] }
            );
        }
        await ScheduledJob.updateOne(
            { _id: job._id, 'tasks._id': task._id },
            { $set: { 'tasks.$.history': newLog._id } }
        );

        const statsUpdateField = apiResponse.status ? 'statistics.completed' : 'statistics.failed';
        const updatedJob = await ScheduledJob.findByIdAndUpdate(
            job._id,
            { $inc: { [statsUpdateField]: 1 } },
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
        console.error(`[Scheduler] Error processing task ${task._id} from job ${job._id}:`, error);
        await ScheduledJob.findByIdAndUpdate(job._id, { $inc: { 'statistics.failed': 1 } });
    }
}

async function pollPendingCampaigns() {
    const jobs = await ScheduledJob.find({ campaignId: { $ne: '' } }).lean();
    for (const job of jobs) {
        const zaloAccount = await ZaloAccount.findById(job.zaloAccount).lean();
        if (!zaloAccount?.botId) continue;
        let campaign;
        try {
            campaign = await pollCampaign(zaloAccount.botId, job.campaignId);
        } catch (err) {
            console.error(`[Scheduler] Poll campaign ${job.campaignId} error:`, err.message);
            continue;
        }
        if (!campaign || campaign.status !== 'completed') continue;

        const results = campaign.results || [];
        const pendingTasks = job.tasks.filter(t => String(t.campaignId) === String(job.campaignId));
        pendingTasks.forEach((task, i) => {
            const result = results[i] || {};
            const success = result.status === 'success';
            const errorMessage = result.error_message || result.message || '';
            writeBatchLog({ task, job, message: job.config?.messageTemplate || '', success, errorMessage })
                .then(async (logId) => {
                    await markTaskDone({ job, task, logId, success });
                });
            if (result.uid) {
                const isStudent = task.person.type === true;
                const TargetModel = isStudent ? Student : Customer;
                TargetModel.findById(task.person._id).lean().then(targetDoc => {
                    if (targetDoc) updateResolvedUid(targetDoc, result, job.zaloAccount, isStudent);
                });
            }
        });
        await ScheduledJob.updateOne({ _id: job._id }, { $set: { campaignId: '' } });
    }
}

async function processPendingReports() {
    const now = new Date();
    const configs = await ReportConfig.find({ isActive: true, nextRunAt: { $lte: now } }).lean();
    for (const cfg of configs) {
        // Claim the config trước khi chạy để tránh lần gọi scheduler sau gửi trùng lặp
        await ReportConfig.findByIdAndUpdate(cfg._id, {
            nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        try {
            const result = await executeReportConfig(cfg);
            if (result.queued) {
                if (cfg.queueResumeAt) {
                    await ReportConfig.findByIdAndUpdate(cfg._id, { nextRunAt: cfg.queueResumeAt });
                }
                continue;
            }
            const nextRunAt = computeNextRunAt({
                frequency: cfg.frequency,
                sendTime: cfg.sendTime,
                weekday: cfg.weekday,
                monthDay: cfg.monthDay,
            });
            await ReportConfig.findByIdAndUpdate(cfg._id, {
                lastSentAt: now,
                nextRunAt,
            });
            if (!result.status) {
                console.warn(`[Scheduler] Report config ${cfg._id} send reported failure: ${result.message}`);
            }
        } catch (err) {
            console.error(`[Scheduler] Report config ${cfg._id} error:`, err.message);
        }
    }
}

export async function GET(request) {
    try {
        await dbConnect();
        await pollPendingCampaigns();
        await processPendingReports();

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
            return NextResponse.json({ message: 'No due tasks to process.' }, { status: 200 });
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
                    console.error(`[Scheduler] Batch job ${jobId} error:`, err);
                });
            } else {
                for (const detail of details) {
                    processSingleTask(detail);
                }
            }
        }

        return NextResponse.json({
            message: `Scheduler triggered. Processing ${dueTasksDetails.length} tasks in the background.`
        }, { status: 202 });

    } catch (error) {
        console.error('[Scheduler API Error]', error);
        return NextResponse.json(
            { message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}
