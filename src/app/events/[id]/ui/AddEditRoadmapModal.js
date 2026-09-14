'use client';
import React, { useState, useEffect } from 'react';
import { EventModal } from '@/app/events/ui/common';
import {
    IconPlus,
    IconEdit,
    IconTable,
    IconCalendar,
    IconUser,
    IconLayers,
} from '@/app/events/ui/icons';

const priorityOptions = [
    { value: 'urgent', label: 'Khẩn cấp', dot: 'bg-rose-500' },
    { value: 'high', label: 'Cao', dot: 'bg-amber-500' },
    { value: 'medium', label: 'Trung bình', dot: 'bg-slate-400' },
    { value: 'low', label: 'Thấp', dot: 'bg-slate-300 dark:bg-slate-600' },
];

const statusOptions = [
    { value: 'pending', label: 'Chưa làm', dot: 'bg-slate-400' },
    { value: 'in_progress', label: 'Đang làm', dot: 'bg-blue-500' },
    { value: 'completed', label: 'Hoàn thành', dot: 'bg-emerald-500' },
    { value: 'overdue', label: 'Trễ hạn', dot: 'bg-amber-500' },
    { value: 'blocked', label: 'Vướng mắc', dot: 'bg-rose-500' },
];

export default function AddEditRoadmapModal({
    isOpen,
    onClose,
    onSave,
    node = null,
    parentId = null,
    rootPhases = [],
    childTasks = [],
    eventAssignees = [],
    stations = [],
}) {
    const isEditing = Boolean(node);
    const [targetParentId, setTargetParentId] = useState(parentId);
    const [form, setForm] = useState({
        name: '',
        description: '',
        assignee: '',
        startDate: '',
        dueDate: '',
        priority: 'medium',
        status: 'pending',
        attachStations: false,
    });

    useEffect(() => {
        if (isOpen) {
            if (node) {
                setTargetParentId(node.parentId || null);
                setForm({
                    name: node.name || '',
                    description: node.description || '',
                    assignee: node.assignee ? String(node.assignee._id || node.assignee.id || node.assignee) : '',
                    startDate: node.startDate ? new Date(node.startDate).toISOString().split('T')[0] : '',
                    dueDate: node.dueDate ? new Date(node.dueDate).toISOString().split('T')[0] : '',
                    priority: node.priority || 'medium',
                    status: node.status || 'pending',
                    attachStations: Boolean(node.attachStations),
                });
            } else {
                setTargetParentId(parentId);
                setForm({
                    name: '',
                    description: '',
                    assignee: '',
                    startDate: '',
                    dueDate: '',
                    priority: 'medium',
                    status: 'pending',
                    attachStations: false,
                });
            }
        }
    }, [isOpen, node, parentId]);

    const isTask = Boolean(targetParentId || (node && node.parentId));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;

        const nodeData = {
            name: form.name.trim(),
            description: form.description.trim(),
            parentId: isTask ? (targetParentId || rootPhases[0]?.id || null) : null,
            assignee: form.assignee || null,
            startDate: form.startDate ? new Date(form.startDate) : null,
            dueDate: form.dueDate ? new Date(form.dueDate) : null,
            priority: form.priority,
            status: form.status,
            attachStations: form.attachStations,
        };

        onSave(nodeData, node);
        onClose();
    };

    return (
        <EventModal
            isOpen={isOpen}
            onClose={onClose}
            title={
                isEditing
                    ? isTask
                        ? 'Chỉnh sửa Công việc'
                        : 'Chỉnh sửa Giai đoạn'
                    : isTask
                    ? 'Thêm Công việc mới'
                    : 'Thêm Giai đoạn mới'
            }
            subtitle={
                isTask
                    ? 'Chi tiết nhiệm vụ cần thực hiện, người phụ trách và thời hạn'
                    : 'Phân đoạn mốc thời gian chính của toàn bộ kế hoạch sự kiện'
            }
            icon={isEditing ? IconEdit : (isTask ? IconPlus : IconLayers)}
            maxWidth="max-w-lg"
            onSubmit={handleSubmit}
            submitLabel={isEditing ? 'Lưu thay đổi' : 'Thêm vào lộ trình'}
            cancelLabel="Hủy"
        >
            <div className="flex flex-col gap-3.5 text-xs sm:text-sm">
                {/* Group 1: General Info Card */}
                <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex flex-col gap-3">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                        {isTask ? 'Thông tin công việc' : 'Thông tin giai đoạn'}
                    </span>

                    <div>
                        <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                            {isTask ? 'Tên công việc / nhiệm vụ' : 'Tên giai đoạn'} <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder={isTask ? 'Ví dụ: Thiết kế poster và backdrop sân khấu...' : 'Ví dụ: 1. Kế hoạch & Chuẩn bị...'}
                            className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                            Mô tả chi tiết / Yêu cầu
                        </label>
                        <textarea
                            rows={2}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Ghi chú nội dung yêu cầu hoàn thành..."
                            className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none leading-relaxed transition-all"
                        />
                    </div>

                    {!isTask && stations.length > 0 && (
                        <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <IconTable className="w-3.5 h-3.5" />
                                </span>
                                <div>
                                    <span className="text-xs font-bold text-[var(--text-primary)] block">
                                        Gắn Ma trận Kịch bản ({stations.length} trạm)
                                    </span>
                                    <span className="text-[11px] text-[var(--text-secondary)]">
                                        Hiển thị bảng phân khu thực địa bên trong giai đoạn này
                                    </span>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={form.attachStations}
                                onChange={(e) => setForm({ ...form, attachStations: e.target.checked })}
                                className="w-4 h-4 rounded text-blue-600 border-[var(--border-color)] cursor-pointer accent-blue-600"
                            />
                        </div>
                    )}
                </div>

                {/* Group 2: Assignment & Schedule (Only for Tasks) */}
                {isTask && (
                    <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex flex-col gap-3">
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                            Tiến độ & Phân công
                        </span>

                        {rootPhases.length > 0 && (
                            <div>
                                <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1 mb-1">
                                    <IconLayers className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                    <span>Thuộc Giai đoạn chính</span>
                                </label>
                                <select
                                    value={targetParentId || ''}
                                    onChange={(e) => setTargetParentId(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-medium"
                                >
                                    {rootPhases.map((p, idx) => (
                                        <option key={p.id} value={p.id}>
                                            Giai đoạn {idx + 1}: {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1 mb-1">
                                    <IconUser className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                    <span>Người phụ trách</span>
                                </label>
                                <select
                                    value={form.assignee}
                                    onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                                >
                                    <option value="">-- Chưa gán người làm --</option>
                                    {eventAssignees.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.name} {a.role ? `(${a.role})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1 mb-1">
                                    <IconCalendar className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                    <span>Hạn hoàn thành (Deadline)</span>
                                </label>
                                <input
                                    type="date"
                                    value={form.dueDate}
                                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                                    Độ ưu tiên
                                </label>
                                <select
                                    value={form.priority}
                                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                                >
                                    {priorityOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                                    Trạng thái tiến độ
                                </label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                                >
                                    {statusOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </EventModal>
    );
}
