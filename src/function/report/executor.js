import connectDB from '@/config/connectDB';
import User from '@/models/users';
import ZaloAccount from '@/models/zalo';
import Logs from '@/models/log';
import ReportConfig from '@/models/reportConfig';
import ReportSetting from '@/models/reportSetting';
import mongoose from 'mongoose';
import { sendByPhone } from '@/function/zalolite';
import { fmtTime, sleep, computeResumeAt } from './datetime';
import { buildReportVariables, renderReportTemplate, normalizeMessageText } from './template';

export function ReportConfigUpdate(id, update) {
    return ReportConfig.findByIdAndUpdate(id, { $set: update });
}

export async function getReportSendSettings() {
    await connectDB();
    let s = await ReportSetting.findOne().lean();
    if (!s) {
        s = { staggerMinMin: 3, staggerMaxMin: 5, hourlyLimit: 30 };
        await ReportSetting.create(s);
    }
    const min = Math.max(1, Number(s.staggerMinMin) || 3);
    return {
        staggerMinMin: min,
        staggerMaxMin: Math.max(min, Number(s.staggerMaxMin) || 5),
        hourlyLimit: Math.max(1, Number(s.hourlyLimit) || 30),
    };
}

export async function countHourlySent(zaloId, now = new Date()) {
    const start = new Date(now);
    start.setMinutes(0, 0, 0);
    return Logs.countDocuments({
        type: { $in: ['sendReport', 'sendCare'] },
        zalo: zaloId,
        createdAt: { $gte: start },
    });
}

export async function executeReportConfig(cfg) {
    await connectDB();
    const now = new Date();
    const settings = await getReportSendSettings();
    const ids = Array.isArray(cfg.recipientUserIds) && cfg.recipientUserIds.length
        ? cfg.recipientUserIds
        : (cfg.recipientUserId ? [cfg.recipientUserId] : []);
    const [recipients, zalo] = await Promise.all([
        User.find({ _id: { $in: ids } }).select('name phone').lean(),
        ZaloAccount.findById(cfg.zaloAccountId).lean(),
    ]);
    if (!zalo || !zalo.botId) throw new Error('Tài khoản Zalo chưa có botId (ZaloLite).');

    const pendingQueue = Array.isArray(cfg.pendingQueue) ? cfg.pendingQueue : [];
    const resumeMode = pendingQueue.length > 0;
    const queueDue = resumeMode && (!cfg.queueResumeAt || new Date(cfg.queueResumeAt) <= now);

    if (resumeMode && !queueDue) {
        return {
            status: false,
            queued: true,
            message: `Tin báo cáo đang trong hàng chờ do giới hạn tin/giờ, sẽ tiếp tục gửi lúc ${fmtTime(cfg.queueResumeAt)}.`,
        };
    }

    let targets;
    if (resumeMode && queueDue) {
        targets = pendingQueue.filter(t => t && t.phone).map(t => ({ phone: t.phone, name: t.name || '' }));
    } else {
        const withPhone = recipients.filter(r => r && r.phone);
        if (withPhone.length === 0) throw new Error('Người nhận báo cáo không có số điện thoại.');
        targets = withPhone.map(r => ({ phone: r.phone, name: r.name || '' }));
    }
    if (targets.length === 0) {
        await ReportConfigUpdate(cfg._id, { pendingQueue: [], queueResumeAt: null, pendingText: '' });
        return { status: true, message: 'Không còn tin nào trong hàng chờ.' };
    }

    let text = cfg.pendingText || '';
    if (!text) {
        const { vars, meta } = await buildReportVariables(cfg, now);
        if (cfg.reportType === 'attendance' && cfg.skipIfNoClasses !== false && meta.classCount === 0) {
            await Logs.create({
                status: {
                    status: true,
                    message: 'Bỏ qua gửi báo cáo: Không có lớp học nào diễn ra trong ngày/kỳ báo cáo.',
                    data: {
                        error_code: 0,
                        error_message: '',
                        message: 'Không có lớp học nào diễn ra trong ngày. Đã tự động bỏ qua gửi tin.',
                        recipients: targets.map(t => t.phone),
                        recipientNames: targets.map(t => t.name || ''),
                        batchId: new mongoose.Types.ObjectId().toString(),
                    },
                },
                type: 'sendReport',
                createBy: cfg.createdBy || ids[0] || null,
                zalo: cfg.zaloAccountId,
                schedule: null,
            });
            return {
                status: true,
                skipped: true,
                message: 'Không có lớp học nào diễn ra trong ngày. Đã tự động bỏ qua gửi tin.',
            };
        }
        text = normalizeMessageText(await renderReportTemplate(cfg.messageTemplate || '{body}', vars));
    }

    const zaloId = zalo._id || cfg.zaloAccountId;
    const limit = settings.hourlyLimit;
    const attempted = [];
    const queuedTargets = [];
    const batchId = new mongoose.Types.ObjectId().toString();
    let blocked = false;

    for (let i = 0; i < targets.length; i++) {
        if (i > 0) {
            const delayMin = settings.staggerMinMin + Math.random() * (settings.staggerMaxMin - settings.staggerMinMin);
            await sleep(Math.round(delayMin * 60 * 1000));
        }
        const sentCount = await countHourlySent(zaloId);
        if (sentCount >= limit) {
            blocked = true;
            queuedTargets.push(...targets.slice(i));
            break;
        }
        const target = targets[i];
        let ok = false;
        let errMsg = '';
        try {
            const resp = await sendByPhone(zalo.botId, { phone: target.phone, text, mode: 'safe' });
            if (resp.async) {
                ok = true;
            } else if (Array.isArray(resp.data?.results)) {
                const r = resp.data.results[0] || {};
                ok = r.status === 'success';
                errMsg = r.error_message || r.message || '';
            } else {
                ok = resp.data?.success !== false;
            }
        } catch (err) {
            ok = false;
            errMsg = err?.message || 'Lỗi gửi tin nhắn';
        }
        attempted.push({ target, ok, errMsg });
        await Logs.create({
            status: {
                status: ok,
                message: ok ? 'Gửi báo cáo thành công' : (errMsg || 'Gửi báo cáo thất bại'),
                data: {
                    error_code: ok ? 0 : -1,
                    error_message: ok ? '' : errMsg,
                    message: text,
                    recipients: [target.phone],
                    recipientNames: [target.name || ''],
                    batchId,
                },
            },
            type: 'sendReport',
            createBy: cfg.createdBy || ids[0] || null,
            zalo: cfg.zaloAccountId,
            schedule: null,
        });
    }

    if (blocked) {
        const resumeAt = computeResumeAt();
        await ReportConfigUpdate(cfg._id, {
            pendingQueue: queuedTargets.map(t => ({ phone: t.phone, name: t.name })),
            pendingText: text,
            queueResumeAt: resumeAt,
            nextRunAt: resumeAt,
        });
        return {
            status: false,
            queued: true,
            message: `Đạt giới hạn tin nhắn trong giờ (${limit} tin/giờ). ${queuedTargets.length} tin còn lại trong hàng chờ, sẽ tiếp tục gửi lúc ${fmtTime(resumeAt)}.`,
        };
    }

    if (resumeMode) {
        await ReportConfigUpdate(cfg._id, { pendingQueue: [], pendingText: '', queueResumeAt: null });
    }

    const failed = attempted.filter(a => !a.ok);
    const success = failed.length === 0;
    return {
        status: success,
        message: success
            ? `Đã gửi báo cáo cho ${attempted.length} người nhận.`
            : `Gửi báo cáo thất bại ${failed.length}/${attempted.length}. ${failed.map(a => a.errMsg).filter(Boolean).join('; ')}`.trim(),
    };
}

export async function prepareReportSend(cfg, customMessageTemplate) {
    await connectDB();
    const now = new Date();
    const ids = Array.isArray(cfg.recipientUserIds) && cfg.recipientUserIds.length
        ? cfg.recipientUserIds
        : (cfg.recipientUserId ? [cfg.recipientUserId] : []);
    const [recipients, zalo] = await Promise.all([
        User.find({ _id: { $in: ids } }).select('name phone').lean(),
        ZaloAccount.findById(cfg.zaloAccountId).lean(),
    ]);
    if (!zalo || !zalo.botId) throw new Error('Tài khoản Zalo chưa có botId (ZaloLite).');
    const withPhone = recipients.filter(r => r && r.phone);
    if (withPhone.length === 0) throw new Error('Người nhận báo cáo không có số điện thoại.');
    const targets = withPhone.map(r => ({ phone: r.phone, name: r.name || '' }));
    const { vars, meta } = await buildReportVariables(cfg, now);
    const tpl = customMessageTemplate !== undefined && customMessageTemplate !== null
        ? customMessageTemplate
        : (cfg.messageTemplate || '{body}');
    const text = normalizeMessageText(await renderReportTemplate(tpl, vars));

    return {
        zaloName: zalo.name || '',
        botId: zalo.botId,
        zaloId: String(zalo._id || cfg.zaloAccountId),
        createBy: cfg.createdBy ? String(cfg.createdBy) : null,
        targets,
        text,
        classCount: meta?.classCount || 0,
    };
}

export async function sendSingleReport({ botId, zaloId, createBy, target, text }) {
    text = normalizeMessageText(text);
    let ok = false;
    let errMsg = '';
    try {
        const resp = await sendByPhone(botId, { phone: target.phone, text, mode: 'safe' });
        if (resp.async) {
            ok = true;
        } else if (Array.isArray(resp.data?.results)) {
            const r = resp.data.results[0] || {};
            ok = r.status === 'success';
            errMsg = r.error_message || r.message || '';
        } else {
            ok = resp.data?.success !== false;
        }
    } catch (err) {
        ok = false;
        errMsg = err?.message || 'Lỗi gửi tin nhắn';
    }
    await Logs.create({
        status: {
            status: ok,
            message: ok ? 'Gửi báo cáo thành công' : (errMsg || 'Gửi báo cáo thất bại'),
            data: {
                error_code: ok ? 0 : -1,
                error_message: ok ? '' : errMsg,
                message: text,
                recipients: [target.phone],
                recipientNames: [target.name || ''],
                batchId: new mongoose.Types.ObjectId().toString(),
            },
        },
        type: 'sendReport',
        createBy,
        zalo: zaloId,
        schedule: null,
    });
    return { ok, errMsg };
}
