'use client';
import React, { useState } from 'react';
import { formatCurrencyVN } from '@/function';
import {
    IconClipboard,
    IconClose,
    IconTrash,
} from '@/app/events/ui/icons';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-[var(--bg-primary)] w-full max-w-5xl rounded-3xl border border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md font-bold text-base">
                            <IconClipboard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mẫu Quy trình Sự kiện (Event Templates)</h2>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Xem mẫu quy trình, lộ trình cây và khung ngân sách mẫu để tái sử dụng</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-none bg-transparent cursor-pointer"
                    >
                        <IconClose className="w-4 h-4" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[var(--border-color)]">
                    {/* Left: Templates List */}
                    <div className="w-full md:w-80 p-4 overflow-y-auto flex flex-col gap-2.5 bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">Danh sách Mẫu</span>
                        </div>

                        {templates.map(tpl => {
                            const isSelected = selectedTemplate?._id === tpl._id || (!selectedTemplate && activeViewTpl?._id === tpl._id);
                            return (
                                <div
                                    key={tpl._id}
                                    onClick={() => setSelectedTemplate(tpl)}
                                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col gap-1 text-left ${
                                        isSelected
                                            ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 ring-1 ring-blue-600 shadow-sm'
                                            : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-gray-400'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-[var(--text-primary)]">{tpl.name}</h4>
                                        {tpl.isDefault ? (
                                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold">
                                                Mặc định
                                            </span>
                                        ) : (
                                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-semibold">
                                                Tự tạo
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">{tpl.description}</p>
                                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
                                        {tpl.roadmapNodes?.length || 0} khâu • {tpl.budgetItems?.length || 0} mục ngân sách
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right: Template Details Preview */}
                    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                        {activeViewTpl ? (
                            <div className="flex flex-col gap-6">
                                <div className="flex items-start justify-between gap-4 border-b border-[var(--border-color)] pb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{activeViewTpl.name}</h3>
                                            {activeViewTpl.isDefault ? (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold">
                                                    Mặc định hệ thống
                                                </span>
                                            ) : (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
                                                    Mẫu tùy chỉnh
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">{activeViewTpl.description}</p>
                                    </div>

                                    {!activeViewTpl.isDefault && (
                                        <button
                                            onClick={() => handleDeleteTemplate(activeViewTpl._id)}
                                            className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-semibold hover:bg-rose-100 cursor-pointer transition-colors flex items-center gap-1.5"
                                        >
                                            <IconTrash className="w-3.5 h-3.5" />
                                            <span>Xóa mẫu này</span>
                                        </button>
                                    )}
                                </div>

                                {/* Roadmap Preview */}
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3">
                                        Lộ trình khâu chuẩn bị ({activeViewTpl.roadmapNodes?.length || 0} khâu)
                                    </h4>
                                    <div className="flex flex-col gap-3">
                                        {(activeViewTpl.roadmapNodes || []).filter(n => !n.parentId).map((phase, pIdx) => {
                                            const subTasks = (activeViewTpl.roadmapNodes || []).filter(n => n.parentId === phase.id);

                                            return (
                                                <div key={phase.id} className="p-3.5 rounded-2xl border border-[var(--border-color)] bg-gray-50/60 dark:bg-gray-900/30 flex flex-col gap-2">
                                                    <div className="font-bold text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                                                        {pIdx + 1}. {phase.name}
                                                    </div>
                                                    <div className="pl-3 flex flex-col gap-1.5 border-l-2 border-blue-200 dark:border-blue-900">
                                                        {subTasks.map(task => (
                                                            <div key={task.id} className="flex items-center justify-between text-xs sm:text-sm text-[var(--text-primary)]">
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
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3">
                                            Khung Dự toán Ngân sách Mẫu ({activeViewTpl.budgetItems?.length || 0} mục)
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {(activeViewTpl.budgetItems || []).map(item => (
                                                <div key={item.id} className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between text-xs sm:text-sm">
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
            </div>
        </div>
    );
}

