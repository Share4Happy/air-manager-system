'use client';
import React from 'react';
import { formatCurrencyVN } from '@/function';
import {
    IconTrophy,
    IconClock,
    IconCheckCircle,
    IconDollar,
    IconClipboard,
} from './icons';

export default function EventStatsOverview({ counts = {}, events = [], canViewBudget = false }) {
    const totalEvents = counts.all || 0;
    const planningCount = counts.planning || 0;
    const upcomingCount = counts.upcoming || 0;
    const happeningCount = counts.happening || 0;
    const pastCount = counts.past || 0;

    const totalEstimated = events.reduce((sum, e) => sum + (e.stats?.estimatedTotal || 0), 0);
    const totalActual = events.reduce((sum, e) => sum + (e.stats?.actualTotal || 0), 0);
    const totalTasksAll = events.reduce((sum, e) => sum + (e.stats?.totalTasks || 0), 0);
    const completedTasksAll = events.reduce((sum, e) => sum + (e.stats?.completedTasks || 0), 0);

    const statCards = [
        {
            label: 'Tổng sự kiện',
            value: totalEvents,
            sub: `${happeningCount} đang diễn ra`,
            icon: IconTrophy,
            iconClass: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50/70 dark:bg-blue-950/20',
            border: 'border-blue-200/80 dark:border-blue-900/40',
            text: 'text-blue-600 dark:text-blue-400',
        },
        {
            label: 'Đang chuẩn bị',
            value: planningCount,
            sub: `${upcomingCount} sắp diễn ra`,
            icon: IconClock,
            iconClass: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50/70 dark:bg-amber-950/20',
            border: 'border-amber-200/80 dark:border-amber-900/40',
            text: 'text-amber-600 dark:text-amber-400',
        },
        {
            label: 'Đã hoàn thành',
            value: pastCount,
            sub: 'Sự kiện lưu trữ',
            icon: IconCheckCircle,
            iconClass: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50/70 dark:bg-emerald-950/20',
            border: 'border-emerald-200/80 dark:border-emerald-900/40',
            text: 'text-emerald-600 dark:text-emerald-400',
        },
        canViewBudget ? {
            label: 'Tổng dự toán kinh phí',
            value: formatCurrencyVN(totalEstimated),
            sub: `Thực chi: ${formatCurrencyVN(totalActual)}`,
            icon: IconDollar,
            iconClass: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-50/70 dark:bg-purple-950/20',
            border: 'border-purple-200/80 dark:border-purple-900/40',
            text: 'text-purple-600 dark:text-purple-400',
        } : {
            label: 'Tiến độ toàn hệ thống',
            value: `${completedTasksAll}/${totalTasksAll} khâu`,
            sub: 'Tổng các đầu việc',
            icon: IconClipboard,
            iconClass: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-50/70 dark:bg-purple-950/20',
            border: 'border-purple-200/80 dark:border-purple-900/40',
            text: 'text-purple-600 dark:text-purple-400',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, idx) => {
                const CardIcon = card.icon;
                return (
                    <div
                        key={idx}
                        className={`p-4 rounded-2xl border ${card.border} ${card.bg} transition-all duration-300 hover:shadow-md flex items-center justify-between`}
                    >
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-[var(--text-secondary)]">{card.label}</span>
                            <span className={`text-2xl font-black mt-1 ${card.text}`}>{card.value}</span>
                            <span className="text-[11px] text-[var(--text-secondary)] mt-0.5 opacity-80">{card.sub}</span>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-white dark:bg-gray-800 shadow-xs border border-black/5 dark:border-white/5 flex items-center justify-center">
                            <CardIcon className={`w-5 h-5 ${card.iconClass}`} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
