'use client';
import React, { useState, useEffect } from 'react';
import {
    IconMessageSquare,
    IconSend,
    IconCheckCircle,
    IconAlertCircle,
    IconUser,
    IconPhone,
} from '@/app/events/ui/icons';
import { EventModal, useEventDialog, resolveAssigneeInfo } from '@/app/events/ui/common';


export default function SendTaskZaloModal({
    isOpen = false,
    onClose,
    task = null,
    event = {},
    users = [],
    members = [],
    onSendSuccess,
}) {
    const dialog = useEventDialog();
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [feedback, setFeedback] = useState(null);

    // Populate data when modal opens
    useEffect(() => {
        if (!task || !isOpen) return;

        const assigneeId = task.assignee?._id || task.assignee?.id || task.assignee;
        const assigneeInfo = resolveAssigneeInfo(assigneeId, members, users);
        const matchedName = assigneeInfo?.name || task.assigneeName || 'Thành viên';
        const matchedPhone = assigneeInfo?.phone || '';

        setRecipientName(matchedName);
        setRecipientPhone(matchedPhone);


        const eventTitle = event.title || 'Sự kiện';
        const taskDueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Sớm nhất';
        const defaultText = `Xin chào ${matchedName || 'bạn'}, bạn được phân công nhiệm vụ "${task.name}" trong sự kiện "${eventTitle}". Hạn hoàn thành: ${taskDueDate}. Vui lòng kiểm tra và cập nhật tiến độ thực hiện nhé!`;
        setMessage(defaultText);
        setFeedback(null);
    }, [task, isOpen, event, users, members]);

    if (!isOpen || !task) return null;

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!recipientPhone.trim()) {
            dialog.alert('Vui lòng nhập số điện thoại Zalo của người nhận', { title: 'Thiếu thông tin', type: 'warning' });
            return;
        }
        if (!message.trim()) {
            dialog.alert('Nội dung tin nhắn không được để trống', { title: 'Thiếu thông tin', type: 'warning' });
            return;
        }

        setIsSending(true);
        setFeedback(null);
        try {
            const res = await fetch(`/api/events/${event._id}/zalo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipients: [{
                        name: recipientName.trim() || 'Thành viên',
                        phone: recipientPhone.trim(),
                        taskName: task.name,
                        dueDate: task.dueDate,
                    }],
                    message: message.trim(),
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setFeedback({ type: 'success', text: data.message || 'Đã gửi tin nhắn Zalo thành công!' });
                dialog.toast('Đã gửi tin nhắn Zalo thành công!', 'success');
                onSendSuccess?.(data.history);
                setTimeout(() => {
                    onClose?.();
                }, 1500);
            } else {
                setFeedback({ type: 'error', text: data.message || 'Gửi thất bại' });
            }
        } catch (err) {
            console.error('Error sending Zalo message:', err);
            setFeedback({ type: 'error', text: 'Lỗi kết nối máy chủ khi gửi tin nhắn' });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <EventModal
            isOpen={isOpen}
            onClose={onClose}
            title="Gửi Tin Nhắn Zalo Giao Việc"
            subtitle={`Nhiệm vụ: ${task.name}`}
            icon={IconMessageSquare}
            maxWidth="max-w-lg"
            onSubmit={handleSend}
            submitLabel={isSending ? 'Đang gửi qua Zalo...' : 'Gửi qua Zalo'}
            cancelLabel="Hủy"
            loading={isSending}
        >
            <div className="flex flex-col gap-3.5 text-xs sm:text-sm">
                {feedback && (
                    <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                        feedback.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                    }`}>
                        {feedback.type === 'success' ? <IconCheckCircle className="w-4 h-4 shrink-0" /> : <IconAlertCircle className="w-4 h-4 shrink-0" />}
                        <span>{feedback.text}</span>
                    </div>
                )}

                {/* Recipient Details Card */}
                <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex flex-col gap-3">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                        Thông tin người nhận
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1 mb-1">
                                <IconUser className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                <span>Tên người nhận</span>
                            </label>
                            <input
                                type="text"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                                placeholder="Họ và tên..."
                                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1 mb-1">
                                <IconPhone className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                <span>Số điện thoại Zalo <span className="text-rose-500">*</span></span>
                            </label>
                            <input
                                type="tel"
                                required
                                value={recipientPhone}
                                onChange={(e) => setRecipientPhone(e.target.value)}
                                placeholder="Ví dụ: 0901234567"
                                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm font-mono font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Message Content Card */}
                <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex flex-col gap-2">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                        Nội dung tin nhắn gửi tự động
                    </span>
                    <textarea
                        rows={4}
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed resize-none transition-all"
                    />
                </div>
            </div>
        </EventModal>
    );
}
