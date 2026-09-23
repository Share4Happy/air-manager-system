'use client';
import React, { useState, useEffect } from 'react';
import { formatDate } from '@/function';
import {
    IconCheck,
    IconLock,
    IconExternalLink,
    IconClock,
    IconLink,
    IconTree,
    IconStation,
    IconPackage,
    IconUsers,
    IconCamera,
} from '@/app/events/ui/icons';
import { EventModal, useEventDialog } from '@/app/events/ui/common';

export default function ShareEventModal({
    isOpen,
    onClose,
    event,
    onUpdateEvent,
}) {
    const dialog = useEventDialog();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [shareConfig, setShareConfig] = useState({
        isPublic: false,
        shareToken: '',
        pinCode: '',
        expiresAt: null,
        allowedTabs: {
            roadmap: true,
            stations: true,
            equipment: true,
            staff: true,
            media: true,
            budget: false,
            retro: false,
        },
    });

    const [origin, setOrigin] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
    }, []);

    useEffect(() => {
        if (isOpen && event?._id) {
            fetchShareConfig();
        }
    }, [isOpen, event?._id]);

    const fetchShareConfig = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/events/${event._id}/share`);
            const data = await res.json();
            if (res.ok && data.success && data.shareConfig) {
                setShareConfig({
                    isPublic: Boolean(data.shareConfig.isPublic),
                    shareToken: data.shareConfig.shareToken || '',
                    pinCode: data.shareConfig.pinCode || '',
                    expiresAt: data.shareConfig.expiresAt || null,
                    allowedTabs: {
                        roadmap: data.shareConfig.allowedTabs?.roadmap !== false,
                        stations: data.shareConfig.allowedTabs?.stations !== false,
                        equipment: data.shareConfig.allowedTabs?.equipment !== false,
                        staff: data.shareConfig.allowedTabs?.staff !== false,
                        media: data.shareConfig.allowedTabs?.media !== false,
                        budget: Boolean(data.shareConfig.allowedTabs?.budget),
                        retro: Boolean(data.shareConfig.allowedTabs?.retro),
                    },
                });
            }
        } catch (err) {
            console.error('Error fetching share config:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (updatedConfig = shareConfig) => {
        try {
            setSaving(true);
            const res = await fetch(`/api/events/${event._id}/share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedConfig),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setShareConfig(data.shareConfig);
                onUpdateEvent?.({ shareConfig: data.shareConfig });
                dialog.toast('Đã lưu cấu hình chia sẻ thành công', 'success');
            } else {
                dialog.alert(data.message || 'Lỗi khi lưu cấu hình', { type: 'danger' });
            }
        } catch (err) {
            console.error('Error updating share config:', err);
            dialog.alert('Đã xảy ra lỗi khi lưu cấu hình', { type: 'danger' });
        } finally {
            setSaving(false);
        }
    };

    const handleTogglePublic = () => {
        const next = { ...shareConfig, isPublic: !shareConfig.isPublic };
        setShareConfig(next);
        handleSave(next);
    };

    const handleRenew = async () => {
        try {
            setSaving(true);
            const res = await fetch(`/api/events/${event._id}/share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ renew: true }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setShareConfig(data.shareConfig);
                onUpdateEvent?.({ shareConfig: data.shareConfig });
                dialog.toast('Đã gia hạn liên kết chia sẻ thêm 30 ngày', 'success');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleRegenerateToken = async () => {
        const ok = await dialog.confirm('Bạn có chắc chắn muốn đổi mã liên kết mới? Liên kết cũ sẽ không thể truy cập được nữa.', {
            title: 'Tạo lại liên kết chia sẻ',
            type: 'warning',
            confirmText: 'Tạo mã mới',
        });
        if (!ok) return;

        try {
            setSaving(true);
            const res = await fetch(`/api/events/${event._id}/share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ regenerateToken: true }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setShareConfig(data.shareConfig);
                onUpdateEvent?.({ shareConfig: data.shareConfig });
                dialog.toast('Đã tạo liên kết chia sẻ mới thành công', 'success');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const getRemainingDays = (expiresAt) => {
        if (!expiresAt) return 0;
        const diff = new Date(expiresAt).getTime() - Date.now();
        if (diff <= 0) return 0;
        return Math.ceil(diff / (24 * 60 * 60 * 1000));
    };

    const remainingDays = getRemainingDays(shareConfig.expiresAt);
    const isExpired = shareConfig.expiresAt ? new Date(shareConfig.expiresAt) < new Date() : false;
    const publicUrl = shareConfig.shareToken ? `${origin}/share/events/${shareConfig.shareToken}` : '';

    const handleCopy = () => {
        if (!publicUrl) return;
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <EventModal
            isOpen={isOpen}
            onClose={onClose}
            title="Chia sẻ Sự kiện cho Người ngoài"
            subtitle="Cho phép đối tác, trường học hoặc phụ huynh xem nội dung sự kiện mà không cần đăng nhập"
            icon={IconLink}
            maxWidth="max-w-xl"
            onSubmit={() => handleSave()}
            submitLabel={saving ? 'Đang lưu...' : 'Lưu cấu hình'}
            cancelLabel="Đóng"
        >
            <div className="flex flex-col gap-4">
                {/* 1. Public Toggle Banner */}
                <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    shareConfig.isPublic && !isExpired
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : isExpired
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-[var(--bg-secondary)]/40 border-[var(--border-color)]'
                }`}>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                            {shareConfig.isPublic && !isExpired
                                ? 'Đang Mở Chia sẻ Công khai'
                                : isExpired
                                    ? 'Đã Hết Hạn 30 Ngày (Tự Động Đóng)'
                                    : 'Đang Tắt (Không ai xem được)'}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">
                            {shareConfig.isPublic && !isExpired
                                ? 'Bất kỳ ai có liên kết đều có thể truy cập xem nội dung cho phép.'
                                : isExpired
                                    ? 'Liên kết đã tự động đóng sau 30 ngày. Bấm Gia hạn để cấp thêm 30 ngày.'
                                    : 'Người ngoài sẽ bị chặn khi truy cập liên kết.'}
                        </span>
                    </div>

                    {isExpired ? (
                        <button
                            type="button"
                            onClick={handleRenew}
                            disabled={saving}
                            className="px-4 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer shadow-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                        >
                            Gia hạn 30 ngày
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleTogglePublic}
                            disabled={saving}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer shadow-xs shrink-0 ${
                                shareConfig.isPublic
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                        >
                            {shareConfig.isPublic ? 'Tắt chia sẻ' : 'Bật chia sẻ'}
                        </button>
                    )}
                </div>

                {/* 2. Link & Expiration Details Box (When enabled) */}
                {shareConfig.isPublic && (
                    <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--bg-secondary)]/30 border border-[var(--border-color)] flex flex-col gap-3">
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                            Liên kết chia sẻ trực tiếp
                        </span>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                                type="text"
                                readOnly
                                value={publicUrl}
                                className="flex-1 px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs font-mono text-blue-600 dark:text-blue-400 select-all"
                            />
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all border-none cursor-pointer shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                            >
                                <IconCheck className={copied ? 'w-3.5 h-3.5 text-emerald-300' : 'w-3.5 h-3.5'} />
                                <span>{copied ? 'Đã chép!' : 'Sao chép'}</span>
                            </button>
                            <a
                                href={publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] text-xs font-semibold flex items-center justify-center gap-1 text-decoration-none shrink-0"
                                title="Mở trang xem thử"
                            >
                                <IconExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>

                        {/* Expiration Details & Renew */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-2.5 border-t border-[var(--border-color)]">
                            <div className="flex items-center gap-2">
                                <IconClock className="w-4 h-4 text-blue-600 shrink-0" />
                                <span className="text-xs font-medium text-[var(--text-secondary)]">
                                    {isExpired
                                        ? 'Đã hết hạn 30 ngày (Đã đóng link)'
                                        : shareConfig.expiresAt
                                            ? `Hạn dùng: ${formatDate(shareConfig.expiresAt)} (còn ${remainingDays} ngày)`
                                            : 'Thời hạn: 30 ngày'}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-auto">
                                <button
                                    type="button"
                                    onClick={handleRenew}
                                    disabled={saving}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold border-none bg-transparent cursor-pointer"
                                >
                                    +30 ngày
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRegenerateToken}
                                    disabled={saving}
                                    className="text-xs text-rose-500 hover:text-rose-600 font-semibold border-none bg-transparent cursor-pointer"
                                >
                                    Đổi mã liên kết mới
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. PIN Code Protection */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--bg-secondary)]/30 border border-[var(--border-color)] flex flex-col gap-2.5">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                        <IconLock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Mật khẩu bảo vệ PIN (Tùy chọn)</span>
                    </span>
                    <input
                        type="text"
                        maxLength={8}
                        value={shareConfig.pinCode}
                        onChange={(e) => setShareConfig({ ...shareConfig, pinCode: e.target.value })}
                        placeholder="Để trống nếu không cần mã PIN (ví dụ: 2026)"
                        className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <span className="text-[11px] text-[var(--text-secondary)]">
                        Nếu đặt mã PIN, người ngoài phải nhập đúng mã này mới xem được kế hoạch sự kiện.
                    </span>
                </div>

                {/* 4. Select Allowed Tabs */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--bg-secondary)]/30 border border-[var(--border-color)] flex flex-col gap-3">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                        Các tab cho phép người ngoài xem
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                            { id: 'roadmap', label: 'Lộ trình công việc', icon: IconTree },
                            { id: 'stations', label: 'Kịch bản Trạm & Phân khu', icon: IconStation },
                            { id: 'equipment', label: 'Danh mục Thiết bị & CSVC', icon: IconPackage },
                            { id: 'staff', label: 'Thành viên & Phân công', icon: IconUsers },
                            { id: 'media', label: 'Album Ảnh Google Drive', icon: IconCamera },
                        ].map(tab => {
                            const TabIcon = tab.icon;
                            return (
                                <label
                                    key={tab.id}
                                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] cursor-pointer text-xs font-semibold text-[var(--text-primary)] transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={shareConfig.allowedTabs?.[tab.id] !== false}
                                        onChange={(e) => setShareConfig({
                                            ...shareConfig,
                                            allowedTabs: {
                                                ...shareConfig.allowedTabs,
                                                [tab.id]: e.target.checked,
                                            },
                                        })}
                                        className="w-4 h-4 rounded text-blue-600 cursor-pointer accent-blue-600"
                                    />
                                    <TabIcon className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
                                    <span>{tab.label}</span>
                                </label>
                            );
                        })}
                    </div>

                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                        <IconLock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-relaxed"><strong>Lưu ý bảo mật:</strong> Dữ liệu <strong>Ngân sách & Thu chi (Budget)</strong> luôn được hệ thống tự động bảo mật và ẩn đối với người ngoài.</span>
                    </div>
                </div>
            </div>
        </EventModal>
    );
}
