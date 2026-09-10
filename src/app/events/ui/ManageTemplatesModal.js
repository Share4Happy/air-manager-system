'use client';
import React, { useState } from 'react';
import { formatCurrencyVN } from '@/function';
import {
    IconClipboard,
    IconClose,
    IconPlus,
    IconTrash,
    IconCheck,
    IconDollar,
    IconLayers,
} from '@/app/events/ui/icons';

export default function ManageTemplatesModal({ isOpen, onClose, templates = [], onRefreshTemplates, canViewBudget = false }) {
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Template creation form state
    const [tplForm, setTplForm] = useState({
        name: '',
        type: 'competition',
        description: '',
        roadmapNodes: [
            { id: 'p1', parentId: null, name: '1. Giai đoạn Chuẩn bị', relativeDaysStart: -30, relativeDaysDue: -15, priority: 'high', order: 1 },
            { id: 'p1-1', parentId: 'p1', name: 'Lập kế hoạch và dự toán', relativeDaysStart: -30, relativeDaysDue: -20, priority: 'high', order: 2 },
            { id: 'p2', parentId: null, name: '2. Ngày diễn ra Sự kiện (D-Day)', relativeDaysStart: 0, relativeDaysDue: 0, priority: 'urgent', order: 3 },
            { id: 'p2-1', parentId: 'p2', name: 'Check-in và Vận hành', relativeDaysStart: 0, relativeDaysDue: 0, priority: 'urgent', order: 4 },
        ],
        budgetItems: [
            { id: 'b1', name: 'Chi phí quà tặng / giải thưởng', category: 'prizes', defaultEstimatedCost: 1000000, note: '' },
            { id: 'b2', name: 'Chi phí in ấn & truyền thông', category: 'marketing', defaultEstimatedCost: 500000, note: '' },
        ]
    });

    if (!isOpen) return null;

    const handleSaveTemplate = async (e) => {
        e.preventDefault();
        if (!tplForm.name.trim()) {
            setError('Vui lòng nhập tên mẫu');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/events/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tplForm),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                onRefreshTemplates?.();
                setIsCreating(false);
                setSelectedTemplate(data.template);
            } else {
                setError(data.message || 'Lỗi khi lưu mẫu');
            }
        } catch (err) {
            console.error(err);
            setError('Đã có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

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

    // Helper to add node in template form
    const handleAddPhaseInForm = () => {
        const newId = `p-${Date.now()}`;
        setTplForm(prev => ({
            ...prev,
            roadmapNodes: [
                ...prev.roadmapNodes,
                { id: newId, parentId: null, name: `Giai đoạn mới`, relativeDaysStart: -10, relativeDaysDue: -1, priority: 'medium', order: prev.roadmapNodes.length + 1 }
            ]
        }));
    };

    const handleAddTaskInForm = (phaseId) => {
        const newId = `t-${Date.now()}`;
        setTplForm(prev => ({
            ...prev,
            roadmapNodes: [
                ...prev.roadmapNodes,
                { id: newId, parentId: phaseId, name: `Nhiệm vụ mới`, relativeDaysStart: -7, relativeDaysDue: -2, priority: 'medium', order: prev.roadmapNodes.length + 1 }
            ]
        }));
    };

    const handleRemoveNodeInForm = (nodeId) => {
        setTplForm(prev => ({
            ...prev,
            roadmapNodes: prev.roadmapNodes.filter(n => n.id !== nodeId && n.parentId !== nodeId)
        }));
    };

    const handleNodeChangeInForm = (nodeId, field, value) => {
        setTplForm(prev => ({
            ...prev,
            roadmapNodes: prev.roadmapNodes.map(n => n.id === nodeId ? { ...n, [field]: value } : n)
        }));
    };

    const handleAddBudgetItemInForm = () => {
        const newId = `b-${Date.now()}`;
        setTplForm(prev => ({
            ...prev,
            budgetItems: [
                ...prev.budgetItems,
                { id: newId, name: 'Hạng mục chi mới', category: 'other', defaultEstimatedCost: 500000, note: '' }
            ]
        }));
    };

    const handleRemoveBudgetItemInForm = (itemId) => {
        setTplForm(prev => ({
            ...prev,
            budgetItems: prev.budgetItems.filter(i => i.id !== itemId)
        }));
    };

    const handleBudgetItemChangeInForm = (itemId, field, value) => {
        setTplForm(prev => ({
            ...prev,
            budgetItems: prev.budgetItems.map(i => i.id === itemId ? { ...i, [field]: value } : i)
        }));
    };

    const activeViewTpl = selectedTemplate || templates[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[var(--bg-primary)] w-full max-w-5xl rounded-3xl border border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex items-center justify-between bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md font-bold text-base">
                            <IconClipboard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">Quản lý Mẫu Quy trình Sự kiện (Event Templates)</h2>
                            <p className="text-xs text-[var(--text-secondary)]">Tạo mẫu quy trình, lộ trình cây và khung ngân sách mẫu để tái sử dụng</p>
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
                            <span className="text-xs font-bold uppercase text-[var(--text-primary)]">Danh sách Mẫu</span>
                            <button
                                onClick={() => { setIsCreating(true); setSelectedTemplate(null); }}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs border-none cursor-pointer flex items-center gap-1 transition-all"
                            >
                                <IconPlus className="w-3.5 h-3.5" />
                                <span>Tạo Mẫu</span>
                            </button>
                        </div>

                        {templates.map(tpl => {
                            const isSelected = !isCreating && (selectedTemplate?._id === tpl._id || (!selectedTemplate && activeViewTpl?._id === tpl._id));
                            return (
                                <div
                                    key={tpl._id}
                                    onClick={() => { setSelectedTemplate(tpl); setIsCreating(false); }}
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

                    {/* Right: Template Details or Create Form */}
                    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                        {isCreating ? (
                            /* Create Template Form */
                            <form onSubmit={handleSaveTemplate} className="flex flex-col gap-5">
                                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                                    <h3 className="text-base font-bold text-[var(--text-primary)]">Khởi tạo Mẫu Quy trình Sự kiện mới</h3>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="text-xs text-[var(--text-secondary)] hover:underline border-none bg-transparent cursor-pointer"
                                    >
                                        Hủy tạo
                                    </button>
                                </div>

                                {error && (
                                    <div className="p-3 text-xs text-red-700 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-xl">
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div>
                                        <span className="text-xs font-semibold text-[var(--text-primary)] block mb-1">Tên mẫu sự kiện *</span>
                                        <input
                                            type="text"
                                            required
                                            value={tplForm.name}
                                            onChange={e => setTplForm({ ...tplForm, name: e.target.value })}
                                            placeholder="Ví dụ: Mẫu Ngày hội STEM & Triển lãm Robofight"
                                            className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <span className="text-xs font-semibold text-[var(--text-primary)] block mb-1">Loại sự kiện</span>
                                        <select
                                            value={tplForm.type}
                                            onChange={e => setTplForm({ ...tplForm, type: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="competition">Cuộc thi Robotics</option>
                                            <option value="workshop">Workshop / Trải nghiệm</option>
                                            <option value="showcase">Showcase / Lễ Tốt nghiệp</option>
                                            <option value="internal">Nội bộ / Tập huấn</option>
                                            <option value="other">Khác</option>
                                        </select>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <span className="text-xs font-semibold text-[var(--text-primary)] block mb-1">Mô tả mẫu quy trình</span>
                                        <textarea
                                            rows={2}
                                            value={tplForm.description}
                                            onChange={e => setTplForm({ ...tplForm, description: e.target.value })}
                                            placeholder="Mô tả mục đích áp dụng của mẫu này..."
                                            className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Roadmap Nodes builder */}
                                <div className="border-t border-[var(--border-color)] pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold uppercase text-[var(--text-primary)]">
                                            Cấu trúc Cây Lộ trình Mẫu ({tplForm.roadmapNodes.length} khâu)
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleAddPhaseInForm}
                                            className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 flex items-center gap-1"
                                        >
                                            <IconPlus className="w-3.5 h-3.5" />
                                            <span>Thêm Giai đoạn</span>
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {tplForm.roadmapNodes.filter(n => !n.parentId).map(phase => {
                                            const subTasks = tplForm.roadmapNodes.filter(n => n.parentId === phase.id);

                                            return (
                                                <div key={phase.id} className="p-3.5 rounded-2xl border border-[var(--border-color)] bg-gray-50/70 dark:bg-gray-900/30 flex flex-col gap-2.5">
                                                    {/* Phase header */}
                                                    <div className="flex items-center justify-between gap-2">
                                                        <input
                                                            type="text"
                                                            value={phase.name}
                                                            onChange={e => handleNodeChangeInForm(phase.id, 'name', e.target.value)}
                                                            className="flex-1 font-bold text-xs px-2 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
                                                        />
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAddTaskInForm(phase.id)}
                                                                className="px-2 py-1 bg-[var(--bg-primary)] text-blue-600 dark:text-blue-400 text-[11px] font-semibold rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer flex items-center gap-1"
                                                            >
                                                                <IconPlus className="w-3 h-3" />
                                                                <span>Việc</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveNodeInForm(phase.id)}
                                                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-rose-950/40 rounded border-none bg-transparent cursor-pointer"
                                                            >
                                                                <IconTrash className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Subtasks */}
                                                    <div className="pl-4 flex flex-col gap-2 border-l-2 border-blue-200 dark:border-blue-900">
                                                        {subTasks.map(task => (
                                                            <div key={task.id} className="flex items-center justify-between gap-2 bg-[var(--bg-primary)] p-2 rounded-xl border border-[var(--border-color)]">
                                                                <input
                                                                    type="text"
                                                                    value={task.name}
                                                                    onChange={e => handleNodeChangeInForm(task.id, 'name', e.target.value)}
                                                                    className="flex-1 text-xs px-2 py-1 rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                                                                />
                                                                <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
                                                                    <span>Hạn: D</span>
                                                                    <input
                                                                        type="number"
                                                                        value={task.relativeDaysDue}
                                                                        onChange={e => handleNodeChangeInForm(task.id, 'relativeDaysDue', Number(e.target.value))}
                                                                        className="w-12 px-1 py-0.5 text-center text-xs rounded border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
                                                                        title="Số ngày so với D-Day (VD: -7 là trước 7 ngày)"
                                                                    />
                                                                    <span>ngày</span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveNodeInForm(task.id)}
                                                                    className="p-1 text-gray-400 hover:text-red-500 border-none bg-transparent cursor-pointer"
                                                                >
                                                                    <IconTrash className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Budget Items builder (only if canViewBudget) */}
                                {canViewBudget && (
                                    <div className="border-t border-[var(--border-color)] pt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold uppercase text-[var(--text-primary)]">
                                                Danh mục Dự toán Ngân sách Mẫu ({tplForm.budgetItems.length} mục)
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleAddBudgetItemInForm}
                                                className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-100 flex items-center gap-1"
                                            >
                                                <IconPlus className="w-3.5 h-3.5" />
                                                <span>Thêm mục chi</span>
                                            </button>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            {tplForm.budgetItems.map(item => (
                                                <div key={item.id} className="flex items-center gap-2 p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs">
                                                    <input
                                                        type="text"
                                                        value={item.name}
                                                        onChange={e => handleBudgetItemChangeInForm(item.id, 'name', e.target.value)}
                                                        placeholder="Tên mục chi"
                                                        className="flex-1 px-2 py-1 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={item.defaultEstimatedCost}
                                                        onChange={e => handleBudgetItemChangeInForm(item.id, 'defaultEstimatedCost', Number(e.target.value))}
                                                        placeholder="Dự toán VNĐ"
                                                        className="w-28 px-2 py-1 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveBudgetItemInForm(item.id)}
                                                        className="p-1 text-gray-400 hover:text-red-500 border-none bg-transparent cursor-pointer"
                                                    >
                                                        <IconTrash className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Save Actions */}
                                <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-end gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="px-4 py-2 rounded-xl text-xs font-medium border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-transparent cursor-pointer"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white border-none cursor-pointer shadow-md disabled:opacity-50 transition-all"
                                    >
                                        {loading ? 'Đang lưu mẫu...' : 'Lưu Mẫu Quy trình'}
                                    </button>
                                </div>
                            </form>
                        ) : activeViewTpl ? (
                            /* View Template Preview */
                            <div className="flex flex-col gap-6">
                                <div className="flex items-start justify-between gap-4 border-b border-[var(--border-color)] pb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-[var(--text-primary)]">{activeViewTpl.name}</h3>
                                            {activeViewTpl.isDefault ? (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold">
                                                    Mặc định hệ thống
                                                </span>
                                            ) : (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
                                                    Mẫu tùy chỉnh
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)] mt-1">{activeViewTpl.description}</p>
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
                                    <h4 className="text-xs font-bold uppercase text-[var(--text-primary)] mb-3">
                                        Lộ trình khâu chuẩn bị ({activeViewTpl.roadmapNodes?.length || 0} khâu)
                                    </h4>
                                    <div className="flex flex-col gap-3">
                                        {(activeViewTpl.roadmapNodes || []).filter(n => !n.parentId).map((phase, pIdx) => {
                                            const subTasks = (activeViewTpl.roadmapNodes || []).filter(n => n.parentId === phase.id);

                                            return (
                                                <div key={phase.id} className="p-3.5 rounded-2xl border border-[var(--border-color)] bg-gray-50/60 dark:bg-gray-900/30 flex flex-col gap-2">
                                                    <div className="font-bold text-xs text-blue-700 dark:text-blue-300">
                                                        {pIdx + 1}. {phase.name}
                                                    </div>
                                                    <div className="pl-3 flex flex-col gap-1.5 border-l border-blue-200 dark:border-blue-900">
                                                        {subTasks.map(task => (
                                                            <div key={task.id} className="flex items-center justify-between text-xs text-[var(--text-primary)]">
                                                                <span>↳ {task.name}</span>
                                                                <span className="text-[11px] text-[var(--text-secondary)]">
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
                                        <h4 className="text-xs font-bold uppercase text-[var(--text-primary)] mb-3">
                                            Khung Dự toán Ngân sách Mẫu ({activeViewTpl.budgetItems?.length || 0} mục)
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {(activeViewTpl.budgetItems || []).map(item => (
                                                <div key={item.id} className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between text-xs">
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

