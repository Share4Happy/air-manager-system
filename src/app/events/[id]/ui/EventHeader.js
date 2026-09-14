'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    IconChevronRight,
    IconCalendar,
    IconLocation,
    IconTrash,
    IconEdit,
    IconClose,
    IconCheck,
    IconPackage,
    IconLink,
    IconExternalLink,
    IconCopy,
    IconMessageSquare,
    IconLayers,
} from '@/app/events/ui/icons';

import ShareEventModal from './ShareEventModal';
import { EventModal } from '@/app/events/ui/common';

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
        link = '',
        participantsCount,
    } = event || {};

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isCopiedLink, setIsCopiedLink] = useState(false);
    const [isFastLinkInputOpen, setIsFastLinkInputOpen] = useState(false);
    const [fastLinkValue, setFastLinkValue] = useState(link || '');
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const tabsContainerRef = useRef(null);

    const [editForm, setEditForm] = useState({
        title: title || '',
        description: description || '',
        startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : '',
        endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : '',
        location: location || '',
        link: link || '',
    });

    const allNavTabs = [
        { id: 'roadmap', label: 'Lộ trình & Tiến độ', icon: IconTree },
        { id: 'stations', label: 'Kịch bản Trạm', icon: IconStation },
        { id: 'equipment', label: 'Danh sách thiết bị', icon: IconPackage },
        { id: 'staff', label: 'Nhân sự', icon: IconUsers },
        ...((canViewBudget || (allowedTabs && allowedTabs.budget)) ? [{ id: 'budget', label: 'Ngân sách', icon: IconDollar }] : []),
        { id: 'zalo-config', label: 'Cấu hình gửi Zalo', icon: IconMessageSquare },
        { id: 'custom-tab', label: 'Tab trống', icon: IconLayers },
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
            link: link || '',
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
            link: editForm.link.trim(),
        });
        setIsEditModalOpen(false);
    };

    const handleSaveFastLink = (e) => {
        e?.preventDefault();
        onUpdateEvent?.({
            link: fastLinkValue.trim(),
        });
        setIsFastLinkInputOpen(false);
    };

    const handleRemoveFastLink = () => {
        if (!confirm('Bạn có muốn xóa đường link liên kết này?')) return;
        setFastLinkValue('');
        onUpdateEvent?.({
            link: '',
        });
        setIsFastLinkInputOpen(false);
    };

    const handleCopyLink = () => {
        if (!link) return;
        navigator.clipboard.writeText(link);
        setIsCopiedLink(true);
        setTimeout(() => setIsCopiedLink(false), 2000);
    };

    const checkScrollButtons = useCallback(() => {
        const el = tabsContainerRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 6);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
    }, []);

    useEffect(() => {
        const el = tabsContainerRef.current;
        if (!el) return;
        checkScrollButtons();
        el.addEventListener('scroll', checkScrollButtons, { passive: true });
        window.addEventListener('resize', checkScrollButtons);
        return () => {
            el.removeEventListener('scroll', checkScrollButtons);
            window.removeEventListener('resize', checkScrollButtons);
        };
    }, [checkScrollButtons, navTabs.length]);

    // Auto-scroll to active tab on change
    useEffect(() => {
        const el = tabsContainerRef.current;
        if (!el) return;
        const activeBtn = el.querySelector(`[data-tab-id="${activeTab}"]`);
        if (activeBtn) {
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [activeTab]);

    const scrollLeft = () => {
        tabsContainerRef.current?.scrollBy({ left: -220, behavior: 'smooth' });
    };

    const scrollRight = () => {
        tabsContainerRef.current?.scrollBy({ left: 220, behavior: 'smooth' });
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

                        {/* Event Link Bar right under the description with gray box and highlighted blue text */}
                        <div className="flex items-center gap-2 flex-wrap text-xs mt-1">
                            {isFastLinkInputOpen ? (
                                <form onSubmit={handleSaveFastLink} className="flex items-center gap-1.5 flex-wrap">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-400 bg-gray-100 dark:bg-gray-800 shadow-xs">
                                        <IconLink className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                        <input
                                            type="text"
                                            value={fastLinkValue}
                                            onChange={e => setFastLinkValue(e.target.value)}
                                            placeholder="Dán link (Drive, Canva, Docs, Họp online...)"
                                            className="w-56 sm:w-80 text-xs bg-transparent border-none focus:outline-none text-[var(--text-primary)]"
                                            autoFocus
                                        />
                                        {fastLinkValue && (
                                            <button
                                                type="button"
                                                onClick={() => setFastLinkValue('')}
                                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 border-none bg-transparent cursor-pointer p-0.5"
                                                title="Xóa ô nhập"
                                            >
                                                <IconClose className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold border-none cursor-pointer shadow-xs transition-all"
                                    >
                                        Lưu
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsFastLinkInputOpen(false)}
                                        className="px-2.5 py-1.5 rounded-xl bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-[var(--text-primary)] text-xs border border-[var(--border-color)] cursor-pointer transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    {link && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveFastLink}
                                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-900 cursor-pointer transition-colors"
                                            title="Xóa link liên kết"
                                        >
                                            Xóa link
                                        </button>
                                    )}
                                </form>
                            ) : link ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100/90 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium max-w-full shadow-2xs">
                                    <IconLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                    <a
                                        href={link.startsWith('http://') || link.startsWith('https://') ? link : `https://${link}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline max-w-[260px] sm:max-w-md truncate text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold no-underline"
                                        title={`Mở liên kết: ${link}`}
                                    >
                                        {link}
                                    </a>
                                    <div className="flex items-center gap-1 pl-1 border-l border-gray-300 dark:border-gray-600">
                                        <a
                                            href={link.startsWith('http://') || link.startsWith('https://') ? link : `https://${link}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-300 transition-colors"
                                            title="Mở tab mới"
                                        >
                                            <IconExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                        <button
                                            type="button"
                                            onClick={handleCopyLink}
                                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-300 transition-colors border-none bg-transparent cursor-pointer"
                                            title="Sao chép link"
                                        >
                                            {isCopiedLink ? <IconCheck className="w-3.5 h-3.5 text-emerald-600" /> : <IconCopy className="w-3.5 h-3.5" />}
                                        </button>
                                        {!readOnly && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFastLinkValue(link);
                                                        setIsFastLinkInputOpen(true);
                                                    }}
                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-300 transition-colors border-none bg-transparent cursor-pointer"
                                                    title="Sửa link"
                                                >
                                                    <IconEdit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveFastLink}
                                                    className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors border-none bg-transparent cursor-pointer"
                                                    title="Xóa link"
                                                >
                                                    <IconTrash className="w-3.5 h-3.5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                !readOnly && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFastLinkValue('');
                                            setIsFastLinkInputOpen(true);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/80 dark:hover:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 text-xs font-semibold cursor-pointer transition-colors"
                                    >
                                        <IconLink className="w-3.5 h-3.5 text-blue-500" />
                                        <span>+ Gắn link tài liệu / Drive / Canva</span>
                                    </button>
                                )
                            )}
                        </div>
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
                                    className="px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    <span>Lưu Mẫu</span>
                                </button>
                            )}

                            {status !== 'cancelled' ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (confirm('Bạn có chắc chắn muốn chuyển sự kiện này sang trạng thái "Đã hủy"?')) {
                                            onStatusChange?.('cancelled');
                                        }
                                    }}
                                    className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-semibold hover:bg-rose-100 transition-colors cursor-pointer flex items-center gap-1.5"
                                    title="Chuyển sự kiện sang trạng thái Đã hủy"
                                >
                                    <IconClose className="w-4 h-4" />
                                    <span>Hủy sự kiện</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (confirm('Khôi phục sự kiện này sang trạng thái "Đang chuẩn bị"?')) {
                                            onStatusChange?.('planning');
                                        }
                                    }}
                                    className="px-3.5 py-2 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs sm:text-sm font-semibold hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1.5"
                                    title="Khôi phục lại sự kiện"
                                >
                                    <span>Khôi phục sự kiện</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Sub-Navigation Tabs with Smooth Horizontal Scroll & Arrows */}
            <div className="relative border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/30 group">
                {/* Left Scroll Arrow Button */}
                {canScrollLeft && (
                    <button
                        type="button"
                        onClick={scrollLeft}
                        className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[var(--bg-primary)]/95 hover:bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-md flex items-center justify-center text-[var(--text-primary)] cursor-pointer transition-all hover:scale-105"
                        title="Cuộn sang trái"
                    >
                        <IconChevronLeft className="w-4 h-4" />
                    </button>
                )}

                {/* Left Fade Gradient Mask */}
                {canScrollLeft && (
                    <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-primary)]/70 to-transparent pointer-events-none z-10" />
                )}

                {/* Scrollable Tabs Track */}
                <div
                    ref={tabsContainerRef}
                    className="px-4 sm:px-6 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none scroll-smooth"
                >
                    {navTabs.map(t => {
                        const isActive = activeTab === t.id;
                        const TabIcon = t.icon;
                        return (
                            <button
                                key={t.id}
                                data-tab-id={t.id}
                                onClick={() => onTabChange?.(t.id)}
                                className={`py-3.5 px-3.5 sm:px-4 text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap bg-transparent cursor-pointer flex items-center gap-2 shrink-0 ${
                                    isActive
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-gray-300 dark:hover:border-gray-700'
                                }`}
                            >
                                <TabIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-secondary)]'}`} />
                                <span>{t.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Right Fade Gradient Mask */}
                {canScrollRight && (
                    <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[var(--bg-primary)] via-[var(--bg-primary)]/70 to-transparent pointer-events-none z-10" />
                )}

                {/* Right Scroll Arrow Button */}
                {canScrollRight && (
                    <button
                        type="button"
                        onClick={scrollRight}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[var(--bg-primary)]/95 hover:bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-md flex items-center justify-center text-[var(--text-primary)] cursor-pointer transition-all hover:scale-105"
                        title="Cuộn sang phải"
                    >
                        <IconChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Quick Edit Event Info Modal */}
            <EventModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Chỉnh sửa Thông tin Sự kiện / Workshop"
                subtitle="Cập nhật nhanh tên, thời gian, liên kết và địa điểm tổ chức"
                icon={IconEdit}
                maxWidth="max-w-lg"
                onSubmit={handleSaveEdit}
                submitLabel="Lưu thay đổi"
            >
                {/* General Info Card */}
                <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex flex-col gap-3">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                        Thông tin chính
                    </span>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                            Tên Sự kiện / Workshop <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            placeholder="Ví dụ: Workshop Trải nghiệm STEM & Tuyển sinh"
                            className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                            Mô tả ngắn sự kiện
                        </label>
                        <textarea
                            rows={2}
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            placeholder="Nhập tóm tắt nội dung, quy mô, đối tượng tham gia sự kiện..."
                            className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y transition-all"
                        />
                    </div>
                </div>

                {/* Schedule & Location Card */}
                <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex flex-col gap-3">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                        Thời gian & Địa điểm
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                                Ngày bắt đầu
                            </label>
                            <input
                                type="date"
                                value={editForm.startDate}
                                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                                Ngày kết thúc
                            </label>
                            <input
                                type="date"
                                value={editForm.endDate}
                                onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                            Link liên kết sự kiện (Google Drive / Canva / Kịch bản / Họp online)
                        </label>
                        <input
                            type="text"
                            value={editForm.link}
                            onChange={(e) => setEditForm({ ...editForm, link: e.target.value })}
                            placeholder="https://... hoặc drive.google.com/..."
                            className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                            Địa điểm tổ chức
                        </label>
                        <input
                            type="text"
                            value={editForm.location}
                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                            placeholder="Ví dụ: Trường Tiểu học Hoà Bình, Q. Tân Bình"
                            className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>
            </EventModal>

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
