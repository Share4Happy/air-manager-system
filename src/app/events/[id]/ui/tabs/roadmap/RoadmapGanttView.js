'use client';
import React, { useState, useMemo } from 'react';
import { formatDate } from '@/function';
import AddEditRoadmapModal from './modals/AddEditRoadmapModal';
import { canManageRoadmapTasks } from './roadmapPermissions';
import {
    useEventDialog,
    PHASE_COLOR_PALETTE as phaseColorPalette,
    buildEventAssigneesList,
    resolveAssigneeInfo,
} from '@/app/events/ui/common';

import {
    IconTree,
    IconGantt,
    IconTable,
    IconCalendar,
    IconPlus,
    IconLayers,
} from '@/app/events/ui/icons';

export default function RoadmapGanttView({
    event = {},
    roadmap = [],
    stations = [],
    currentUser = null,
    users = [],
    members = [],
    onUpdateRoadmap,
    onUpdateStations,
    onUpdateMultiple,
    roadmapMode = 'gantt',
    setRoadmapMode,
    readOnly = false,
}) {
    const dialog = useEventDialog();
    const [modalState, setModalState] = useState({ isOpen: false, node: null, parentId: null });

    // Separate Root Phases and Sub-tasks
    const rootPhases = useMemo(() => {
        return (roadmap || [])
            .filter(n => !n.parentId)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [roadmap]);

    const childTasks = useMemo(() => (roadmap || []).filter(node => !!node.parentId), [roadmap]);

    // Event Assignees list
    const eventAssignees = useMemo(() => {
        return buildEventAssigneesList(members, users);
    }, [members, users]);

    // Helper to resolve assignee
    const getAssigneeInfo = (assigneeId) => {
        return resolveAssigneeInfo(assigneeId, members, users);
    };


    const handleSaveNode = (nodeData, editingNode) => {
        if (!onUpdateRoadmap) return;
        if (!canManageRoadmapTasks(currentUser, members, event)) {
            dialog.alert('Bạn không có quyền lưu thay đổi công việc. Chỉ Thư ký, Quản lý và Admin mới có quyền thao tác.', { title: 'Không có quyền', type: 'warning' });
            return;
        }
        if (editingNode) {
            const updatedRoadmap = roadmap.map(node => {
                if (node.id === editingNode.id) {
                    return {
                        ...node,
                        ...nodeData,
                        completedAt: nodeData.status === 'completed' ? (node.completedAt || new Date()) : null,
                    };
                }
                return node;
            });
            onUpdateRoadmap(updatedRoadmap);
            dialog.toast('Đã cập nhật công việc', 'success');
        } else {
            const newNodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const newNode = {
                id: newNodeId,
                ...nodeData,
                completedAt: nodeData.status === 'completed' ? new Date() : null,
            };
            onUpdateRoadmap([...roadmap, newNode]);
            dialog.toast('Đã thêm công việc mới', 'success');
        }
    };

    // Calculate overall timeline bounds
    const timelineBounds = useMemo(() => {
        const dates = [];
        if (event.startDate) dates.push(new Date(event.startDate).getTime());
        if (event.endDate) dates.push(new Date(event.endDate).getTime());

        (roadmap || []).forEach(n => {
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
                        <span>Sơ đồ Cây</span>
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
                        <span>Tiến độ Gantt</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRoadmapMode?.('table')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                            roadmapMode === 'table'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <IconTable className="w-3.5 h-3.5" />
                        <span>Dạng Bảng</span>
                    </button>
                </div>

                {/* Right: Event Date badge, Phase Color Legends & Action Buttons */}
                <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-auto">
                    {event.startDate && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800 shadow-2xs text-xs">
                            <IconCalendar className="w-3.5 h-3.5" />
                            <span>Ngày sự kiện: {formatDate(event.startDate)}</span>
                        </div>
                    )}

                    {!readOnly && (
                        <>
                            <button
                                type="button"
                                onClick={() => setModalState({ isOpen: true, node: null, parentId: null })}
                                className="px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                <IconLayers className="w-3.5 h-3.5 text-blue-600" />
                                <span>Thêm Giai đoạn</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setModalState({ isOpen: true, node: null, parentId: rootPhases[0]?.id || null })}
                                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all border-none cursor-pointer shadow-xs flex items-center gap-1.5"
                            >
                                <IconPlus className="w-3.5 h-3.5" />
                                <span>Thêm Công việc</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Gantt Timeline Table Container */}
            <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xs flex flex-col">
                <div className="overflow-x-auto scrollbar-thin">
                    <div className="min-w-[1000px] flex flex-col">
                        {/* Table Header: Columns + Date Axis with Event Date Marker */}
                        <div className="flex items-center border-b border-[var(--border-color)] bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-transparent dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-transparent py-3 text-xs sm:text-sm font-bold text-[var(--text-secondary)] sticky top-0 z-20">
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
                                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold shadow-xs whitespace-nowrap flex items-center gap-1 uppercase tracking-wider ring-1 ring-indigo-300 dark:ring-indigo-800">
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
                                        {/* Phase Sub-heading Row matching Tree View standard */}
                                        <div className="flex items-center justify-between py-2.5 px-4 bg-gradient-to-r from-blue-50/90 via-blue-50/40 to-transparent dark:from-blue-950/40 dark:via-blue-950/20 dark:to-transparent border-y border-[var(--border-color)]">
                                            <div className="flex items-center gap-2.5">
                                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${color.badge} uppercase tracking-wider`}>
                                                    Giai đoạn {pIdx + 1}
                                                </span>
                                                <span className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
                                                    {phase.name}
                                                </span>
                                                <span className="text-xs text-[var(--text-secondary)] font-medium">
                                                    ({subTasks.length} nhiệm vụ)
                                                </span>
                                            </div>
                                            {!readOnly && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!canManageRoadmapTasks(currentUser, members, event)) {
                                                            dialog.alert('Bạn không có quyền thêm công việc. Chỉ Thư ký, Quản lý và Admin mới có quyền thao tác.', { title: 'Không có quyền', type: 'warning' });
                                                            return;
                                                        }
                                                        setModalState({ isOpen: true, node: null, parentId: phase.id });
                                                    }}
                                                    className="px-2.5 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors shadow-2xs"
                                                >
                                                    <IconPlus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                    <span>Thêm việc</span>
                                                </button>
                                            )}
                                        </div>

                                        {/* Sub-tasks Rows */}
                                        {subTasks.map(task => {
                                            const pos = getBarPosition(task.startDate, task.dueDate);
                                            const assigneeObj = getAssigneeInfo(task.assignee);

                                            return (
                                                <div
                                                    key={task.id}
                                                    onClick={() => {
                                                        if (readOnly) return;
                                                        if (!canManageRoadmapTasks(currentUser, members, event)) {
                                                            dialog.alert('Bạn không có quyền chỉnh sửa công việc này. Chỉ Thư ký, Quản lý và Admin mới có quyền thao tác.', { title: 'Không có quyền', type: 'warning' });
                                                            return;
                                                        }
                                                        setModalState({ isOpen: true, node: task, parentId: task.parentId });
                                                    }}
                                                    className={`flex items-center py-3 hover:bg-[var(--bg-secondary)]/40 transition-colors group text-sm ${!readOnly ? 'cursor-pointer' : ''}`}
                                                >
                                                    {/* Col 1: Công việc */}
                                                    <div className="w-72 shrink-0 px-4 text-sm font-medium">
                                                        <span className="truncate block text-[var(--text-primary)] pl-2 group-hover:text-blue-600 transition-colors" title={task.name}>
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

                                                    {/* Col 4: Timeline Bar */}
                                                    <div className="flex-1 relative h-6">
                                                        <div
                                                            className={`absolute top-1 bottom-1 rounded-lg shadow-xs transition-all duration-200 ${color.bar}`}
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

            {/* Unified Add / Edit Node Modal */}
            <AddEditRoadmapModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, node: null, parentId: null })}
                onSave={handleSaveNode}
                node={modalState.node}
                parentId={modalState.parentId}
                rootPhases={rootPhases}
                childTasks={childTasks}
                eventAssignees={eventAssignees}
                stations={stations}
            />
        </div>
    );
}
