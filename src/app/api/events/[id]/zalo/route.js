import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import Event from '@/models/event';
import checkAuthToken from '@/utils/checktoken';
import { sendByPhone, getActiveZaloAccount, sendResponseOk, sendResponseError } from '@/function/zalolite';
import mongoose from 'mongoose';

export async function POST(req, { params }) {
    try {
        const user = await checkAuthToken();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'ID không hợp lệ' }, { status: 400 });
        }

        const body = await req.json();
        const {
            recipients = [], // Array of { name, phone, role, taskId, taskName }
            message = '',
        } = body;

        if (!message || !message.trim()) {
            return NextResponse.json({ success: false, message: 'Nội dung tin nhắn không được để trống' }, { status: 400 });
        }

        if (!Array.isArray(recipients) || recipients.length === 0) {
            return NextResponse.json({ success: false, message: 'Vui lòng chọn ít nhất một người nhận' }, { status: 400 });
        }

        await connectDB();
        const eventDoc = await Event.findById(id);
        if (!eventDoc) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy sự kiện' }, { status: 404 });
        }

        let zaloAccount = null;
        let botId = null;
        try {
            zaloAccount = await getActiveZaloAccount();
            botId = zaloAccount?.botId;
        } catch (zErr) {
            console.warn('Could not get active Zalo account:', zErr.message);
        }

        const sendResults = [];
        const newHistoryLogs = [];

        for (const r of recipients) {
            const recipientName = r.name || 'Thành viên';
            const recipientPhone = (r.phone || '').trim();

            if (!recipientPhone) {
                sendResults.push({
                    recipientName,
                    recipientPhone: 'Chưa có SĐT',
                    status: 'failed',
                    error: 'Chưa có số điện thoại',
                });
                newHistoryLogs.push({
                    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    sentAt: new Date(),
                    recipientName,
                    recipientPhone: 'Chưa có SĐT',
                    message: message,
                    status: 'failed',
                    error: 'Chưa có số điện thoại',
                    senderName: user.name || 'Quản trị viên',
                });
                continue;
            }

            // Interpolate dynamic tags
            let finalMsg = message
                .replaceAll('{name}', recipientName)
                .replaceAll('{member_name}', recipientName)
                .replaceAll('{event_title}', eventDoc.title || 'Sự kiện')
                .replaceAll('{event_location}', eventDoc.location || 'Địa điểm tổ chức')
                .replaceAll('{event_date}', eventDoc.startDate ? new Date(eventDoc.startDate).toLocaleDateString('vi-VN') : 'Ngày diễn ra')
                .replaceAll('{task_name}', r.taskName || 'Nhiệm vụ')
                .replaceAll('{due_date}', r.dueDate ? new Date(r.dueDate).toLocaleDateString('vi-VN') : 'Hạn hoàn thành');

            let sendSuccess = false;
            let errMsg = '';

            if (botId) {
                try {
                    const res = await sendByPhone(botId, {
                        phone: recipientPhone,
                        text: finalMsg,
                        mode: 'safe',
                    });

                    if (sendResponseOk(res)) {
                        sendSuccess = true;
                    } else {
                        errMsg = sendResponseError(res) || 'ZaloLite Gateway gửi không thành công';
                    }
                } catch (err) {
                    errMsg = err.message || 'Lỗi kết nối Zalo';
                }
            } else {
                sendSuccess = false;
                errMsg = 'Chưa cấu hình tài khoản ZaloLite trong Cài đặt hệ thống';
            }

            const logEntry = {
                id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                sentAt: new Date(),
                recipientName,
                recipientPhone,
                message: finalMsg,
                status: sendSuccess ? 'success' : 'failed',
                error: errMsg,
                senderName: user.name || 'Quản trị viên',
            };

            sendResults.push(logEntry);
            newHistoryLogs.push(logEntry);
        }

        // Update history in event document
        if (!eventDoc.zaloConfig) {
            eventDoc.zaloConfig = {
                enabled: true,
                history: [],
            };
        }
        if (!Array.isArray(eventDoc.zaloConfig.history)) {
            eventDoc.zaloConfig.history = [];
        }

        eventDoc.zaloConfig.history = [
            ...newHistoryLogs,
            ...eventDoc.zaloConfig.history,
        ].slice(0, 100);

        eventDoc.updatedBy = user.id || user._id;
        await eventDoc.save();

        const successCount = sendResults.filter(r => r.status === 'success').length;
        const failedCount = sendResults.length - successCount;

        return NextResponse.json({
            success: true,
            message: `Đã xử lý gửi ${sendResults.length} tin (${successCount} thành công, ${failedCount} thất bại)`,
            results: sendResults,
            history: eventDoc.zaloConfig.history,
        }, { status: 200 });

    } catch (error) {
        console.error('Error sending event Zalo message:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
