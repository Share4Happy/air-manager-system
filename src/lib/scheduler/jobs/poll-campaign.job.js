import ScheduledJob from '@/models/schedule';
import ZaloAccount from '@/models/zalo';
import Student from '@/models/student';
import Customer from '@/models/customer';
import Logs from '@/models/log';
import { pollCampaign } from '@/function/zalolite';

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

export async function pollPendingCampaignsJob() {
    const jobs = await ScheduledJob.find({ campaignId: { $ne: '' } }).lean();
    for (const job of jobs) {
        const zaloAccount = await ZaloAccount.findById(job.zaloAccount).lean();
        if (!zaloAccount?.botId) continue;
        let campaign;
        try {
            campaign = await pollCampaign(zaloAccount.botId, job.campaignId);
        } catch (err) {
            console.error(`[Scheduler][PollJob] Campaign ${job.campaignId} error:`, err.message);
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
