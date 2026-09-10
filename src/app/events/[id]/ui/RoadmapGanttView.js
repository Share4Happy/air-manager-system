'use client';
import React, { useMemo } from 'react';
import { formatDate } from '@/function';
import { IconTree, IconGantt, IconCalendar } from '@/app/events/ui/icons';

const phaseColorPalette = [
    {
        bg: 'bg-blue-100/80 dark:bg-blue-950/50',
        border: 'border-blue-300 dark:border-blue-700',
        text: 'text-blue-800 dark:text-blue-200',
        badge: 'bg-blue-600 text-white',
        bar: 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700',
    },
    {
        bg: 'bg-indigo-100/80 dark:bg-indigo-950/50',
        border: 'border-indigo-300 dark:border-indigo-700',
        text: 'text-indigo-800 dark:text-indigo-200',
        badge: 'bg-indigo-600 text-white',
        bar: 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700',
    },
    {
        bg: 'bg-purple-100/80 dark:bg-purple-950/50',
        border: 'border-purple-300 dark:border-purple-700',
        text: 'text-purple-800 dark:text-purple-200',
        badge: 'bg-purple-600 text-white',
        bar: 'bg-purple-600 dark:bg-purple-500 hover:bg-purple-700',
    },
    {
        bg: 'bg-emerald-100/80 dark:bg-emerald-950/50',
        border: 'border-emerald-300 dark:border-emerald-700',
        text: 'text-emerald-800 dark:text-emerald-200',
        badge: 'bg-emerald-600 text-white',
        bar: 'bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700',
    },
    {
        bg: 'bg-amber-100/80 dark:bg-amber-950/50',
        border: 'border-amber-300 dark:border-amber-700',
        text: 'text-amber-800 dark:text-amber-200',
        badge: 'bg-amber-600 text-white',
        bar: 'bg-amber-600 dark:bg-amber-500 hover:bg-amber-700',
    },
    {
        bg: 'bg-rose-100/80 dark:bg-rose-950/50',
        border: 'border-rose-300 dark:border-rose-700',
        text: 'text-rose-800 dark:text-rose-200',
        badge: 'bg-rose-600 text-white',
        bar: 'bg-rose-600 dark:bg-rose-500 hover:bg-rose-700',
    },
];

export default function RoadmapGanttView({
    event = {},
    roadmap = [],
    users = [],
    members = [],
    roadmapMode = 'gantt',
    setRoadmapMode,
}) {
    const rootPhases = useMemo(() => roadmap.filter(node => !node.parentId), [roadmap]);
    const childTasks = useMemo(() => roadmap.filter(node => node.parentId), [roadmap]);

    // Helper to resolve assignee
    const getAssigneeInfo = (assigneeId) => {
        if (!assigneeId) return null;
        const idStr = typeof assigneeId === 'object' ? String(assigneeId?._id || assigneeId?.id) : String(assigneeId);

        // Check members
        const m = (members || []).find(m => String(m.id) === idStr || String(m._id) === idStr || String(m.userId) === idStr);
        if (m) return { name: m.name };

        // Check internal users
        const u = (users || []).find(u => String(u._id) === idStr);
        if (u) return { name: u.name };

        if (typeof assigneeId === 'object' && assigneeId?.name) return { name: assigneeId.name };
        return null;
    };

    // Calculate overall timeline bounds
    const timelineBounds = useMemo(() => {
        const dates = [];
        if (event.startDate) dates.push(new Date(event.startDate).getTime());
        if (event.endDate) dates.push(new Date(event.endDate).getTime());

        roadmap.forEach(n => {
            if (n.startDate) dates.push(new Date(n.startDate).getTime());
            if (n.dueDate) dates.push(new Date(n.dueDate).getTime());
        });

        const now = Date.now();
        dates.push(now);

        let minTime = Math.min(...dates);
        let maxTime = Math.max(...dates);

        // Add padding of 3 days
        minTime -= 3 * 24 * 60 * 60 * 1000;
        maxTime += 3 * 24 * 60 * 60 * 1000;

        const totalDays = Math.ceil((maxTime - minTime) / (24 * 60 * 60 * 1000)) || 30;

        // Generate day markers
        const dayMarkers = [];
        for (let i = 0; i <= totalDays; i += Math.max(1, Math.floor(totalDays / 10))) {
            const dateObj = new Date(minTime + i * 24 * 60 * 60 * 1000);
            dayMarkers.push({
                percent: (i / totalDays) * 100,
                label: `${dateObj.getDate()}/${dateObj.getMonth() + 1}`,
                fullDate: dateObj,
            });
        }

        const todayPercent = Math.max(0, Math.min(100, ((now - minTime) / (maxTime - minTime)) * 100));

        return { minTime, maxTime, totalDays, dayMarkers, todayPercent };
    }, [event, roadmap]);

    // Calculate Event Milestone Position (Ngày diễn ra sự kiện)
    const eventMarker = useMemo(() => {
        if (!event.startDate) return null;
        const evStart = new Date(event.startDate).getTime();
        const evEnd = event.endDate ? new Date(event.endDate).getTime() : evStart + 24 * 60 * 60 * 1000;
        const { minTime, maxTime } = timelineBounds;
        const totalDuration = maxTime - minTime;

        const left = Math.max(0, Math.min(100, ((evStart - minTime) / totalDuration) * 100));
        const right = Math.max(0, Math.min(100, ((evEnd - minTime) / totalDuration) * 100));
        const width = Math.max(1.8, right - left);

        return {
            left: `${left}%`,
            width: `${width}%`,
            startDate: event.startDate,
            endDate: event.endDate,
            label: `Ngày sự kiện: ${formatDate(event.startDate)}`,
        };
    }, [event.startDate, event.endDate, timelineBounds]);

    // Function to calculate bar left & width percent for tasks
    const getBarPosition = (startDate, dueDate) => {
        const { minTime, maxTime } = timelineBounds;
        const totalDuration = maxTime - minTime;

        const start = startDate ? new Date(startDate).getTime() : (dueDate ? new Date(dueDate).getTime() - 2 * 24 * 60 * 60 * 1000 : minTime);
        const end = dueDate ? new Date(dueDate).getTime() : start + 3 * 24 * 60 * 60 * 1000;

        const leftPercent = Math.max(0, Math.min(100, ((start - minTime) / totalDuration) * 100));
        const rightPercent = Math.max(0, Math.min(100, ((end - minTime) / totalDuration) * 100));
        const widthPercent = Math.max(2.5, rightPercent - leftPercent);

        return { left: `${leftPercent}%`, width: `${widthPercent}%` };
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Unified 1-Row Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-primary)] p-3 sm:p-3.5 rounded-2xl border border-[var(--border-color)] shadow-xs">
                {/* Left: View Mode Toggle */}
                <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)] self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setRoadmapMode?.('tree')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                            roadmapMode === 'tree'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <IconTree className="w-3.5 h-3.5" />
                        <span>Sơ đồ Cây (Tree View)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRoadmapMode?.('gantt')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                            roadmapMode === 'gantt'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <IconGantt className="w-3.5 h-3.5" />
                        <span>Tiến độ Gantt Timeline</span>
                    </button>
                </div>

                {/* Right: Event Date badge & Phase Color Legends */}
                <div className="flex items-center gap-3 text-xs flex-wrap">
                    {event.startDate && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                            <IconCalendar className="w-3.5 h-3.5" />
                            <span>Ngày sự kiện: {formatDate(event.startDate)}</span>
                        </div>
                    )}
                    {rootPhases.map((phase, pIdx) => {
                        const color = phaseColorPalette[pIdx % phaseColorPalette.length];
                        return (
                            <div key={phase.id} className="flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-xs ${color.bar.split(' ')[0]}`} />
                                <span className="text-[var(--text-secondary)] text-[11px] font-medium">{phase.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Gantt Timeline Table Container */}
            <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xs flex flex-col">
                <div className="overflow-x-auto scrollbar-thin">
                    <div className="min-w-[1000px] flex flex-col">
                        {/* Table Header: Columns + Date Axis with Event Date Marker */}
                        <div className="flex items-center border-b border-[var(--border-color)] bg-gray-50/90 dark:bg-gray-900/60 py-3 text-xs sm:text-sm font-bold text-[var(--text-secondary)] sticky top-0 z-20">
                            {/* Col 1: Công việc */}
                            <div className="w-72 shrink-0 px-4 font-bold text-[var(--text-primary)] uppercase tracking-wider text-xs sm:text-sm">
                                Công việc
                            </div>
                            {/* Col 2: Tên người thực hiện */}
                            <div className="w-44 shrink-0 px-3 font-semibold uppercase tracking-wider text-xs sm:text-sm">
                                Người thực hiện
                            </div>
                            {/* Col 3: Deadline */}
                            <div className="w-32 shrink-0 px-3 font-semibold uppercase tracking-wider text-xs sm:text-sm border-r border-[var(--border-color)]">
                                Deadline
                            </div>
                            {/* Col 4: Date Axis & Indicators */}
                            <div className="flex-1 relative h-6">
                                {/* Day Markers */}
                                {timelineBounds.dayMarkers.map((marker, idx) => (
                                    <div
                                        key={idx}
                                        className="absolute -translate-x-1/2 top-0.5 text-xs text-gray-500 dark:text-gray-400 font-mono font-medium"
                                        style={{ left: `${marker.percent}%` }}
                                    >
                                        {marker.label}
                                    </div>
                                ))}

                                {/* Event Date Marker Badge (Dấu hiệu ngày diễn ra sự kiện) */}
                                {eventMarker && (
                                    <div
                                        className="absolute top-0 -translate-x-1/2 flex flex-col items-center z-25 pointer-events-none"
                                        style={{ left: eventMarker.left }}
                                    >
                                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold shadow-sm whitespace-nowrap flex items-center gap-1 uppercase tracking-wider ring-1 ring-indigo-300 dark:ring-indigo-800">
                                            <IconCalendar className="w-3 h-3 text-white" />
                                            <span>Sự kiện: {formatDate(eventMarker.startDate)}</span>
                                        </span>
                                    </div>
                                )}

                                {/* Today marker badge (Stably placed inside header row) */}
                                <div
                                    className="absolute top-0 -translate-x-1/2 flex flex-col items-center z-30 pointer-events-none"
                                    style={{ left: `${timelineBounds.todayPercent}%` }}
                                >
                                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-xs whitespace-nowrap flex items-center gap-1 uppercase">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        <span>Hôm nay</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Gantt Rows with Tasks */}
                        <div className="flex flex-col relative divide-y divide-[var(--border-color)]">
                            {/* Background Vertical Grid: Event Zone & Today Line */}
                            <div className="absolute inset-0 flex pointer-events-none">
                                <div className="w-72 shrink-0" />
                                <div className="w-44 shrink-0" />
                                <div className="w-32 shrink-0 border-r border-[var(--border-color)]/50" />
                                <div className="flex-1 relative h-full">
                                    {/* Vertical Day Lines */}
                                    {timelineBounds.dayMarkers.map((marker, idx) => (
                                        <div
                                            key={idx}
                                            className="absolute top-0 bottom-0 w-px border-r border-dashed border-gray-100 dark:border-gray-800/40"
                                            style={{ left: `${marker.percent}%` }}
                                        />
                                    ))}

                                    {/* Event Day Zone Highlight (Dấu hiệu ngày sự kiện) */}
                                    {eventMarker && (
                                        <div
                                            className="absolute top-0 bottom-0 bg-indigo-500/10 dark:bg-indigo-500/15 border-x border-dashed border-indigo-400/50 z-10"
                                            style={{ left: eventMarker.left, width: eventMarker.width }}
                                        />
                                    )}

                                    {/* Vertical Red Today Line */}
                                    <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-15"
                                        style={{ left: `${timelineBounds.todayPercent}%` }}
                                    />
                                </div>
                            </div>

                            {/* Mapping Tasks Grouped by Phase */}
                            {rootPhases.map((phase, pIdx) => {
                                const subTasks = childTasks.filter(t => t.parentId === phase.id);
                                const color = phaseColorPalette[pIdx % phaseColorPalette.length];

                                return (
                                    <div key={phase.id} className="flex flex-col">
                                        {/* Phase Sub-heading Row */}
                                        <div className={`flex items-center py-2 px-4 ${color.bg} border-y ${color.border}`}>
                                            <div className="flex items-center gap-2.5">
                                                <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0 ${color.badge}`}>
                                                    {pIdx + 1}
                                                </span>
                                                <span className={`font-bold text-sm sm:text-base ${color.text}`}>
                                                    {phase.name}
                                                </span>
                                                <span className="text-xs opacity-80">
                                                    ({subTasks.length} việc)
                                                </span>
                                            </div>
                                        </div>

                                        {/* Sub-tasks Rows */}
                                        {subTasks.map(task => {
                                            const pos = getBarPosition(task.startDate, task.dueDate);
                                            const assigneeObj = getAssigneeInfo(task.assignee);

                                            return (
                                                <div
                                                    key={task.id}
                                                    className="flex items-center py-3 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors group text-sm"
                                                >
                                                    {/* Col 1: Công việc */}
                                                    <div className="w-72 shrink-0 px-4 text-sm font-medium">
                                                        <span className="truncate block text-[var(--text-primary)] pl-2" title={task.name}>
                                                            ↳ {task.name}
                                                        </span>
                                                    </div>

                                                    {/* Col 2: Tên người thực hiện */}
                                                    <div className="w-44 shrink-0 px-3 text-sm text-[var(--text-secondary)] truncate">
                                                        <span className="truncate">
                                                            {assigneeObj?.name || <span className="text-gray-400 italic">Chưa gán</span>}
                                                        </span>
                                                    </div>

                                                    {/* Col 3: Deadline */}
                                                    <div className="w-32 shrink-0 px-3 text-sm text-[var(--text-secondary)] font-mono border-r border-[var(--border-color)]/50">
                                                        {task.dueDate ? formatDate(task.dueDate) : <span className="text-gray-400 italic">--</span>}
                                                    </div>

                                                    {/* Col 4: Timeline Bar (Hình vuông/khối chữ nhật, không chữ ở trong) */}
                                                    <div className="flex-1 relative h-6">
                                                        <div
                                                            className={`absolute top-1 bottom-1 rounded-xs shadow-xs transition-all duration-200 cursor-pointer ${color.bar}`}
                                                            style={pos}
                                                            title={`${task.name} • ${phase.name} • Hạn: ${task.dueDate ? formatDate(task.dueDate) : 'Chưa có hạn'}`}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
