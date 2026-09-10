'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/function';
import {
    IconTree,
    IconStation,
    IconUsers,
    IconDollar,
    IconCamera,
    IconFileText,
    IconChevronLeft,
    IconCalendar,
    IconLocation,
    IconTrash,
    IconEdit,
    IconClose,
    IconCheck,
    IconPackage,
} from '@/app/events/ui/icons';

import ShareEventModal from './ShareEventModal';

const statusOptions = [
    { value: 'planning', label: 'Đang chuẩn bị', dotColor: 'bg-slate-400' },
    { value: 'upcoming', label: 'Sắp diễn ra', dotColor: 'bg-blue-500' },
    { value: 'happening', label: 'Đang diễn ra (D-Day)', dotColor: 'bg-amber-500' },
    { value: 'completed', label: 'Đã hoàn thành', dotColor: 'bg-emerald-500' },
    { value: 'cancelled', label: 'Đã hủy', dotColor: 'bg-rose-500' },
];

export default function EventHeader({
    event,
    onStatusChange,
    activeTab,
    onTabChange,
    canViewBudget = false,
    onSaveAsTemplate,
    onDeleteEvent,
    onUpdateEvent,
    readOnly = false,
    allowedTabs = null,
}) {
    const {
        title,
        status = 'planning',
        startDate,
        endDate,
        location,
        description = '',
        participantsCount,
    } = event || {};

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        title: title || '',
        description: description || '',
        startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : '',
        endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : '',
        location: location || '',
    });

    const allNavTabs = [
        { id: 'roadmap', label: 'Lộ trình & Tiến độ', icon: IconTree },
        { id: 'stations', label: 'Kịch bản Trạm', icon: IconStation },
        { id: 'equipment', label: 'Thiết bị mang theo', icon: IconPackage },
        { id: 'staff', label: 'Thành viên & Nhân sự', icon: IconUsers },
        ...((canViewBudget || (allowedTabs && allowedTabs.budget)) ? [{ id: 'budget', label: 'Ngân sách & Thu chi', icon: IconDollar }] : []),
        { id: 'media', label: 'Album Ảnh Drive', icon: IconCamera },
        { id: 'retro', label: 'Tổng kết & Đánh giá', icon: IconFileText },
    ];

    const navTabs = allowedTabs
        ? allNavTabs.filter(t => allowedTabs[t.id] !== false)
        : allNavTabs;

    const formattedDateRange = () => {
        if (!startDate && !endDate) return 'Chưa đặt ngày';
        if (startDate && !endDate) return formatDate(startDate);
        if (!startDate && endDate) return formatDate(endDate);
        const startStr = formatDate(startDate);
        const endStr = formatDate(endDate);
        return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
    };

    const dateDisplay = formattedDateRange();

    const handleOpenEdit = () => {
        if (readOnly) return;
        setEditForm({
            title: title || '',
            description: description || '',
            startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : '',
            endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : '',
            location: location || '',
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = (e) => {
        e.preventDefault();
        onUpdateEvent?.({
            title: editForm.title.trim() || title,
            description: editForm.description.trim(),
            startDate: editForm.startDate ? new Date(editForm.startDate) : null,
            endDate: editForm.endDate ? new Date(editForm.endDate) : null,
            location: editForm.location.trim(),
        });
        setIsEditModalOpen(false);
    };

    const currentStatusOption = statusOptions.find(opt => opt.value === status) || statusOptions[0];

    return (
        <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xs flex flex-col">
            {/* Top Bar: Back button, Event Title, Description, Date, Location & Action Controls */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: Back Button + Event Name & Description & Date & Location */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {readOnly ? (
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0 mt-0.5 tracking-wider">
                            AIR
                        </div>
                    ) : (
                        <Link
                            href="/events"
                            className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] flex items-center justify-center transition-colors shrink-0 no-underline mt-0.5"
                            title="Quay lại danh sách sự kiện"
                        >
                            <IconChevronLeft className="w-5 h-5" />
                        </Link>
                    )}
                    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-3 min-w-0 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight truncate">
                                {title}
                            </h1>

                            {/* Date Badge */}
                            {readOnly ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/80 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold shrink-0">
                                    <IconCalendar className="w-4 h-4 text-blue-500" />
                                    <span>{dateDisplay}</span>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleOpenEdit}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 border border-blue-200/80 dark:border-blue-900/80 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold shrink-0 cursor-pointer transition-colors"
                                    title="Bấm để chỉnh sửa ngày diễn ra"
                                >
                                    <IconCalendar className="w-4 h-4 text-blue-500" />
                                    <span>{dateDisplay}</span>
                                </button>
                            )}

                            {/* Location Badge */}
                            {readOnly ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/80 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-semibold shrink-0">
                                    <IconLocation className="w-4 h-4 text-rose-500" />
                                    <span>{location || 'Chưa đặt địa điểm'}</span>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleOpenEdit}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 border border-rose-200/80 dark:border-rose-900/80 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-semibold shrink-0 cursor-pointer transition-colors"
                                    title="Bấm để chỉnh sửa địa điểm"
                                >
                                    <IconLocation className="w-4 h-4 text-rose-500" />
                                    <span>{location || 'Chưa đặt địa điểm'}</span>
                                </button>
                            )}

                            {/* Participants Badge (especially useful on public share) */}
                            {participantsCount > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/80 text-purple-700 dark:text-purple-300 text-xs sm:text-sm font-semibold shrink-0">
                                    <IconUsers className="w-4 h-4 text-purple-500" />
                                    <span>Dự kiến: {participantsCount} học sinh</span>
                                </span>
                            )}

                            {/* Quick Edit Icon */}
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={handleOpenEdit}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 border-none bg-transparent cursor-pointer transition-colors"
                                    title="Chỉnh sửa thông tin sự kiện"
                                >
                                    <IconEdit className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Description right below the title */}
                        {description && (
                            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed line-clamp-2 mt-0.5">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right: Action Controls (Status, Save Template, Delete / Print) */}
                <div className="flex items-center gap-3 flex-wrap shrink-0">
                    {readOnly ? (
                        <>
                            <div className="px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs sm:text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${currentStatusOption.dotColor}`} />
                                <span>{currentStatusOption.label}</span>
                            </div>

                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs print:hidden"
                                title="In kịch bản / Xuất PDF"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-600">
                                    <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
                                </svg>
                                <span>In kịch bản / PDF</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <select
                                value={status}
                                onChange={(e) => onStatusChange?.(e.target.value)}
                                className="px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm sm:text-base font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>

                            {/* Share Button */}
                            <button
                                type="button"
                                onClick={() => setIsShareModalOpen(true)}
                                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                                    event.shareConfig?.isPublic
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                                        : 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
                                }`}
                                title="Chia sẻ kế hoạch sự kiện cho người ngoài"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                </svg>
                                <span>{event.shareConfig?.isPublic ? 'Đang chia sẻ' : 'Chia sẻ'}</span>
                            </button>

                            {onSaveAsTemplate && (
                                <button
                                    onClick={onSaveAsTemplate}
                                    className="px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-sm font-semibold hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    <span>Lưu Mẫu</span>
                                </button>
                            )}

                            {onDeleteEvent && (
                                <button
                                    onClick={onDeleteEvent}
                                    className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-sm font-semibold hover:bg-rose-100 transition-colors cursor-pointer flex items-center gap-2"
                                >
                                    <IconTrash className="w-4 h-4" />
                                    <span>Xóa</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="px-4 sm:px-5 flex items-center gap-1.5 sm:gap-3 border-t border-[var(--border-color)] overflow-x-auto scrollbar-none bg-[var(--bg-secondary)]/30">
                {navTabs.map(t => {
                    const isActive = activeTab === t.id;
                    const TabIcon = t.icon;
                    return (
                        <button
                            key={t.id}
                            onClick={() => onTabChange?.(t.id)}
                            className={`py-3.5 px-3.5 sm:px-5 text-sm sm:text-base font-bold transition-all border-b-2 whitespace-nowrap bg-transparent cursor-pointer flex items-center gap-2 ${
                                isActive
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <TabIcon className={`w-4.5 h-4.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-secondary)]'}`} />
                            <span>{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Quick Edit Event Info Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-[var(--bg-primary)] w-full max-w-lg rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]">
                            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <IconEdit className="w-5 h-5 text-blue-600" />
                                <span>Chỉnh sửa Thông tin Sự kiện / Workshop</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] border border-[var(--border-color)] cursor-pointer"
                            >
                                <IconClose className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="p-4 sm:p-6 flex flex-col gap-4 text-sm">
                            <div>
                                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                                    Tên Sự kiện / Workshop *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    placeholder="Ví dụ: Workshop Trải nghiệm STEM & Tuyển sinh"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                                    Mô tả ngắn sự kiện
                                </label>
                                <textarea
                                    rows={2}
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    placeholder="Nhập tóm tắt nội dung, quy mô, đối tượng tham gia sự kiện..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                                        Ngày bắt đầu
                                    </label>
                                    <input
                                        type="date"
                                        value={editForm.startDate}
                                        onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                                        Ngày kết thúc
                                    </label>
                                    <input
                                        type="date"
                                        value={editForm.endDate}
                                        onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                                    Địa điểm tổ chức
                                </label>
                                <input
                                    type="text"
                                    value={editForm.location}
                                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                    placeholder="Ví dụ: Trường Tiểu học Hoà Bình, Q. Tân Bình"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors bg-transparent cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 border-none cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
                                >
                                    <IconCheck className="w-3.5 h-3.5" />
                                    <span>Lưu thay đổi</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Share Event Modal */}
            <ShareEventModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                event={event}
                onUpdateEvent={onUpdateEvent}
            />
        </div>
    );
}
