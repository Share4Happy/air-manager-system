'use client';
import React, { useState, useEffect } from 'react';
import { formatDate } from '@/function';
import {
    IconClose,
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

export default function ShareEventModal({
    isOpen,
    onClose,
    event,
    onUpdateEvent,
}) {
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
            } else {
                alert(data.message || 'Lỗi khi lưu cấu hình');
            }
        } catch (err) {
            console.error('Error updating share config:', err);
            alert('Đã xảy ra lỗi');
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
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleRegenerateToken = async () => {
        if (!confirm('Bạn có chắc chắn muốn đổi mã liên kết mới? Liên kết cũ sẽ không thể truy cập được nữa.')) return;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-[var(--bg-primary)] w-full max-w-xl rounded-3xl border border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                            <IconLink className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                                Chia sẻ Sự kiện cho Người ngoài
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)]">
                                Cho phép trường học, đối tác, khách mời xem kế hoạch mà không cần đăng nhập
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] flex items-center justify-center cursor-pointer transition-colors"
                    >
                        <IconClose className="w-4 h-4" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-5">
                    {/* 1. Public Toggle Banner */}
                    <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        shareConfig.isPublic && !isExpired
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                            : isExpired
                                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                                : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'
                    }`}>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-[var(--text-primary)]">
                                {shareConfig.isPublic && !isExpired
                                    ? 'Đang Mở Chia sẻ Công khai'
                                    : isExpired
                                        ? 'Đã Hết Hạn 30 Ngày (Tự Động Đóng)'
                                        : 'Đang Tắt (Không ai xem được)'}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)]">
                                {shareConfig.isPublic && !isExpired
                                    ? 'Bất kỳ ai có liên kết đều có thể truy cập xem nội dung.'
                                    : isExpired
                                        ? 'Liên kết đã tự động đóng sau 30 ngày. Bấm Mở lại để cấp thêm 30 ngày.'
                                        : 'Người ngoài sẽ bị chặn khi truy cập liên kết.'}
                            </span>
                        </div>

                        {isExpired ? (
                            <button
                                type="button"
                                onClick={handleRenew}
                                disabled={saving}
                                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border-none cursor-pointer shadow-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                            >
                                Mở lại liên kết (30 ngày)
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleTogglePublic}
                                disabled={saving}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border-none cursor-pointer shadow-xs shrink-0 ${
                                    shareConfig.isPublic
                                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                            >
                                {shareConfig.isPublic ? 'Tắt chia sẻ' : 'Bật chia sẻ'}
                            </button>
                        )}
                    </div>

                    {/* 2. Link & 30-Day Expiration Box (When enabled) */}
                    {shareConfig.isPublic && (
                        <div className="flex flex-col gap-4 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={publicUrl}
                                    className="flex-1 px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm font-mono text-blue-600 dark:text-blue-400 select-all"
                                />
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all border-none cursor-pointer shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                                >
                                    <IconCheck className={copied ? 'w-4 h-4 text-emerald-300' : 'w-4 h-4'} />
                                    <span>{copied ? 'Đã sao chép!' : 'Sao chép link'}</span>
                                </button>
                                <a
                                    href={publicUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] text-xs font-semibold flex items-center justify-center gap-1 text-decoration-none shrink-0"
                                    title="Mở xem thử"
                                >
                                    <IconExternalLink className="w-4 h-4" />
                                </a>
                            </div>

                            {/* 30-Day Expiration Details & Renew Controls */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border-color)]">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                        isExpired
                                            ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600'
                                            : 'bg-blue-100 dark:bg-blue-950/50 text-blue-600'
                                    }`}>
                                        <IconClock className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-[var(--text-primary)]">
                                            {isExpired
                                                ? 'Đã hết hạn 30 ngày (Đã đóng link)'
                                                : shareConfig.expiresAt
                                                    ? `Hạn dùng: ${formatDate(shareConfig.expiresAt)} (còn ${remainingDays} ngày)`
                                                    : 'Thời hạn: 30 ngày'}
                                        </span>
                                        <span className="text-[11px] text-[var(--text-secondary)]">
                                            Tự động đóng link sau 30 ngày để bảo mật
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <button
                                        type="button"
                                        onClick={handleRenew}
                                        disabled={saving}
                                        className="px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-semibold cursor-pointer transition-colors"
                                        title="Kéo dài hạn chia sẻ thêm 30 ngày kể từ hôm nay"
                                    >
                                        Gia hạn 30 ngày
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleRegenerateToken}
                                        disabled={saving}
                                        className="text-xs text-rose-500 hover:text-rose-600 font-semibold border-none bg-transparent cursor-pointer"
                                    >
                                        Đổi mã link mới
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. PIN Code Protection */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                            <IconLock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Mật khẩu bảo vệ PIN (Tùy chọn)</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                maxLength={8}
                                value={shareConfig.pinCode}
                                onChange={(e) => setShareConfig({ ...shareConfig, pinCode: e.target.value })}
                                placeholder="Để trống nếu không cần mã PIN (ví dụ: 2026)"
                                className="flex-1 px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs sm:text-sm text-[var(--text-primary)] font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <span className="text-[11px] text-[var(--text-secondary)]">
                            Nếu đặt mã PIN, người ngoài phải nhập đúng mã này mới xem được sự kiện.
                        </span>
                    </div>

                    {/* 4. Select Allowed Tabs */}
                    <div className="flex flex-col gap-2.5">
                        <label className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                            Chọn các Tab cho phép người ngoài xem:
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                                { id: 'roadmap', label: 'Lộ trình & Tiến độ (Roadmap)', icon: IconTree },
                                { id: 'stations', label: 'Kịch bản Trạm & Phân khu', icon: IconStation },
                                { id: 'equipment', label: 'Danh mục Thiết bị & CSVC', icon: IconPackage },
                                { id: 'staff', label: 'Thành viên & Phân công', icon: IconUsers },
                                { id: 'media', label: 'Album Ảnh Google Drive', icon: IconCamera },
                            ].map(tab => (
                                <label
                                    key={tab.id}
                                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] cursor-pointer text-xs sm:text-sm font-semibold text-[var(--text-primary)] transition-colors"
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
                                        className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                                    />
                                    <span>{tab.label}</span>
                                </label>
                            ))}
                        </div>

                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                            <IconLock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span><strong>Lưu ý bảo mật:</strong> Dữ liệu <strong>Ngân sách & Thu chi (Budget)</strong> luôn được hệ thống tự động ẩn đối với người ngoài.</span>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 sm:p-5 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold hover:bg-[var(--bg-secondary)] cursor-pointer"
                    >
                        Đóng
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSave()}
                        disabled={saving}
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs border-none cursor-pointer flex items-center gap-1.5"
                    >
                        <IconCheck className="w-4 h-4" />
                        <span>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
