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
    IconBookOpen,
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
import EditEventModal from './EditEventModal';
import { EventModal, eventStatusOptions, statusConfigMap, EventStatusBadge, EventStatusDropdown, EventTagBadge, eventTypeConfigMap, useEventDialog } from '@/app/events/ui/common';

const statusOptions = eventStatusOptions;


export default function EventHeader({
    event,
    users = [],
    onStatusChange,
    activeTab,
    onTabChange,
    canViewBudget = false,
    onSaveAsTemplate,
    canSaveTemplate = true,
    onDeleteEvent,
    onUpdateEvent,
    readOnly = false,
    allowedTabs = null,
}) {
    const { confirm } = useEventDialog();
    const {
        title,
        type = 'competition',
        status = 'planning',
        startDate,
        endDate,
        location,
        description = '',
        link = '',
        tags = [],
        lead,
        participantsCount,
    } = event || {};

    const eventTypeConfig = eventTypeConfigMap[event?.type || type || 'competition'] || eventTypeConfigMap.other;

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
        type: event?.type || type || 'competition',
        description: description || '',
        startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : '',
        endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : '',
        location: location || '',
        link: link || '',
        lead: lead?._id || lead || '',
        tags: tags || [],
    });

    const allNavTabs = [
        { id: 'roadmap', label: 'Lộ trình công việc', icon: IconTree },
        { id: 'stations', label: 'Kịch bản Trạm', icon: IconStation },
        { id: 'equipment', label: 'Danh sách thiết bị', icon: IconPackage },
        { id: 'staff', label: 'Nhân sự', icon: IconUsers },
        ...((canViewBudget || (allowedTabs && allowedTabs.budget)) ? [{ id: 'budget', label: 'Ngân sách', icon: IconDollar }] : []),
        { id: 'zalo-config', label: 'Cấu hình gửi Zalo', icon: IconMessageSquare },
        { id: 'media', label: 'Album Ảnh Drive', icon: IconCamera },
        { id: 'guide', label: 'Hướng dẫn', icon: IconBookOpen },
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
            type: event?.type || type || 'competition',
            description: description || '',
            startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : '',
            endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : '',
            location: location || '',
            link: link || '',
            lead: lead?._id || lead || '',
            tags: tags || [],
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = (e) => {
        e?.preventDefault?.();
        onUpdateEvent?.({
            title: editForm.title.trim() || title,
            type: editForm.type || event?.type || type,
            description: editForm.description.trim(),
            startDate: editForm.startDate ? new Date(editForm.startDate) : null,
            endDate: editForm.endDate ? new Date(editForm.endDate) : null,
            location: editForm.location.trim(),
            link: editForm.link.trim(),
            lead: editForm.lead || undefined,
            tags: editForm.tags || [],
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

    const handleRemoveFastLink = async () => {
        const ok = await confirm({
            title: 'Xóa link liên kết',
            message: 'Bạn có chắc chắn muốn xóa đường link liên kết này khỏi sự kiện?',
            confirmText: 'Xóa link',
            danger: true,
        });
        if (!ok) return;
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
        <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] relative z-20 shadow-xs flex flex-col">
            {/* Top Bar: Back button, Event Title, Description, Date, Location & Action Controls */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-t-2xl">
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
                        {/* Title Row with Type and Tags */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight truncate">
                                {title}
                            </h1>

                            {/* Event Type Badge */}
                            <span
                                className="text-xs font-semibold text-white px-2.5 py-1 rounded-lg shrink-0 shadow-2xs"
                                style={{ background: eventTypeConfig.color }}
                            >
                                {eventTypeConfig.label}
                            </span>

                            {/* Tag Badges */}
                            {Array.isArray(tags) && tags.length > 0 && tags.map(t => (
                                <EventTagBadge key={t} tag={t} size="md" className="py-1 px-2.5 text-xs sm:text-sm shadow-2xs" />
                            ))}

                            {/* Participants Badge (especially useful on public share) */}
                            {participantsCount > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100/90 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-semibold shrink-0 shadow-2xs">
                                    <IconUsers className="w-4 h-4 text-blue-500 dark:text-blue-400" />
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

                        {/* Schedule, Location & Event Link Bar below description */}
                        <div className="flex items-center gap-2 flex-wrap text-xs mt-1.5">
                            {/* Date Badge */}
                            {readOnly ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100/90 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-semibold shrink-0 shadow-2xs">
                                    <IconCalendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                    <span>{dateDisplay}</span>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleOpenEdit}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100/90 hover:bg-gray-200/80 dark:bg-gray-800/80 dark:hover:bg-gray-700/80 border border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-semibold shrink-0 cursor-pointer transition-colors shadow-2xs"
                                    title="Bấm để chỉnh sửa ngày diễn ra"
                                >
                                    <IconCalendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                    <span>{dateDisplay}</span>
                                </button>
                            )}

                            {/* Location Badge */}
                            {readOnly ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100/90 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-semibold shrink-0 shadow-2xs">
                                    <IconLocation className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                    <span>{location || 'Chưa đặt địa điểm'}</span>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleOpenEdit}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100/90 hover:bg-gray-200/80 dark:bg-gray-800/80 dark:hover:bg-gray-700/80 border border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-semibold shrink-0 cursor-pointer transition-colors shadow-2xs"
                                    title="Bấm để chỉnh sửa địa điểm"
                                >
                                    <IconLocation className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                    <span>{location || 'Chưa đặt địa điểm'}</span>
                                </button>
                            )}

                            {/* Event Link Bar right under the description with gray box and highlighted blue text */}
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
                <div className="flex items-center gap-3 flex-wrap shrink-0 relative z-30">
                    {readOnly ? (
                        <>
                            <EventStatusBadge status={status} size="md" className="py-2 px-3.5 text-xs sm:text-sm shadow-2xs" />


                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] transition-all duration-150 cursor-pointer flex items-center justify-center shadow-2xs print:hidden"
                                title="In kịch bản / PDF"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-600">
                                    <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                                </svg>
                            </button>
                        </>
                    ) : (
                        <>
                            <EventStatusDropdown
                                status={status}
                                onChange={(newStatus) => onStatusChange?.(newStatus)}
                            />

                            {/* Share Button (Bold Filled Icon Button) */}
                            <button
                                type="button"
                                onClick={() => setIsShareModalOpen(true)}
                                className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-center shadow-2xs ${
                                    event.shareConfig?.isPublic
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                                        : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300'
                                }`}
                                title={event.shareConfig?.isPublic ? 'Đang chia sẻ' : 'Chia sẻ'}
                            >
                                <div className="relative flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z" clipRule="evenodd" />
                                    </svg>
                                    {event.shareConfig?.isPublic && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-[var(--bg-primary)]" />
                                    )}
                                </div>
                            </button>

                            {/* Save As Template Button */}
                            {onSaveAsTemplate && (
                                 <button
                                     type="button"
                                     disabled={!canSaveTemplate}
                                     onClick={canSaveTemplate ? onSaveAsTemplate : undefined}
                                     className={`h-9 sm:h-10 px-3 rounded-xl border transition-all duration-150 flex items-center gap-1.5 shadow-2xs text-xs sm:text-sm font-semibold ${
                                        canSaveTemplate
                                            ? 'border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:border-indigo-400 cursor-pointer active:scale-95'
                                            : 'border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/40 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                                    }`}
                                    title="Lưu sự kiện hiện tại thành Mẫu sự kiện mới (Lộ trình + Dự toán chi phí)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0">
                                        <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.58A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                                    </svg>
                                    <span className="hidden sm:inline">Lưu làm mẫu</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Sub-Navigation Tabs with Smooth Horizontal Scroll & Arrows */}
            <div className="relative border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/30 group rounded-b-2xl">
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
                                        ? 'border-blue-600 text-blue-600 font-bold'
                                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-gray-300'
                                }`}
                            >
                                <TabIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-[var(--text-secondary)]'}`} />
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
            <EditEventModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                editForm={editForm}
                setEditForm={setEditForm}
                onSubmit={handleSaveEdit}
                users={users}
            />

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
