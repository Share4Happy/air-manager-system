'use client';
import React from 'react';
import { IconTree, IconTable, IconPlus } from '@/app/events/ui/icons';

export default function TreeToolbar({
    roadmapMode = 'tree',
    setRoadmapMode,
    onOpenAddPhase,
    readOnly = false,
}) {
    return (
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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                        <path d="M3 3v18h18" />
                        <rect x="7" y="6" width="6" height="3" rx="1" fill="currentColor" fillOpacity={0.2} />
                        <rect x="11" y="11" width="8" height="3" rx="1" fill="currentColor" fillOpacity={0.2} />
                        <rect x="9" y="16" width="5" height="3" rx="1" fill="currentColor" fillOpacity={0.2} />
                    </svg>
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

            {/* Right: Add Phase Button */}
            {!readOnly && (
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={onOpenAddPhase}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs border-none cursor-pointer"
                    >
                        <IconPlus className="w-3.5 h-3.5" />
                        <span>Thêm Giai đoạn</span>
                    </button>
                </div>
            )}
        </div>
    );
}
