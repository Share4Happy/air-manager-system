'use client';
import React, { useState, useMemo } from 'react';
import {
    IconClose,
    IconSearch,
    IconTree,
    IconLayers,
    IconCheck,
} from '@/app/events/ui/icons';

import { TASK_STATUS_CONFIG as statusConfig } from '@/app/events/ui/common';


export default function TaskMentionPickerModal({
    isOpen = false,
    onClose,
    roadmap = [],
    onSelectTask,
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPhaseFilter, setSelectedPhaseFilter] = useState('all');

    // Separate root phases and tasks
    const { phases, tasksByPhase, allTasks } = useMemo(() => {
        if (!Array.isArray(roadmap) || roadmap.length === 0) {
            return { phases: [], tasksByPhase: {}, allTasks: [] };
        }

        const phaseList = roadmap.filter(n => !n.parentId);
        const phaseMap = {};
        phaseList.forEach(p => {
            phaseMap[p.id] = p.name;
        });

        const childTasks = roadmap.filter(n => n.parentId);
        // Include also root tasks if there are nodes without children that aren't purely phases
        const tasks = childTasks.length > 0 ? childTasks : roadmap;

        const grouped = {};
        const enrichedTasks = [];

        tasks.forEach(t => {
            const phaseName = phaseMap[t.parentId] || 'Nhiệm vụ chung';
            const enriched = {
                ...t,
                phaseName,
            };
            enrichedTasks.push(enriched);

            if (!grouped[phaseName]) {
                grouped[phaseName] = [];
            }
            grouped[phaseName].push(enriched);
        });

        return { phases: phaseList, tasksByPhase: grouped, allTasks: enrichedTasks };
    }, [roadmap]);

    // Filter tasks by search query and phase filter
    const filteredTasks = useMemo(() => {
        let list = allTasks;

        if (selectedPhaseFilter !== 'all') {
            list = list.filter(t => t.phaseName === selectedPhaseFilter || t.parentId === selectedPhaseFilter);
        }

        if (!searchQuery.trim()) return list;
        const q = searchQuery.toLowerCase().trim();
        return list.filter(t => 
            (t.name && t.name.toLowerCase().includes(q)) ||
            (t.description && t.description.toLowerCase().includes(q)) ||
            (t.assigneeName && t.assigneeName.toLowerCase().includes(q)) ||
            (t.phaseName && t.phaseName.toLowerCase().includes(q))
        );
    }, [allTasks, selectedPhaseFilter, searchQuery]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1002] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="p-3.5 sm:p-4 bg-blue-600 text-white flex items-center justify-between gap-2 shadow-xs shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-[5px] bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                            <IconTree className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h4 className="text-sm font-bold text-white truncate m-0 leading-tight">
                                Gắn Task từ Cây Lộ Trình
                            </h4>
                            <span className="text-[10px] text-blue-100 font-medium">
                                Chọn một nhiệm vụ để trao đổi và theo dõi tiến độ
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-[5px] hover:bg-white/20 text-white flex items-center justify-center cursor-pointer border-none bg-transparent transition-colors"
                    >
                        <IconClose className="w-4 h-4" />
                    </button>
                </div>

                {/* Search Bar & Phase Filters */}
                <div className="p-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50 flex flex-col gap-2 shrink-0">
                    <div className="relative">
                        <IconSearch className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                        <input
                            type="text"
                            autoFocus
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm task theo tên, người phụ trách..."
                            className="w-full pl-8.5 pr-8 py-2 text-xs rounded-[5px] border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-[var(--text-secondary)]/70 transition-all"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-none bg-transparent cursor-pointer text-xs"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Phase filter pills */}
                    {phases.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                            <button
                                type="button"
                                onClick={() => setSelectedPhaseFilter('all')}
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 cursor-pointer border transition-colors ${
                                    selectedPhaseFilter === 'all'
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                        : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
                                }`}
                            >
                                Tất cả giai đoạn
                            </button>
                            {phases.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setSelectedPhaseFilter(p.name)}
                                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 cursor-pointer border transition-colors ${
                                        selectedPhaseFilter === p.name
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                            : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
                                    }`}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tasks List */}
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                    {filteredTasks.length === 0 ? (
                        <div className="py-12 text-center flex flex-col items-center justify-center text-[var(--text-secondary)] gap-2">
                            <IconLayers className="w-8 h-8 opacity-30" />
                            <p className="text-xs font-medium m-0">
                                {roadmap.length === 0
                                    ? 'Cây lộ trình chưa có nhiệm vụ nào được tạo.'
                                    : 'Không tìm thấy nhiệm vụ nào khớp với từ khóa.'}
                            </p>
                        </div>
                    ) : (
                        filteredTasks.map(task => {
                            const sCfg = statusConfig[task.status] || statusConfig.pending;
                            return (
                                <button
                                    key={task.id}
                                    type="button"
                                    onClick={() => {
                                        onSelectTask({
                                            id: task.id,
                                            name: task.name,
                                            status: task.status || 'pending',
                                            priority: task.priority || 'medium',
                                            assigneeName: task.assigneeName || '',
                                            phaseName: task.phaseName || '',
                                        });
                                        onClose();
                                    }}
                                    className="w-full text-left p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex items-start justify-between gap-3 group cursor-pointer shadow-2xs"
                                >
                                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-[5px] border border-blue-200 dark:border-blue-800">
                                                {task.phaseName}
                                            </span>
                                            <div className={`px-2 py-0.5 rounded-[5px] text-[10px] font-bold flex items-center gap-1 ${sCfg.bg}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dot}`} />
                                                <span>{sCfg.label}</span>
                                            </div>
                                        </div>

                                        <h5 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-blue-600 transition-colors m-0 line-clamp-2">
                                            {task.name}
                                        </h5>

                                        {task.assigneeName && (
                                            <span className="text-[10px] text-[var(--text-secondary)]">
                                                Phụ trách: <strong className="text-[var(--text-primary)] font-semibold">{task.assigneeName}</strong>
                                            </span>
                                        )}
                                    </div>

                                    <div className="shrink-0 p-1.5 rounded-full text-blue-600 bg-blue-50 dark:bg-blue-950 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <IconCheck className="w-3.5 h-3.5" />
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
