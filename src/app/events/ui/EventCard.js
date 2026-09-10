'use client';
import React from 'react';
import Link from 'next/link';
import { formatDate, formatCurrencyVN, srcImage } from '@/function';
import {
    IconCalendar,
    IconLocation,
    IconUser,
    IconClock,
    IconTrophy,
    IconWrench,
    IconGraduationCap,
    IconBriefcase,
    IconTag,
    IconFlame,
    IconCheckCircle,
    IconArrowRight,
} from './icons';

const typeConfigMap = {
    competition: { label: 'Cuộc thi', icon: IconTrophy, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
    workshop: { label: 'Workshop', icon: IconWrench, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    showcase: { label: 'Showcase', icon: IconGraduationCap, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
    internal: { label: 'Nội bộ', icon: IconBriefcase, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
    other: { label: 'Khác', icon: IconTag, color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20' },
};

const statusConfigMap = {
    planning: { label: 'Đang chuẩn bị', dotColor: 'bg-slate-400', badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700' },
    upcoming: { label: 'Sắp diễn ra', dotColor: 'bg-blue-500', badgeClass: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    happening: { label: 'Đang diễn ra', dotColor: 'bg-amber-500 animate-ping', badgeClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    completed: { label: 'Đã hoàn thành', dotColor: 'bg-emerald-500', badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    cancelled: { label: 'Đã hủy', dotColor: 'bg-rose-500', badgeClass: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
};

function getCountdownInfo(startDate, status) {
    if (status === 'completed') return { text: 'Đã kết thúc', icon: IconCheckCircle };
    if (status === 'happening') return { text: 'Đang diễn ra', icon: IconFlame };
    if (status === 'cancelled') return { text: 'Đã hủy', icon: IconClock };
    if (!startDate) return { text: 'Chưa xếp ngày', icon: IconCalendar };

    const now = new Date();
    const target = new Date(startDate);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'Hôm nay', icon: IconFlame };
    if (diffDays === 1) return { text: 'Ngày mai', icon: IconClock };
    if (diffDays > 1) return { text: `Còn ${diffDays} ngày`, icon: IconClock };
    return { text: 'Đã qua ngày', icon: IconClock };
}

export default function EventCard({ event, canViewBudget = false }) {
    const {
        _id,
        title,
        code,
        type = 'competition',
        status = 'planning',
        startDate,
        endDate,
        location,
        lead,
        coverImage,
        stats = {},
    } = event;

    const typeConfig = typeConfigMap[type] || typeConfigMap.other;
    const TypeIcon = typeConfig.icon;
    const statusConfig = statusConfigMap[status] || statusConfigMap.planning;
    const countdownInfo = getCountdownInfo(startDate, status);
    const CountdownIcon = countdownInfo.icon;
    const progress = stats.progressPercent || 0;

    return (
        <Link
            href={`/events/${_id}`}
            className="group block bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-500/40 transition-all duration-300 no-underline text-inherit flex flex-col justify-between"
        >
            <div>
                {/* Cover Header Banner */}
                <div className="relative h-36 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden flex items-center justify-center">
                    {coverImage ? (
                        <img
                            src={srcImage(coverImage)}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 text-center">
                            <div className="text-white/10 font-black text-6xl select-none tracking-widest uppercase font-mono">
                                {code ? code.slice(0, 4) : 'AIR'}
                            </div>
                        </div>
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border backdrop-blur-md shadow-xs flex items-center gap-1.5 ${typeConfig.color} bg-white/90 dark:bg-gray-900/90`}>
                            <TypeIcon className="w-3.5 h-3.5" />
                            <span>{typeConfig.label}</span>
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border shadow-xs flex items-center gap-1.5 ${statusConfig.badgeClass} backdrop-blur-md`}>
                            <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
                            <span>{statusConfig.label}</span>
                        </span>
                    </div>

                    {/* Countdown Badge */}
                    <div className="absolute bottom-2 right-3">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-sm flex items-center gap-1">
                            <CountdownIcon className="w-3 h-3 text-blue-300" />
                            <span>{countdownInfo.text}</span>
                        </span>
                    </div>
                </div>

                {/* Body Details */}
                <div className="p-4 flex flex-col gap-3">
                    <div>
                        <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">
                            {code || 'EVT-AIR'}
                        </div>
                        <h3 className="text-sm font-bold text-[var(--text-primary)] mt-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                            {title}
                        </h3>
                    </div>

                    {/* Date & Location */}
                    <div className="flex flex-col gap-1.5 text-xs text-[var(--text-secondary)]">
                        <div className="flex items-center gap-2">
                            <IconCalendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="font-medium truncate">
                                {startDate ? formatDate(startDate) : 'Chưa định ngày'}
                                {endDate && ` - ${formatDate(endDate)}`}
                            </span>
                        </div>

                        {location && (
                            <div className="flex items-center gap-2 truncate">
                                <IconLocation className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span className="truncate">{location}</span>
                            </div>
                        )}
                    </div>

                    {/* Roadmap Progress Bar */}
                    <div className="pt-2.5 border-t border-[var(--border-color)]">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-medium text-[var(--text-secondary)]">Tiến độ lộ trình:</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                                {stats.completedTasks || 0}/{stats.totalTasks || 0} khâu ({progress}%)
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    progress === 100
                                        ? 'bg-emerald-500'
                                        : progress > 50
                                        ? 'bg-blue-600'
                                        : 'bg-amber-500'
                                }`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-[var(--bg-secondary)]/60 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                {/* Lead Person */}
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-blue-200 dark:border-blue-900">
                        {lead?.name ? lead.name.slice(0, 1).toUpperCase() : <IconUser className="w-3 h-3" />}
                    </div>
                    <span className="font-medium text-[var(--text-secondary)] truncate max-w-[120px]">
                        {lead?.name || 'Chưa gán'}
                    </span>
                </div>

                {/* Budget / Action */}
                {canViewBudget ? (
                    <div className="text-right">
                        <span className="text-[10px] text-[var(--text-secondary)] block">Dự toán:</span>
                        <span className="font-bold text-[var(--text-primary)]">
                            {stats.estimatedTotal ? formatCurrencyVN(stats.estimatedTotal) : '0 VNĐ'}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                        <span>Chi tiết</span>
                        <IconArrowRight className="w-3 h-3" />
                    </div>
                )}
            </div>
        </Link>
    );
}
