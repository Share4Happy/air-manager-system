'use client';
import React, { useState } from 'react';
import { formatCurrencyVN } from '@/function';
import {
    IconClipboard,
    IconTrash,
} from '@/app/events/ui/icons';
import { EventModal } from './common';

export default function ManageTemplatesModal({ isOpen, onClose, templates = [], onRefreshTemplates, canViewBudget = false }) {
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    if (!isOpen) return null;

    const handleDeleteTemplate = async (tplId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa mẫu sự kiện này?')) return;
        try {
            const res = await fetch(`/api/events/templates/${tplId}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.success) {
                onRefreshTemplates?.();
                if (selectedTemplate?._id === tplId) setSelectedTemplate(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const activeViewTpl = selectedTemplate || templates[0];

    return (
        <EventModal
            isOpen={isOpen}
            onClose={onClose}
            title="Mẫu Quy trình Sự kiện (Event Templates)"
            subtitle="Xem trước mẫu quy trình, lộ trình cây và khung ngân sách mẫu để tái sử dụng"
            icon={IconClipboard}
            maxWidth="max-w-5xl"
            cancelLabel="Đóng"
            submitLabel=""
        >
            <div className="overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[var(--border-color)] -m-4 sm:-m-6 min-h-[460px]">
                {/* Left: Templates List */}
                <div className="w-full md:w-80 p-4 overflow-y-auto flex flex-col gap-2 bg-[var(--bg-secondary)]/20 shrink-0">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                            Danh sách Mẫu ({templates.length})
                        </span>
                    </div>

                    {templates.map(tpl => {
                        const isSelected = selectedTemplate?._id === tpl._id || (!selectedTemplate && activeViewTpl?._id === tpl._id);
                        return (
                            <div
                                key={tpl._id}
                                onClick={() => setSelectedTemplate(tpl)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 text-left ${
                                    isSelected
                                        ? 'border-blue-600 bg-blue-500/10 shadow-xs ring-1 ring-blue-500'
                                        : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-blue-500/50'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className={`text-xs font-bold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-primary)]'}`}>
                                        {tpl.name}
                                    </h4>
                                    {tpl.isDefault ? (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-semibold shrink-0">
                                            Mặc định
                                        </span>
                                    ) : (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-semibold shrink-0">
                                            Tùy chỉnh
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">{tpl.description}</p>
                                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-1">
                                    {tpl.roadmapNodes?.length || 0} khâu • {tpl.budgetItems?.length || 0} mục ngân sách
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Right: Template Details Preview */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                    {activeViewTpl ? (
                        <div className="flex flex-col gap-5">
                            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">{activeViewTpl.name}</h3>
                                        {activeViewTpl.isDefault ? (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-semibold">
                                                Mặc định hệ thống
                                            </span>
                                        ) : (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-semibold">
                                                Mẫu tùy chỉnh
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">{activeViewTpl.description}</p>
                                </div>

                                {!activeViewTpl.isDefault && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteTemplate(activeViewTpl._id)}
                                        className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-semibold hover:bg-rose-100 cursor-pointer transition-colors flex items-center gap-1.5 shrink-0"
                                    >
                                        <IconTrash className="w-3.5 h-3.5" />
                                        <span>Xóa mẫu</span>
                                    </button>
                                )}
                            </div>

                            {/* Roadmap Preview */}
                            <div className="flex flex-col gap-2.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                                    Lộ trình khâu chuẩn bị ({activeViewTpl.roadmapNodes?.length || 0} khâu)
                                </span>
                                <div className="flex flex-col gap-2.5">
                                    {(activeViewTpl.roadmapNodes || []).filter(n => !n.parentId).map((phase, pIdx) => {
                                        const subTasks = (activeViewTpl.roadmapNodes || []).filter(n => n.parentId === phase.id);

                                        return (
                                            <div key={phase.id} className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex flex-col gap-2">
                                                <div className="font-bold text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                                                    {pIdx + 1}. {phase.name}
                                                </div>
                                                <div className="pl-3 flex flex-col gap-1.5 border-l-2 border-blue-500/30">
                                                    {subTasks.map(task => (
                                                        <div key={task.id} className="flex items-center justify-between text-xs text-[var(--text-primary)]">
                                                            <span>↳ {task.name}</span>
                                                            <span className="text-[11px] text-[var(--text-secondary)] font-mono font-medium">
                                                                {task.relativeDaysDue === 0 ? 'D-Day' : `D ${task.relativeDaysDue > 0 ? '+' : ''}${task.relativeDaysDue} ngày`}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Budget items preview (only if canViewBudget) */}
                            {canViewBudget && (
                                <div className="flex flex-col gap-2.5">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                                        Khung Dự toán Ngân sách Mẫu ({activeViewTpl.budgetItems?.length || 0} mục)
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {(activeViewTpl.budgetItems || []).map(item => (
                                            <div key={item.id} className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex items-center justify-between text-xs">
                                                <span className="font-medium text-[var(--text-primary)]">{item.name}</span>
                                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                                    {formatCurrencyVN(item.defaultEstimatedCost)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </EventModal>
    );
}

