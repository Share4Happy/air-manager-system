'use client';
import React from 'react';
import { formatDate } from '@/function';
import { statusConfig, priorityConfig } from './treeConstants';
import { canManageRoadmapTasks, canEditTaskProofLink } from '../roadmapPermissions';
import TaskProofLink from '../TaskProofLink';
import { useEventDialog } from '@/app/events/ui/common';
import {
    IconCalendar,
    IconDotsVertical,
    IconEdit,
    IconTrash,
    IconChatBubble,
    IconCheckBadge,
    IconMessageSquare,
    IconCheck,
    IconSend,
} from '@/app/events/ui/icons';

export default function TreeTaskItem({
    task,
    phaseTheme,
    isHighlighted = false,
    readOnly = false,
    currentUser = null,
    members = [],
    event = {},
    eventAssignees = [],
    getAssigneeInfo,
    activeMenuId,
    onToggleMenu,
    onAdvanceStatus,
    onToggleApprove,
    onOpenZaloModal,
    onOpenCommentsModal,
    onQuickAssign,
    onOpenEdit,
    onDeleteTask,
    onUpdateProofLink,
}) {
    const dialog = useEventDialog();
    const sCfg = statusConfig[task.status] || statusConfig.pending;
    const pCfg = priorityConfig[task.priority] || priorityConfig.medium;
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
    const commentCount = (task.comments || []).length;
    const assInfo = getAssigneeInfo ? getAssigneeInfo(task.assignee) : null;
    const menuKey = `task-${task.id}`;

    const handleZaloClick = () => {
        if (readOnly) return;
        if (!task.assignee) {
            dialog.alert('Công việc chưa được phân công cho ai! Vui lòng chọn người phụ trách trước khi gửi Zalo.', { title: 'Chưa phân công', type: 'warning' });
            return;
        }
        onOpenZaloModal?.(task);
    };

    const handleEditClick = () => {
        if (readOnly) return;
        if (!canManageRoadmapTasks(currentUser, members, event)) {
            dialog.alert('Bạn không có quyền chỉnh sửa công việc này. Chỉ Thư ký, Quản lý và Admin mới có quyền chỉnh sửa thông tin nhiệm vụ.', { title: 'Không có quyền', type: 'warning' });
            return;
        }
        onOpenEdit?.(task);
    };

    const handleDeleteClick = () => {
        if (readOnly) return;
        if (!canManageRoadmapTasks(currentUser, members, event)) {
            dialog.alert('Bạn không có quyền xóa công việc này. Chỉ Thư ký, Quản lý và Admin mới có quyền thao tác.', { title: 'Không có quyền', type: 'warning' });
            return;
        }
        onDeleteTask?.(task.id);
    };

    return (
        <div
            id={`roadmap-task-${task.id}`}
            className={`sm:ml-8 relative flex flex-col md:flex-row md:items-center justify-between p-3 rounded-xl border transition-all duration-300 gap-3 group ${
                isHighlighted
                    ? 'ring-4 ring-blue-500 shadow-xl scale-[1.01] bg-blue-50/90 border-blue-400'
                    : `border-[var(--border-color)] bg-[var(--bg-secondary)] ${phaseTheme.hoverBorder}`
            }`}
        >
            {/* Horizontal connector line on desktop */}
            <div className={`absolute -left-5 top-1/2 w-5 h-0.5 ${phaseTheme.treeLine} hidden sm:block`} />

            {/* Left: Status Pill + Task Details */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Quick status toggle button / indicator (No permission restriction as requested) */}
                {readOnly ? (
                    <div className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold border shadow-2xs flex items-center gap-1.5 shrink-0 ${sCfg.bg}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${sCfg.dot}`} />
                        <span>{sCfg.label}</span>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => onAdvanceStatus?.(task.id, task.status)}
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold border shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-102 shrink-0 ${sCfg.bg}`}
                        title="Nhấn để chuyển nhanh trạng thái"
                    >
                        <span className={`w-2.5 h-2.5 rounded-full ${sCfg.dot}`} />
                        <span>{sCfg.label}</span>
                    </button>
                )}

                <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <span className={`text-sm sm:text-base font-bold text-[var(--text-primary)] ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                            {task.name}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${pCfg.color}`}>
                            {pCfg.label}
                        </span>
                    </div>
                    {task.description && (
                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                            {task.description}
                        </p>
                    )}

                    {/* Minh chứng (Proof Link) */}
                    <TaskProofLink
                        task={task}
                        currentUser={currentUser}
                        members={members}
                        event={event}
                        readOnly={readOnly}
                        onUpdateProofLink={onUpdateProofLink}
                    />
                </div>
            </div>

            {/* Right: Actions, Zalo, Comments, Approval, Assignee, Due Date & 3-Dots Menu */}
            <div className="flex items-center gap-2 sm:gap-2.5 text-xs shrink-0 self-end md:self-center flex-wrap justify-end">
                {/* 1. Duyệt Task Button */}
                {task.isApproved ? (
                    <button
                        type="button"
                        onClick={() => !readOnly && onToggleApprove?.(task.id, false)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1 hover:bg-emerald-200/80 cursor-pointer shadow-2xs"
                        title={`Đã duyệt bởi ${task.approvedBy || 'Ban tổ chức'}. Bấm để hủy duyệt.`}
                    >
                        <IconCheckBadge className="w-3.5 h-3.5 text-emerald-600" />
                        <span>✓ Đã duyệt</span>
                    </button>
                ) : (
                    !readOnly && (
                        <button
                            type="button"
                            onClick={() => onToggleApprove?.(task.id, true)}
                            className="px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] hover:bg-emerald-50 border border-[var(--border-color)] hover:border-emerald-300 text-[var(--text-secondary)] hover:text-emerald-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Bấm để phê duyệt nhiệm vụ này"
                        >
                            <IconCheck className="w-3.5 h-3.5" />
                            <span>Duyệt task</span>
                        </button>
                    )
                )}

                {/* 2. Gửi Zalo Button (Rút gọn thành icon Send với kiểm tra assignee) */}
                {!readOnly && (
                    <button
                        type="button"
                        onClick={handleZaloClick}
                        className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center cursor-pointer transition-colors shadow-2xs shrink-0"
                        title={task.assignee ? `Gửi Zalo cho người phụ trách (${assInfo?.name || 'Thành viên'})` : 'Gửi Zalo (Chưa gán người làm)'}
                    >
                        <IconSend className="w-3.5 h-3.5" />
                    </button>
                )}

                {/* 3. Comment Indicator / Button (Có sẵn viền và nền đồng bộ) */}
                <button
                    type="button"
                    onClick={() => onOpenCommentsModal?.(task)}
                    className={`px-2 py-1 rounded-lg border border-[var(--border-color)] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs ${
                        commentCount > 0
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold'
                            : 'bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                    title={commentCount > 0 ? `Có ${commentCount} nhận xét` : 'Thêm nhận xét'}
                >
                    <IconChatBubble className="w-3.5 h-3.5" />
                    {commentCount > 0 && <span>{commentCount}</span>}
                </button>

                {/* Quick Assign Select / Badge */}
                {readOnly ? (
                    assInfo ? (
                        <span className={`text-xs sm:text-sm font-semibold py-1.5 px-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] max-w-[190px] truncate ${assInfo.type === 'user' ? 'text-blue-700' : 'text-emerald-700'}`}>
                            {assInfo.name}
                        </span>
                    ) : null
                ) : (
                    <div className="relative flex items-center">
                        <select
                            value={task.assignee?._id || task.assignee?.id || task.assignee || ''}
                            onChange={(e) => onQuickAssign?.(task.id, e.target.value)}
                            className={`text-xs font-medium py-1 px-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[160px] truncate ${
                                assInfo
                                    ? (assInfo.type === 'user' ? 'text-blue-700 font-semibold' : 'text-emerald-700 font-semibold')
                                    : 'text-[var(--text-secondary)] italic'
                            }`}
                            title="Gán người phụ trách"
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
                )}

                {/* Due Date */}
                {task.dueDate && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-[var(--text-secondary)]'}`}>
                        <IconCalendar className="w-3.5 h-3.5" />
                        <span>{formatDate(task.dueDate)}</span>
                        {isOverdue && <span className="text-[10px] px-1 py-0.2 bg-rose-100 text-rose-700 rounded font-bold">Trễ</span>}
                    </div>
                )}

                {/* 3-Dots Dropdown Menu for Task Item */}
                {!readOnly && (
                    <div className="relative" data-dropdown-menu="true">
                        <button
                            type="button"
                            onClick={(e) => onToggleMenu?.(e, menuKey)}
                            className="w-7 h-7 rounded-lg text-gray-400 hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] border-none bg-transparent cursor-pointer flex items-center justify-center transition-colors"
                            title="Thao tác nhiệm vụ"
                        >
                            <IconDotsVertical className="w-3.5 h-3.5" />
                        </button>

                        {activeMenuId === menuKey && (
                            <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-xl py-1.5">
                                <button
                                    type="button"
                                    onClick={handleEditClick}
                                    className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] flex items-center gap-2 transition-colors border-none bg-transparent cursor-pointer"
                                >
                                    <IconEdit className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Chỉnh sửa chi tiết</span>
                                </button>
                                <div className="my-1 border-t border-[var(--border-color)]" />
                                <button
                                    type="button"
                                    onClick={handleDeleteClick}
                                    className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors border-none bg-transparent cursor-pointer"
                                >
                                    <IconTrash className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Xóa nhiệm vụ</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
