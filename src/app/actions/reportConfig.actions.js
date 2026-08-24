'use server';
import connectDB from '@/config/connectDB';
import mongoose from 'mongoose';
import { revalidateTag } from 'next/cache';
import ReportConfig from '@/models/reportConfig';
import ReportTemplate from '@/models/reportTemplate';
import ReportSetting from '@/models/reportSetting';
import User from '@/models/users';
import ZaloAccount from '@/models/zalo';
import checkAuthToken from '@/utils/checktoken';
import {
    computeNextRunAt,
    countHourlySent,
    executeReportConfig,
    getReportSendSettings,
    normalizeMessageText,
    prepareReportSend,
    sendSingleReport,
} from '@/function/report';

async function requireAuth() {
    const user = await checkAuthToken();
    if (!user || !user.id) return { ok: false, message: 'Bạn cần đăng nhập để thực hiện hành động này.' };
    if (!user.role.includes('Admin') && !user.role.includes('Sale') && !user.role.includes('Academic')) {
        return { ok: false, message: 'Bạn không có quyền thực hiện chức năng này.' };
    }
    return { ok: true, user };
}

function readReportOptions(formData) {
    const attendance = ['classes', 'present', 'absent', 'unchecked', 'lessonCount', 'studentTurns', 'perClass', 'violations', 'checkinLate'];
    const monthly = ['tuition', 'enrollments', 'quits', 'upgrades', 'classesByArea', 'studentRank', 'trialCount', 'trialRate'];
    const attendanceOptions = {};
    const monthlyOptions = {};
    attendance.forEach(k => { attendanceOptions[k] = formData.get(`opt_attendance_${k}`) === '1'; });
    monthly.forEach(k => { monthlyOptions[k] = formData.get(`opt_monthly_${k}`) === '1'; });
    monthlyOptions.comparePrevMonth = formData.get('opt_monthly_comparePrevMonth') === '1';
    monthlyOptions.areas = formData.getAll('opt_monthly_areas')
        .map(v => v.toString().trim())
        .filter(Boolean);
    return { attendance: attendanceOptions, monthly: monthlyOptions };
}

function buildConfigPayload(formData) {
    const raw = formData.getAll('recipientUserIds')
        .map(v => v.toString().trim())
        .filter(Boolean)
    return {
        name: (formData.get('name') || '').toString().trim(),
        recipientUserIds: [...new Set(raw)],
        reportOptions: readReportOptions(formData),
        zaloAccountId: (formData.get('zaloAccountId') || '').toString(),
        reportType: (formData.get('reportType') || 'attendance').toString(),
        messageTemplate: normalizeMessageText((formData.get('messageTemplate') || '').toString()),
        frequency: (formData.get('frequency') || 'daily').toString(),
        sendTime: (formData.get('sendTime') || '08:00').toString(),
        weekday: parseInt(formData.get('weekday') || '1', 10),
        monthDay: parseInt(formData.get('monthDay') || '1', 10),
    };
}

export async function saveReportConfigAction(_prevState, formData) {
    const auth = await requireAuth();
    if (!auth.ok) return { status: false, message: auth.message };

    const p = buildConfigPayload(formData);
    if (!p.recipientUserIds.length || !p.zaloAccountId) {
        return { status: false, message: 'Vui lòng chọn ít nhất một người nhận và tài khoản Zalo.' };
    }
    if (!p.messageTemplate) {
        return { status: false, message: 'Vui lòng nhập mẫu tin nhắn.' };
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(p.sendTime)) {
        return { status: false, message: 'Giờ gửi không hợp lệ (định dạng HH:MM).' };
    }

    try {
        await connectDB();
        const [recipients, zalo] = await Promise.all([
            User.find({ _id: { $in: p.recipientUserIds } }).lean(),
            ZaloAccount.findById(p.zaloAccountId).lean(),
        ]);
        if (recipients.length !== p.recipientUserIds.length) {
            return { status: false, message: 'Một số người nhận không tồn tại trong hệ thống.' };
        }
        if (!zalo || !zalo.botId) return { status: false, message: 'Tài khoản Zalo chưa có botId (chưa cấu hình ZaloLite).' };

        const nextRunAt = computeNextRunAt({ frequency: p.frequency, sendTime: p.sendTime, weekday: p.weekday, monthDay: p.monthDay });
        const id = (formData.get('_id') || '').toString();

        if (id && mongoose.isValidObjectId(id)) {
            await ReportConfig.findByIdAndUpdate(id, { ...p, nextRunAt });
        } else {
            await ReportConfig.create({ ...p, nextRunAt, isActive: true, createdBy: auth.user.id });
        }
        revalidateTag('report-config', 'max');
        return { status: true, message: 'Đã lưu cấu hình báo cáo.' };
    } catch (error) {
        console.error('Save Report Config Error:', error);
        return { status: false, message: 'Lỗi hệ thống, không thể lưu cấu hình.' };
    }
}

export async function toggleReportConfigAction(_prevState, formData) {
    const auth = await requireAuth();
    if (!auth.ok) return { status: false, message: auth.message };
    try {
        await connectDB();
        const id = (formData.get('_id') || '').toString();
        const cfg = await ReportConfig.findById(id);
        if (!cfg) return { status: false, message: 'Không tìm thấy cấu hình báo cáo.' };
        cfg.isActive = !cfg.isActive;
        if (cfg.isActive) {
            cfg.nextRunAt = computeNextRunAt({ frequency: cfg.frequency, sendTime: cfg.sendTime, weekday: cfg.weekday, monthDay: cfg.monthDay });
        } else {
            cfg.nextRunAt = null;
        }
        await cfg.save();
        revalidateTag('report-config', 'max');
        return { status: true, message: cfg.isActive ? 'Đã bật báo cáo định kỳ.' : 'Đã tắt báo cáo định kỳ.' };
    } catch (error) {
        return { status: false, message: 'Lỗi hệ thống, không thể cập nhật trạng thái.' };
    }
}

export async function deleteReportConfigAction(_prevState, formData) {
    const auth = await requireAuth();
    if (!auth.ok) return { status: false, message: auth.message };
    try {
        await connectDB();
        await ReportConfig.findByIdAndDelete((formData.get('_id') || '').toString());
        revalidateTag('report-config', 'max');
        return { status: true, message: 'Đã xóa cấu hình báo cáo.' };
    } catch (error) {
        return { status: false, message: 'Lỗi hệ thống, không thể xóa cấu hình.' };
    }
}

export async function sendReportNowAction(_prevState, formData) {
    const auth = await requireAuth();
    if (!auth.ok) return { status: false, message: auth.message };
    try {
        await connectDB();
        const id = (formData.get('_id') || '').toString();
        const cfg = await ReportConfig.findById(id);
        if (!cfg) return { status: false, message: 'Không tìm thấy cấu hình báo cáo.' };
        const result = await executeReportConfig(cfg);
        return result;
    } catch (error) {
        console.error('Send Report Now Error:', error);
        return { status: false, message: error.message || 'Lỗi hệ thống, không thể gửi báo cáo.' };
    }
}

export async function prepareReportSendAction(_prevState, formData) {
    const auth = await requireAuth();
    if (!auth.ok) return { status: false, message: auth.message };
    try {
        await connectDB();
        const id = (formData.get('_id') || '').toString();
        const cfg = await ReportConfig.findById(id);
        if (!cfg) return { status: false, message: 'Không tìm thấy cấu hình báo cáo.' };
        const data = await prepareReportSend(cfg);
        return { status: true, message: 'Sẵn sàng gửi tin.', data };
    } catch (error) {
        console.error('Prepare Report Send Error:', error);
        return { status: false, message: error.message || 'Lỗi hệ thống, không thể chuẩn bị tin gửi.' };
    }
}

export async function sendOneReportAction(_prevState, formData) {
    const auth = await requireAuth();
    if (!auth.ok) return { ok: false, message: auth.message };
    try {
        await connectDB();
        const id = (formData.get('_id') || '').toString();
        const phone = (formData.get('phone') || '').toString().trim();
        const name = (formData.get('name') || '').toString();
        const text = normalizeMessageText((formData.get('text') || '').toString());
        if (!id || !phone || !text) return { ok: false, message: 'Thiếu dữ liệu gửi tin.' };
        const cfg = await ReportConfig.findById(id).select('zaloAccountId createdBy').lean();
        if (!cfg) return { ok: false, message: 'Không tìm thấy cấu hình báo cáo.' };
        const zalo = await ZaloAccount.findById(cfg.zaloAccountId).lean();
        if (!zalo || !zalo.botId) return { ok: false, message: 'Tài khoản Zalo chưa có botId (ZaloLite).' };
        const settings = await getReportSendSettings();
        const zaloId = zalo._id || cfg.zaloAccountId;
        const sentCount = await countHourlySent(zaloId);
        if (sentCount >= settings.hourlyLimit) {
            return { ok: false, blocked: true, message: `Đã đạt giới hạn ${settings.hourlyLimit} tin/giờ.` };
        }
        const result = await sendSingleReport({
            botId: zalo.botId,
            zaloId,
            createBy: auth.user.id || cfg.createdBy,
            target: { phone, name },
            text,
        });
        if (result.ok) {
            await ReportConfig.findByIdAndUpdate(id, { $set: { lastSentAt: new Date() } });
        }
        return { ok: result.ok, message: result.ok ? 'Gửi thành công' : (result.errMsg || 'Gửi thất bại') };
    } catch (error) {
        console.error('Send One Report Error:', error);
        return { ok: false, message: error.message || 'Lỗi hệ thống, không thể gửi tin.' };
    }
}

export async function sendReportTestAction(_prevState, formData) {
    const auth = await requireAuth();
    if (!auth.ok) return { status: false, message: auth.message };
    const p = buildConfigPayload(formData);
    if (!p.recipientUserIds.length || !p.zaloAccountId) {
        return { status: false, message: 'Vui lòng chọn ít nhất một người nhận và tài khoản Zalo.' };
    }
    if (!p.messageTemplate) {
        return { status: false, message: 'Vui lòng nhập mẫu tin nhắn.' };
    }
    try {
        await connectDB();
        const cfg = {
            recipientUserIds: p.recipientUserIds,
            zaloAccountId: p.zaloAccountId,
            reportType: p.reportType,
            messageTemplate: p.messageTemplate,
            frequency: p.frequency,
            reportOptions: p.reportOptions,
            createdBy: auth.user.id,
        };
        const result = await executeReportConfig(cfg);
        return result;
    } catch (error) {
        console.error('Send Report Test Error:', error);
        return { status: false, message: error.message || 'Lỗi hệ thống, không thể gửi báo cáo.' };
    }
}

export async function saveReportSettingAction(_prevState, formData) {
    const auth = await requireAuth();
    if (!auth.ok) return { status: false, message: auth.message };
    const staggerMinMin = parseInt(formData.get('staggerMinMin') || '3', 10);
    const staggerMaxMin = parseInt(formData.get('staggerMaxMin') || '5', 10);
    const hourlyLimit = parseInt(formData.get('hourlyLimit') || '30', 10);
    if (!Number.isInteger(staggerMinMin) || staggerMinMin < 1) {
        return { status: false, message: 'Chênh lệch tối thiểu phải từ 1 phút.' };
    }
    if (!Number.isInteger(staggerMaxMin) || staggerMaxMin < staggerMinMin) {
        return { status: false, message: 'Chênh lệch tối đa phải lớn hơn hoặc bằng tối thiểu.' };
    }
    if (!Number.isInteger(hourlyLimit) || hourlyLimit < 1) {
        return { status: false, message: 'Giới hạn tin nhắn trong giờ phải từ 1.' };
    }
    try {
        await connectDB();
        let setting = await ReportSetting.findOne();
        if (!setting) setting = new ReportSetting({ staggerMinMin: 3, staggerMaxMin: 5, hourlyLimit: 30 });
        setting.staggerMinMin = staggerMinMin;
        setting.staggerMaxMin = staggerMaxMin;
        setting.hourlyLimit = hourlyLimit;
        setting.updatedBy = auth.user.id;
        await setting.save();
        return { status: true, message: 'Đã lưu cài đặt gửi báo cáo.' };
    } catch (error) {
        console.error('Save Report Setting Error:', error);
        return { status: false, message: 'Lỗi hệ thống, không thể lưu cài đặt.' };
    }
}

export async function saveReportTemplateAction(_prevState, formData) {
    const auth = await requireAuth();
    if (!auth.ok) return { status: false, message: auth.message };
    const name = (formData.get('name') || '').toString().trim();
    const content = normalizeMessageText((formData.get('content') || '').toString());
    const reportType = (formData.get('reportType') || 'all').toString();
    const messageType = (formData.get('messageType') || 'other').toString();
    if (!name) return { status: false, message: 'Vui lòng nhập tên mẫu.' };
    if (!content) return { status: false, message: 'Vui lòng nhập nội dung mẫu.' };
    try {
        await connectDB();
        const id = (formData.get('_id') || '').toString();
        if (id && mongoose.isValidObjectId(id)) {
            await ReportTemplate.findByIdAndUpdate(id, { name, content, reportType, messageType });
        } else {
            await ReportTemplate.create({ name, content, reportType, messageType, createdBy: auth.user.id });
        }
        revalidateTag('report-config', 'max');
        return { status: true, message: 'Đã lưu mẫu tin nhắn.' };
    } catch (error) {
        console.error('Save Report Template Error:', error);
        return { status: false, message: 'Lỗi hệ thống, không thể lưu mẫu.' };
    }
}

export async function deleteReportTemplateAction(_prevState, formData) {
    const auth = await requireAuth();
    if (!auth.ok) return { status: false, message: auth.message };
    try {
        await connectDB();
        await ReportTemplate.findByIdAndDelete((formData.get('_id') || '').toString());
        revalidateTag('report-config', 'max');
        return { status: true, message: 'Đã xóa mẫu tin nhắn.' };
    } catch (error) {
        return { status: false, message: 'Lỗi hệ thống, không thể xóa mẫu.' };
    }
}
