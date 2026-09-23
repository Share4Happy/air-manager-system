'use client';
import React, { useState } from 'react';
import { formatDate } from '@/function';
import {
    IconMessageSquare,
    IconSend,
    IconCheck,
    IconUsers,
    IconCheckCircle,
    IconAlertCircle,
    IconCalendar,
    IconUser,
    IconSparkles,
} from '@/app/events/ui/icons';
import { useEventDialog } from '@/app/events/ui/common';

export default function EventZaloConfigView({
    event = {},
    users = [],
    members = [],
    roadmap = [],
    onUpdateZaloConfig,
    readOnly = false,
}) {
    const dialog = useEventDialog();
    const { title, location, startDate } = event;
    const zaloConfig = event.zaloConfig || {};

    const [templates, setTemplates] = useState({
        templateReminder: zaloConfig.templateReminder || 'Xin chào {name}, nhắc bạn sự kiện "{event_title}" sẽ diễn ra vào {event_date} tại {event_location}. Rất mong sự có mặt của bạn!',
        templateTaskAssign: zaloConfig.templateTaskAssign || 'Xin chào {name}, bạn được giao nhiệm vụ "{task_name}" trong sự kiện "{event_title}". Hạn hoàn thành: {due_date}.',
        templateThankYou: zaloConfig.templateThankYou || 'Cảm ơn {name} đã đồng hành và tham gia sự kiện "{event_title}". Chúc bạn một ngày tuyệt vời!',
    });

    const [activeTemplateTab, setActiveTemplateTab] = useState('reminder'); // 'reminder' | 'task' | 'thankyou' | 'custom'
    const [customMessage, setCustomMessage] = useState(zaloConfig.customMessage || '');
    const [recipientType, setRecipientType] = useState('staff'); // 'staff' | 'all' | 'custom' | 'manual'
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [manualPhone, setManualPhone] = useState('');
    const [manualName, setManualName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sendFeedback, setSendFeedback] = useState(null);

    // Build contacts with phone
    const staffContacts = users
        .filter(u => u.phone)
        .map(u => ({
            id: u._id,
            name: u.name,
            phone: u.phone,
            role: Array.isArray(u.role) ? u.role.join(', ') : (u.role || 'Nhân sự'),
            type: 'staff',
        }));

    const memberContacts = members
        .filter(m => m.phone)
        .map(m => ({
            id: m.id,
            name: m.name,
            phone: m.phone,
            role: m.role || 'Thành viên',
            type: 'member',
        }));

    // Deduplicate contacts
    const allContactsMap = new Map();
    [...staffContacts, ...memberContacts].forEach(c => {
        if (!allContactsMap.has(c.phone)) {
            allContactsMap.set(c.phone, c);
        }
    });
    const allContacts = Array.from(allContactsMap.values());

    const getActiveMessageTemplate = () => {
        if (activeTemplateTab === 'reminder') return templates.templateReminder;
        if (activeTemplateTab === 'task') return templates.templateTaskAssign;
        if (activeTemplateTab === 'thankyou') return templates.templateThankYou;
        return customMessage;
    };

    const handleInsertTag = (tag) => {
        if (activeTemplateTab === 'reminder') {
            setTemplates(prev => ({ ...prev, templateReminder: prev.templateReminder + tag }));
        } else if (activeTemplateTab === 'task') {
            setTemplates(prev => ({ ...prev, templateTaskAssign: prev.templateTaskAssign + tag }));
        } else if (activeTemplateTab === 'thankyou') {
            setTemplates(prev => ({ ...prev, templateThankYou: prev.templateThankYou + tag }));
        } else {
            setCustomMessage(prev => prev + tag);
        }
    };

    const handleSaveTemplates = (e) => {
        e?.preventDefault();
        setIsSaving(true);
        const newZaloConfig = {
            ...zaloConfig,
            templateReminder: templates.templateReminder,
            templateTaskAssign: templates.templateTaskAssign,
            templateThankYou: templates.templateThankYou,
            customMessage: customMessage,
        };

        onUpdateZaloConfig?.(newZaloConfig);
        setIsSaving(false);
        dialog.toast('Đã lưu cấu hình mẫu tin nhắn Zalo!', 'success');
        setSendFeedback({ type: 'success', text: '✓ Đã lưu cấu hình mẫu tin nhắn Zalo thành công!' });
        setTimeout(() => setSendFeedback(null), 3000);
    };

    const handleSendZalo = async (e) => {
        e?.preventDefault();
        const msg = getActiveMessageTemplate();
        if (!msg.trim()) {
            dialog.alert('Nội dung tin nhắn không được để trống', { title: 'Thiếu thông tin', type: 'warning' });
            return;
        }

        let recipientsToSend = [];
        if (recipientType === 'staff') {
            recipientsToSend = staffContacts;
        } else if (recipientType === 'all') {
            recipientsToSend = allContacts;
        } else if (recipientType === 'custom') {
            recipientsToSend = allContacts.filter(c => selectedMembers.includes(c.id));
        } else if (recipientType === 'manual') {
            if (!manualPhone.trim()) {
                dialog.alert('Vui lòng nhập số điện thoại người nhận', { title: 'Thiếu thông tin', type: 'warning' });
                return;
            }
            recipientsToSend = [{ name: manualName.trim() || 'Thành viên', phone: manualPhone.trim() }];
        }

        if (recipientsToSend.length === 0) {
            dialog.alert('Không tìm thấy người nhận nào có số điện thoại hợp lệ', { title: 'Không có người nhận', type: 'warning' });
            return;
        }

        const ok = await dialog.confirm(`Bạn có chắc chắn muốn gửi tin nhắn Zalo đến ${recipientsToSend.length} người nhận?`, {
            title: 'Xác nhận gửi Zalo',
            type: 'info',
            confirmText: 'Gửi tin nhắn',
        });
        if (!ok) return;

        setIsSending(true);
        setSendFeedback(null);
        try {
            const res = await fetch(`/api/events/${event._id}/zalo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipients: recipientsToSend,
                    message: msg,
                    templateType: activeTemplateTab,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSendFeedback({
                    type: 'success',
                    text: `✓ ${data.message || 'Đã gửi tin nhắn Zalo thành công!'}`,
                });
                if (data.history) {
                    onUpdateZaloConfig?.({
                        ...zaloConfig,
                        history: data.history,
                    });
                }
            } else {
                setSendFeedback({
                    type: 'error',
                    text: `⚠ ${data.message || 'Gửi thất bại'}`,
                });
            }
        } catch (err) {
            console.error(err);
            setSendFeedback({ type: 'error', text: 'Đã có lỗi xảy ra khi kết nối máy chủ' });
        } finally {
            setIsSending(false);
        }
    };

    const historyLogs = zaloConfig.history || [];

    return (
        <div className="flex flex-col gap-6">
            {sendFeedback && (
                <div className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in shadow-xs ${
                    sendFeedback.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                }`}>
                    {sendFeedback.type === 'success' ? <IconCheckCircle className="w-4 h-4" /> : <IconAlertCircle className="w-4 h-4" />}
                    <span>{sendFeedback.text}</span>
                </div>
            )}

            {/* Grid 2 Columns: Templates & Broadcast Sender */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Column 1: Mẫu tin nhắn (Templates) */}
                <div className="lg:col-span-6 flex flex-col gap-4 bg-[var(--bg-primary)] p-4 sm:p-5 rounded-2xl border border-[var(--border-color)] shadow-xs">
                    <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                        <div className="flex items-center gap-2">
                            <IconSparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <h3 className="text-sm font-bold text-[var(--text-primary)]">Mẫu Tin nhắn Thiết lập</h3>
                        </div>
                        {!readOnly && (
                            <button
                                type="button"
                                onClick={handleSaveTemplates}
                                disabled={isSaving}
                                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer border-none shadow-2xs transition-all disabled:opacity-50"
                            >
                                <IconCheck className="w-3.5 h-3.5" />
                                <span>{isSaving ? 'Đang lưu...' : 'Lưu mẫu tin'}</span>
                            </button>
                        )}
                    </div>

                    {/* Template Select Tabs */}
                    <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)] text-xs font-semibold overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTemplateTab('reminder')}
                            className={`px-3 py-1.5 rounded-lg border-none cursor-pointer transition-all whitespace-nowrap ${
                                activeTemplateTab === 'reminder'
                                    ? 'bg-[var(--bg-primary)] text-blue-600 font-bold shadow-2xs'
                                    : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            1. Nhắc lịch sự kiện
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTemplateTab('task')}
                            className={`px-3 py-1.5 rounded-lg border-none cursor-pointer transition-all whitespace-nowrap ${
                                activeTemplateTab === 'task'
                                    ? 'bg-[var(--bg-primary)] text-blue-600 font-bold shadow-2xs'
                                    : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            2. Giao nhiệm vụ
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTemplateTab('thankyou')}
                            className={`px-3 py-1.5 rounded-lg border-none cursor-pointer transition-all whitespace-nowrap ${
                                activeTemplateTab === 'thankyou'
                                    ? 'bg-[var(--bg-primary)] text-blue-600 font-bold shadow-2xs'
                                    : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            3. Cảm ơn / Tổng kết
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTemplateTab('custom')}
                            className={`px-3 py-1.5 rounded-lg border-none cursor-pointer transition-all whitespace-nowrap ${
                                activeTemplateTab === 'custom'
                                    ? 'bg-[var(--bg-primary)] text-blue-600 font-bold shadow-2xs'
                                    : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            4. Tin tùy chỉnh
                        </button>
                    </div>

                    {/* Template Content Editor */}
                    <div className="flex flex-col gap-2.5">
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">
                            Nội dung tin nhắn:
                        </span>
                        {activeTemplateTab === 'reminder' && (
                            <textarea
                                rows={4}
                                value={templates.templateReminder}
                                onChange={(e) => setTemplates({ ...templates, templateReminder: e.target.value })}
                                className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
                            />
                        )}
                        {activeTemplateTab === 'task' && (
                            <textarea
                                rows={4}
                                value={templates.templateTaskAssign}
                                onChange={(e) => setTemplates({ ...templates, templateTaskAssign: e.target.value })}
                                className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
                            />
                        )}
                        {activeTemplateTab === 'thankyou' && (
                            <textarea
                                rows={4}
                                value={templates.templateThankYou}
                                onChange={(e) => setTemplates({ ...templates, templateThankYou: e.target.value })}
                                className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
                            />
                        )}
                        {activeTemplateTab === 'custom' && (
                            <textarea
                                rows={4}
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                placeholder="Nhập tin nhắn tùy ý để gửi..."
                                className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
                            />
                        )}

                        {/* Helper Tag Pills */}
                        <div className="flex flex-col gap-1.5 pt-1">
                            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Bấm để chèn biến tự động:</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {['{name}', '{event_title}', '{event_date}', '{event_location}', '{task_name}', '{due_date}'].map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => handleInsertTag(tag)}
                                        className="px-2 py-1 rounded-md bg-[var(--bg-secondary)] hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 border border-[var(--border-color)] text-[11px] font-mono text-[var(--text-primary)] cursor-pointer transition-colors"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 2: Gửi tin nhắn trực tiếp (Broadcast Sender) */}
                <div className="lg:col-span-6 flex flex-col gap-4 bg-[var(--bg-primary)] p-4 sm:p-5 rounded-2xl border border-[var(--border-color)] shadow-xs">
                    <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                        <div className="flex items-center gap-2">
                            <IconSend className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <h3 className="text-sm font-bold text-[var(--text-primary)]">Gửi Tin Nhắn Zalo Ngay</h3>
                        </div>
                    </div>

                    {/* Choose Recipient Target */}
                    <div className="flex flex-col gap-3">
                        <div>
                            <span className="text-xs font-semibold text-[var(--text-primary)] block mb-1.5">
                                Chọn nhóm người nhận:
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                                <label className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                                    recipientType === 'staff'
                                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                                        : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]'
                                }`}>
                                    <input
                                        type="radio"
                                        name="recipientType"
                                        checked={recipientType === 'staff'}
                                        onChange={() => setRecipientType('staff')}
                                        className="accent-blue-600"
                                    />
                                    <span>Ban tổ chức ({staffContacts.length})</span>
                                </label>

                                <label className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                                    recipientType === 'all'
                                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                                        : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]'
                                }`}>
                                    <input
                                        type="radio"
                                        name="recipientType"
                                        checked={recipientType === 'all'}
                                        onChange={() => setRecipientType('all')}
                                        className="accent-blue-600"
                                    />
                                    <span>Toàn bộ thành viên ({allContacts.length})</span>
                                </label>

                                <label className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                                    recipientType === 'custom'
                                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                                        : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]'
                                }`}>
                                    <input
                                        type="radio"
                                        name="recipientType"
                                        checked={recipientType === 'custom'}
                                        onChange={() => setRecipientType('custom')}
                                        className="accent-blue-600"
                                    />
                                    <span>Chọn từng người</span>
                                </label>

                                <label className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                                    recipientType === 'manual'
                                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                                        : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]'
                                }`}>
                                    <input
                                        type="radio"
                                        name="recipientType"
                                        checked={recipientType === 'manual'}
                                        onChange={() => setRecipientType('manual')}
                                        className="accent-blue-600"
                                    />
                                    <span>Nhập SĐT tùy ý</span>
                                </label>
                            </div>
                        </div>

                        {/* Custom Member Checkboxes */}
                        {recipientType === 'custom' && (
                            <div className="max-h-40 overflow-y-auto p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col gap-1.5 text-xs">
                                {allContacts.length === 0 ? (
                                    <span className="text-[var(--text-secondary)] italic">Chưa có thành viên nào có số điện thoại.</span>
                                ) : (
                                    allContacts.map(c => (
                                        <label key={c.id} className="flex items-center gap-2 p-1 hover:bg-[var(--bg-primary)] rounded-lg cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedMembers.includes(c.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedMembers([...selectedMembers, c.id]);
                                                    } else {
                                                        setSelectedMembers(selectedMembers.filter(id => id !== c.id));
                                                    }
                                                }}
                                                className="accent-blue-600 rounded"
                                            />
                                            <span className="font-semibold text-[var(--text-primary)]">{c.name}</span>
                                            <span className="text-[var(--text-secondary)]">({c.phone} - {c.role})</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Manual Phone Input */}
                        {recipientType === 'manual' && (
                            <div className="grid grid-cols-2 gap-2.5">
                                <input
                                    type="text"
                                    placeholder="Tên người nhận"
                                    value={manualName}
                                    onChange={e => setManualName(e.target.value)}
                                    className="px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <input
                                    type="tel"
                                    placeholder="Số điện thoại Zalo *"
                                    value={manualPhone}
                                    onChange={e => setManualPhone(e.target.value)}
                                    className="px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        )}

                        {/* Live Message Preview */}
                        <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">Xem trước tin nhắn sẽ gửi:</span>
                            <p className="text-xs text-[var(--text-primary)] leading-relaxed italic m-0">
                                "{getActiveMessageTemplate()
                                    .replaceAll('{name}', 'Nguyễn Văn A')
                                    .replaceAll('{member_name}', 'Nguyễn Văn A')
                                    .replaceAll('{event_title}', title || 'Sự kiện')
                                    .replaceAll('{event_location}', location || 'Địa điểm tổ chức')
                                    .replaceAll('{event_date}', startDate ? new Date(startDate).toLocaleDateString('vi-VN') : 'Ngày diễn ra')
                                    .replaceAll('{task_name}', 'Chuẩn bị mô hình robot')
                                    .replaceAll('{due_date}', '15/09/2026')}"
                            </p>
                        </div>

                        {/* Send Button */}
                        {!readOnly && (
                            <button
                                type="button"
                                onClick={handleSendZalo}
                                disabled={isSending}
                                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 border-none cursor-pointer shadow-xs transition-all disabled:opacity-50"
                            >
                                <IconSend className="w-4 h-4" />
                                <span>{isSending ? 'Đang gửi tin qua Zalo...' : 'Bấm để Gửi Tin Nhắn Zalo'}</span>
                            </button>
                        )}

                    </div>
                </div>
            </div>

            {/* Bottom: Lịch sử gửi tin Zalo (Send Logs Table) */}
            <div className="bg-[var(--bg-primary)] p-4 sm:p-5 rounded-2xl border border-[var(--border-color)] shadow-xs flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <IconMessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">
                            Lịch sử Gửi Tin Zalo trong Sự kiện ({historyLogs.length})
                        </h3>
                    </div>
                </div>

                {historyLogs.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[var(--text-secondary)] italic border border-dashed border-[var(--border-color)] rounded-xl">
                        Chưa có lịch sử gửi tin nhắn Zalo nào cho sự kiện này.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                                    <th className="py-2.5 px-3 font-semibold">Thời gian</th>
                                    <th className="py-2.5 px-3 font-semibold">Người nhận</th>
                                    <th className="py-2.5 px-3 font-semibold">Số điện thoại</th>
                                    <th className="py-2.5 px-3 font-semibold">Nội dung tin</th>
                                    <th className="py-2.5 px-3 font-semibold">Trạng thái</th>
                                    <th className="py-2.5 px-3 font-semibold">Người gửi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)]">
                                {historyLogs.map((log, idx) => (
                                    <tr key={log.id || idx} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                                        <td className="py-2.5 px-3 whitespace-nowrap text-[var(--text-secondary)]">
                                            {log.sentAt ? new Date(log.sentAt).toLocaleString('vi-VN') : 'Vừa xong'}
                                        </td>
                                        <td className="py-2.5 px-3 font-semibold whitespace-nowrap">
                                            {log.recipientName}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                                            {log.recipientPhone}
                                        </td>
                                        <td className="py-2.5 px-3 max-w-xs truncate" title={log.message}>
                                            {log.message}
                                        </td>
                                        <td className="py-2.5 px-3 whitespace-nowrap">
                                            {log.status === 'success' ? (
                                                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                    ✓ Thành công
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" title={log.error}>
                                                    ⚠ Thất bại ({log.error || 'Lỗi'})
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2.5 px-3 text-[var(--text-secondary)] whitespace-nowrap">
                                            {log.senderName || 'Hệ thống'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
