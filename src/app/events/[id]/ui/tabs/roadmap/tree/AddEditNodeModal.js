'use client';
import React from 'react';
import { EventModal } from '@/app/events/ui/common';
import { IconTable } from '@/app/events/ui/icons';

export default function AddEditNodeModal({
    isOpen,
    editingNode,
    addingParentId,
    nodeForm,
    setNodeForm,
    onClose,
    onSave,
    stations = [],
    eventAssignees = [],
}) {
    const isEditing = !!editingNode;
    const isChildTask = isEditing ? !!editingNode.parentId : !!addingParentId;

    const title = isEditing
        ? (isChildTask ? 'Chỉnh sửa nhiệm vụ' : 'Chỉnh sửa giai đoạn chính')
        : (isChildTask ? 'Thêm Nhiệm vụ trong Giai đoạn' : 'Thêm Giai đoạn chính (Phase)');

    return (
        <EventModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            maxWidth="max-w-md"
            onSubmit={onSave}
            submitLabel={isEditing ? 'Lưu thay đổi' : 'Thêm vào lộ trình'}
            cancelLabel="Hủy"
        >
            <div className="flex flex-col gap-3.5">
                <div>
                    <span className="text-xs font-semibold text-[var(--text-primary)] block mb-1">Tên mục *</span>
                    <input
                        type="text"
                        required
                        value={nodeForm.name}
                        onChange={e => setNodeForm({ ...nodeForm, name: e.target.value })}
                        placeholder={(!isEditing && isChildTask) ? 'Ví dụ: Thiết kế poster và banner...' : 'Ví dụ: 1. Kế hoạch & Chuẩn bị...'}
                        className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <span className="text-xs font-semibold text-[var(--text-primary)] block mb-1">Mô tả chi tiết</span>
                    <textarea
                        rows={2}
                        value={nodeForm.description}
                        onChange={e => setNodeForm({ ...nodeForm, description: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                </div>

                <div>
                    <span className="text-xs font-semibold text-[var(--text-primary)] block mb-1">Link minh chứng / Drive</span>
                    <input
                        type="url"
                        value={nodeForm.proofLink || ''}
                        onChange={e => setNodeForm({ ...nodeForm, proofLink: e.target.value })}
                        placeholder="https://drive.google.com/..."
                        className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {!isChildTask && stations.length > 0 && (
                    <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <IconTable className="w-4 h-4 text-blue-600" />
                            <div>
                                <span className="text-xs font-bold text-[var(--text-primary)] block">
                                    Gắn Ma trận Kịch bản ({stations.length} trạm)
                                </span>
                                <span className="text-[11px] text-[var(--text-secondary)]">
                                    Hiển thị bảng ma trận kịch bản thực địa bên trong giai đoạn này
                                </span>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={nodeForm.attachStations}
                            onChange={(e) => setNodeForm({ ...nodeForm, attachStations: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
                        />
                    </div>
                )}

                {isChildTask && (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <span className="text-xs font-semibold text-[var(--text-primary)] block mb-1">Người phụ trách</span>
                                <select
                                    value={nodeForm.assignee}
                                    onChange={e => setNodeForm({ ...nodeForm, assignee: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                >
                                    <option value="">-- Chưa gán --</option>
                                    {eventAssignees.length === 0 ? (
                                        <option disabled value="">Chưa có thành viên trong sự kiện</option>
                                    ) : (
                                        eventAssignees.map(a => (
                                            <option key={a.id} value={a.id}>
                                                {a.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div>
                                <span className="text-xs font-semibold text-[var(--text-primary)] block mb-1">Hạn hoàn thành</span>
                                <input
                                    type="date"
                                    value={nodeForm.dueDate}
                                    onClick={e => { try { e.target.showPicker?.(); } catch {} }}
                                    onChange={e => setNodeForm({ ...nodeForm, dueDate: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <span className="text-xs font-semibold text-[var(--text-primary)] block mb-1">Độ ưu tiên</span>
                                <select
                                    value={nodeForm.priority}
                                    onChange={e => setNodeForm({ ...nodeForm, priority: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="urgent">Khẩn cấp</option>
                                    <option value="high">Cao</option>
                                    <option value="medium">Trung bình</option>
                                    <option value="low">Thấp</option>
                                </select>
                            </div>

                            <div>
                                <span className="text-xs font-semibold text-[var(--text-primary)] block mb-1">Trạng thái</span>
                                <select
                                    value={nodeForm.status}
                                    onChange={e => setNodeForm({ ...nodeForm, status: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="pending">Chưa làm</option>
                                    <option value="in_progress">Đang làm</option>
                                    <option value="completed">Hoàn thành</option>
                                    {isEditing && <option value="overdue">Trễ hạn</option>}
                                    <option value="blocked">Vướng mắc</option>
                                </select>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </EventModal>
    );
}
