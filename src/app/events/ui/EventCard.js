'use client';
import React, { useMemo } from 'react';
import ItemCard from '@/components/(ui)/(card)/ItemCard';
import { formatDate } from '@/function';

const typeConfigMap = {
    competition: { label: 'Cuộc thi', color: '#f59e0b' },
    workshop: { label: 'Workshop', color: '#3b82f6' },
    showcase: { label: 'Showcase', color: '#8b5cf6' },
    internal: { label: 'Nội bộ', color: '#10b981' },
    other: { label: 'Khác', color: '#6b7280' },
};

const statusConfigMap = {
    planning: {
        label: 'Đang chuẩn bị',
        color: '#3b82f6',
        bg: '#eff6ff',
        textColor: '#1d4ed8',
        borderColor: '#bfdbfe',
        barColor: '#3b82f6',
    },
    upcoming: {
        label: 'Sắp diễn ra',
        color: '#6366f1',
        bg: '#eef2ff',
        textColor: '#4338ca',
        borderColor: '#c7d2fe',
        barColor: '#6366f1',
    },
    happening: {
        label: 'Đang diễn ra',
        color: '#f59e0b',
        bg: '#fffbeb',
        textColor: '#b45309',
        borderColor: '#fde68a',
        barColor: '#f59e0b',
    },
    completed: {
        label: 'Đã hoàn thành',
        color: '#10b981',
        bg: '#ecfdf5',
        textColor: '#047857',
        borderColor: '#a7f3d0',
        barColor: '#10b981',
    },
    cancelled: {
        label: 'Đã hủy',
        color: '#ef4444',
        bg: '#fef2f2',
        textColor: '#b91c1c',
        borderColor: '#fecaca',
        barColor: '#ef4444',
    },
};

export default function EventCard({ event = {}, canViewBudget = false }) {
    const {
        _id,
        title = '',
        code = '',
        type = 'competition',
        status = 'planning',
        startDate,
        endDate,
        location = '',
        lead,
        members = [],
        stats = {},
    } = event;

    const typeConfig = typeConfigMap[type] || typeConfigMap.other;
    const statusConfig = statusConfigMap[status] || statusConfigMap.planning;

    const bottomBorderColor = useMemo(() => {
        switch (status) {
            case 'completed':
                return 'var(--green, #10b981)';
            case 'happening':
                return 'var(--main_d, #f59e0b)';
            case 'cancelled':
                return '#ef4444';
            case 'planning':
            case 'upcoming':
            default:
                return 'var(--main_b, #3b82f6)';
        }
    }, [status]);

    const dateStr = useMemo(() => {
        if (startDate && endDate) {
            return `${formatDate(startDate)} - ${formatDate(endDate)}`;
        }
        if (startDate) return formatDate(startDate);
        if (endDate) return formatDate(endDate);
        return 'Chưa có thời gian';
    }, [startDate, endDate]);

    const memberCount = stats?.totalMembers ?? (Array.isArray(members) ? members.length : 0);
    const completedTasks = stats?.completedTasks || 0;
    const totalTasks = stats?.totalTasks || 0;
    const progressPercent = stats?.progressPercent || 0;

    const infoRows = [
        { label: 'Mã sự kiện:', value: code || 'EVT-AIR' },
        { label: 'Thời gian:', value: dateStr },
        { label: 'Địa điểm:', value: location || 'Chưa xếp địa điểm' },
        { label: 'Trưởng ban tổ chức:', value: lead?.name || 'Chưa phân công' },
        { label: 'Quy mô BTC:', value: `${memberCount} Thành viên` },
    ];

    const progressConfig = useMemo(() => {
        switch (status) {
            case 'completed':
                return {
                    label: 'Tiến độ:',
                    current: totalTasks || completedTasks,
                    total: totalTasks || completedTasks,
                    unit: 'Khâu (Đã hoàn thành)',
                    percent: 100,
                    barColor: statusConfig.barColor,
                };
            case 'happening':
                return {
                    label: 'Tiến độ:',
                    current: completedTasks,
                    total: totalTasks,
                    unit: 'Khâu (Đang diễn ra)',
                    percent: totalTasks > 0 ? Math.max(10, Math.round((completedTasks / totalTasks) * 100)) : 100,
                    barColor: statusConfig.barColor,
                };
            case 'cancelled':
                return {
                    label: 'Tiến độ:',
                    current: 0,
                    total: totalTasks,
                    unit: 'Khâu (Đã hủy)',
                    percent: 0,
                    barColor: statusConfig.barColor,
                };
            case 'planning':
            case 'upcoming':
            default:
                return {
                    label: 'Tiến độ chuẩn bị:',
                    current: completedTasks,
                    total: totalTasks,
                    unit: 'Khâu',
                    percent: progressPercent,
                    barColor: statusConfig.barColor,
                };
        }
    }, [status, completedTasks, totalTasks, progressPercent, statusConfig.barColor]);

    const topLabelsNode = (
        <div className="flex items-center gap-1.5 flex-wrap">
            <span
                className="text-xs font-medium text-white px-2.5 py-0.5 rounded-full shrink-0"
                style={{ background: typeConfig.color }}
            >
                {typeConfig.label}
            </span>
            <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 border"
                style={{
                    background: statusConfig.bg,
                    color: statusConfig.textColor,
                    borderColor: statusConfig.borderColor,
                }}
            >
                {statusConfig.label}
            </span>
        </div>
    );

    return (
        <ItemCard
            href={`/events/${_id}`}
            topLabels={topLabelsNode}
            title={title || 'Sự kiện chưa đặt tên'}
            borderBottomColor={bottomBorderColor}
            infoRows={infoRows}
            progress={progressConfig}
        />
    );
}
