'use client';
import React, { useMemo } from 'react';
import ItemCard from '@/components/(ui)/(card)/ItemCard';
import { formatDate } from '@/function';

import { statusConfigMap, EventStatusBadge, EventTagBadge, eventTypeConfigMap } from './common';

const typeConfigMap = eventTypeConfigMap;


export default function EventCard({ event = {}, canViewBudget = false }) {
    const {
        _id,
        title = '',
        code = '',
        type = 'competition',
        status = 'planning',
        tags = [],
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
        <div className="flex items-center justify-between w-full gap-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
                <span
                    className="text-xs font-medium text-white px-2.5 py-0.5 rounded-full shrink-0"
                    style={{ background: typeConfig.color }}
                >
                    {typeConfig.label}
                </span>
                <EventStatusBadge status={status} />
            </div>
            {Array.isArray(tags) && tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap ml-auto">
                    {tags.map(t => (
                        <EventTagBadge key={t} tag={t} size="sm" />
                    ))}
                </div>
            )}
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
