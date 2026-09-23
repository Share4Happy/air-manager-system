'use client';
import React, { useState, useMemo } from 'react';
import { formatDate } from '@/function';
import ActionMenu from '@/app/events/ui/common/ActionMenu';
import AddEditRoadmapModal from './modals/AddEditRoadmapModal';
import TaskCommentsModal from './modals/TaskCommentsModal';
import SendTaskZaloModal from './modals/SendTaskZaloModal';
import TaskProofLink from './TaskProofLink';
import { canManageRoadmapTasks, canEditTaskProofLink } from './roadmapPermissions';
import {
    IconTree,
    IconGantt,
    IconTable,
    IconPlus,
    IconEdit,
    IconTrash,
    IconChatBubble,
    IconMessageSquare,
    IconDownload,
    IconLayers,
    IconSearch,
    IconClose,
    IconCalendar,
    IconSend,
    IconLink,
    IconExternalLink,
    IconCopy,
    IconCheck,
} from '@/app/events/ui/icons';

import {
    TASK_STATUS_CONFIG as statusConfig,
    TASK_PRIORITY_CONFIG as priorityConfig,
    PHASE_COLOR_PALETTE as phaseColorPalette,
    buildEventAssigneesList,
    resolveAssigneeInfo,
} from '@/app/events/ui/common';

export default function RoadmapTableView({
    roadmap = [],
    stations = [],
    onUpdateRoadmap,
    onUpdateStations,
    onUpdateMultiple,
    currentUser = null,
    users = [],
    members = [],
    event = {},
    roadmapMode = 'table',
    setRoadmapMode,
    readOnly = false,
}) {
    const rootPhases = useMemo(() => (roadmap || []).filter(n => !n.parentId), [roadmap]);
    const childTasks = useMemo(() => (roadmap || []).filter(n => n.parentId), [roadmap]);

    // Filters & Modals state
    const [search, setSearch] = useState('');
    const [selectedPhase, setSelectedPhase] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedPriority, setSelectedPriority] = useState('all');
    const [selectedAssignee, setSelectedAssignee] = useState('all');

    const [modalState, setModalState] = useState({ isOpen: false, node: null, parentId: null });
    const [commentsModalTask, setCommentsModalTask] = useState(null);
    const [zaloModalTask, setZaloModalTask] = useState(null);

    // Event Assignees list
    const eventAssignees = useMemo(() => {
        return buildEventAssigneesList(members, users);
    }, [members, users]);

    const getAssigneeInfo = (assigneeId) => {
        return resolveAssigneeInfo(assigneeId, members, users);
    };

    // Grouped data by Phase for table row grouping
    const groupedPhases = useMemo(() => {

        return rootPhases.map((phase, pIdx) => {
            const tasksInPhase = childTasks.filter(t => t.parentId === phase.id);
            const totalTasks = tasksInPhase.length;
            const completedTasks = tasksInPhase.filter(t => t.status === 'completed').length;
            const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            const filteredTasksInPhase = tasksInPhase.filter(task => {
                const matchSearch =
                    !search.trim() ||
                    (task.name || '').toLowerCase().includes(search.toLowerCase()) ||
                    (task.description || '').toLowerCase().includes(search.toLowerCase()) ||
                    (task.proofLink || '').toLowerCase().includes(search.toLowerCase()) ||
                    (phase.name || '').toLowerCase().includes(search.toLowerCase()) ||
                    (getAssigneeInfo(task.assignee)?.name || '').toLowerCase().includes(search.toLowerCase());

                const matchStatus = selectedStatus === 'all' || task.status === selectedStatus;
                const matchPriority = selectedPriority === 'all' || task.priority === selectedPriority;
                const matchAssignee = selectedAssignee === 'all' || String(task.assignee) === selectedAssignee;

                return matchSearch && matchStatus && matchPriority && matchAssignee;
            });

            return {
                ...phase,
                phaseIndex: pIdx + 1,
                totalTasks,
                completedTasks,
                progressPercent,
                allTasks: tasksInPhase,
                tasks: filteredTasksInPhase,
            };
        }).filter(group => {
            if (selectedPhase !== 'all' && group.id !== selectedPhase) {
                return false;
            }
            if (search.trim() || selectedStatus !== 'all' || selectedPriority !== 'all' || selectedAssignee !== 'all') {
                const phaseMatchesSearch = search.trim() && (group.name || '').toLowerCase().includes(search.toLowerCase());
                return group.tasks.length > 0 || phaseMatchesSearch;
            }
            return true;
        });
    }, [rootPhases, childTasks, search, selectedPhase, selectedStatus, selectedPriority, selectedAssignee, eventAssignees]);

    // Orphaned tasks (if any)
    const orphanedTasks = useMemo(() => {
        const rootPhaseIds = new Set(rootPhases.map(p => p.id));
        return childTasks.filter(t => !rootPhaseIds.has(t.parentId)).filter(task => {
            const matchSearch =
                !search.trim() ||
                (task.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (task.description || '').toLowerCase().includes(search.toLowerCase()) ||
                (task.proofLink || '').toLowerCase().includes(search.toLowerCase()) ||
                (getAssigneeInfo(task.assignee)?.name || '').toLowerCase().includes(search.toLowerCase());

            const matchStatus = selectedStatus === 'all' || task.status === selectedStatus;
            const matchPriority = selectedPriority === 'all' || task.priority === selectedPriority;
            const matchAssignee = selectedAssignee === 'all' || String(task.assignee) === selectedAssignee;

            return matchSearch && matchStatus && matchPriority && matchAssignee;
        });
    }, [rootPhases, childTasks, search, selectedStatus, selectedPriority, selectedAssignee, eventAssignees]);

    // Quick Status Cycle (No permission restriction as requested)
    const handleQuickCycleStatus = (task) => {
        if (readOnly) return;
        const current = task.status || 'pending';
        const next = statusConfig[current]?.next || 'pending';
        const updated = (roadmap || []).map(n => (n.id === task.id ? {
            ...n,
            status: next,
            completedAt: next === 'completed' ? (n.completedAt || new Date()) : null,
        } : n));
        onUpdateRoadmap?.(updated);
    };

    // Fast Link / Proof Link Update Handler
    const handleUpdateProofLink = (taskId, newProofLink) => {
        const updated = (roadmap || []).map(n => n.id === taskId ? { ...n, proofLink: (newProofLink || '').trim() } : n);
        onUpdateRoadmap?.(updated);
    };

    // Open Edit Task with Permission Check
    const handleOpenEditTask = (task) => {
        if (readOnly) return;
        if (!canManageRoadmapTasks(currentUser, members, event)) {
            dialog.alert('Bạn không có quyền chỉnh sửa công việc này. Chỉ Thư ký, Quản lý và Admin mới có quyền chỉnh sửa thông tin nhiệm vụ.', { title: 'Không có quyền', type: 'warning' });
            return;
        }
        setModalState({ isOpen: true, node: task, parentId: task.parentId });
    };

    // Delete Node with Permission Check
    const handleDeleteNodeWithPermission = async (nodeId) => {
        if (readOnly) return;
        if (!canManageRoadmapTasks(currentUser, members, event)) {
            dialog.alert('Bạn không có quyền xóa mục này. Chỉ Thư ký, Quản lý và Admin mới có quyền thao tác.', { title: 'Không có quyền', type: 'warning' });
            return;
        }
        const ok = await dialog.confirm('Bạn có chắc chắn muốn xóa mục này khỏi lộ trình?', {
            title: 'Xóa mục lộ trình',
            type: 'danger',
            confirmText: 'Xóa mục',
        });
        if (!ok) return;
        const updated = (roadmap || []).filter(n => n.id !== nodeId && n.parentId !== nodeId);
        onUpdateRoadmap?.(updated);
        dialog.toast('Đã xóa mục khỏi lộ trình', 'info');
    };

    // Open Zalo Modal with Assignee Validation
    const handleOpenZaloForTask = (task) => {
        if (readOnly) return;
        if (!task.assignee) {
            dialog.alert('Công việc chưa được phân công cho ai! Vui lòng chọn người phụ trách trước khi gửi Zalo.', { title: 'Chưa phân công', type: 'warning' });
            return;
        }
        setZaloModalTask(task);
    };

    // Save Node (Phase or Task)
    const handleSaveNode = (nodeData, editingNode) => {
        if (readOnly) return;
        if (!canManageRoadmapTasks(currentUser, members, event)) {
            dialog.alert('Bạn không có quyền lưu thay đổi công việc. Chỉ Thư ký, Quản lý và Admin mới có quyền thao tác.', { title: 'Không có quyền', type: 'warning' });
            return;
        }
        let updatedRoadmap = [...roadmap];
        if (editingNode) {
            updatedRoadmap = updatedRoadmap.map(n => (n.id === editingNode.id ? {
                ...n,
                ...nodeData,
                completedAt: nodeData.status === 'completed' ? (editingNode.completedAt || new Date()) : null,
            } : n));
            if (!editingNode.parentId && nodeData.attachStations && onUpdateMultiple) {
                onUpdateMultiple({ stationPhaseId: editingNode.id });
            }
            dialog.toast('Đã cập nhật công việc', 'success');
        } else {
            const newNodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const newNode = {
                id: newNodeId,
                ...nodeData,
                completedAt: nodeData.status === 'completed' ? new Date() : null,
                order: nodeData.parentId ? childTasks.filter(t => t.parentId === nodeData.parentId).length + 1 : rootPhases.length + 1,
                comments: [],
            };
            updatedRoadmap.push(newNode);
            if (!nodeData.parentId && nodeData.attachStations && onUpdateMultiple) {
                onUpdateMultiple({ stationPhaseId: newNodeId });
            }
            dialog.toast('Đã thêm công việc mới', 'success');
        }
        onUpdateRoadmap?.(updatedRoadmap);
    };

    const handleAddComment = (taskId, text) => {
        if (!text.trim()) return;
        const authorName = currentUser?.name || 'Thành viên';
        const updated = (roadmap || []).map(t => {
            if (t.id === taskId) {
                return { ...t, comments: [...(t.comments || []), { text: text.trim(), date: new Date(), author: authorName }] };
            }
            return t;
        });
        onUpdateRoadmap?.(updated);
    };

    const handleSendZaloSuccess = (taskId) => {
        const updated = (roadmap || []).map(t => (t.id === taskId ? { ...t, lastZaloSentAt: new Date() } : t));
        onUpdateRoadmap?.(updated);
        setZaloModalTask(null);
    };

    // Export CSV
    const handleExportCSV = () => {
        if (rootPhases.length === 0 && childTasks.length === 0) return;
        const headers = ['Mã', 'Giai đoạn', 'Tên công việc', 'Người phụ trách', 'Độ ưu tiên', 'Ngày bắt đầu', 'Hạn chót', 'Trạng thái', 'Mô tả'];
        const rows = [];
        rootPhases.forEach((phase, pIdx) => {
            const tasksInPhase = childTasks.filter(t => t.parentId === phase.id);
            tasksInPhase.forEach((t, tIdx) => {
                rows.push([
                    `"${pIdx + 1}.${tIdx + 1}"`,
                    `"${(phase.name || '').replace(/"/g, '""')}"`,
                    `"${(t.name || '').replace(/"/g, '""')}"`,
                    `"${(getAssigneeInfo(t.assignee)?.name || 'Chưa gán').replace(/"/g, '""')}"`,
                    `"${priorityConfig[t.priority]?.label || t.priority || 'Trung bình'}"`,
                    `"${t.startDate ? formatDate(t.startDate) : ''}"`,
                    `"${t.dueDate ? formatDate(t.dueDate) : ''}"`,
                    `"${statusConfig[t.status]?.label || t.status || 'Chưa làm'}"`,
                    `"${(t.description || '').replace(/"/g, '""')}"`,
                ]);
            });
        });

        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const link = document.createElement('a');
        link.href = encodeURI(csvContent);
        link.download = `Bang_Lo_Trinh_Cong_Viec_${event?.title || 'Event'}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalColumns = readOnly ? 6 : 7;
    const isFiltered = Boolean(search.trim() || selectedPhase !== 'all' || selectedStatus !== 'all' || selectedPriority !== 'all' || selectedAssignee !== 'all');

    return (
        <div className="flex flex-col gap-6">
            {/* 1-Row View Mode & Actions Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-primary)] p-3 sm:p-3.5 rounded-2xl border border-[var(--border-color)] shadow-xs">
                <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)] self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setRoadmapMode?.('tree')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                            roadmapMode === 'tree' ? 'bg-blue-600 text-white shadow-xs' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <IconTree className="w-3.5 h-3.5" />
                        <span>Sơ đồ Cây</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRoadmapMode?.('gantt')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                            roadmapMode === 'gantt' ? 'bg-blue-600 text-white shadow-xs' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <IconGantt className="w-3.5 h-3.5" />
                        <span>Tiến độ Gantt</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRoadmapMode?.('table')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                            roadmapMode === 'table' ? 'bg-blue-600 text-white shadow-xs' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <IconTable className="w-3.5 h-3.5" />
                        <span>Dạng Bảng</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                    <button
                        type="button"
                        onClick={handleExportCSV}
                        disabled={rootPhases.length === 0 && childTasks.length === 0}
                        title="Xuất bảng công việc CSV"
                        className="px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                    >
                        <IconDownload className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                        <span>Xuất CSV</span>
                    </button>

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

            {/* Filters Bar */}
            <div className="bg-[var(--bg-primary)] p-3 sm:p-3.5 rounded-2xl border border-[var(--border-color)] shadow-xs flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md bg-[var(--bg-secondary)] px-3 py-1.5 rounded-xl border border-[var(--border-color)]">
                    <IconSearch className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm công việc, giai đoạn, người phụ trách..."
                        className="w-full bg-transparent border-none text-[var(--text-primary)] text-xs sm:text-sm focus:outline-none placeholder:text-[var(--text-secondary)]"
                    />
                    {search && (
                        <button type="button" onClick={() => setSearch('')} className="text-xs text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer p-0.5">
                            <IconClose className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <select
                    value={selectedPhase}
                    onChange={(e) => setSelectedPhase(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[200px]"
                >
                    <option value="all">Tất cả giai đoạn ({rootPhases.length})</option>
                    {rootPhases.map((p, idx) => (
                        <option key={p.id} value={p.id}>{idx + 1}. {p.name}</option>
                    ))}
                </select>

                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chưa làm</option>
                    <option value="in_progress">Đang làm</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="overdue">Trễ hạn</option>
                    <option value="blocked">Vướng mắc</option>
                </select>

                <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                    <option value="all">Tất cả mức độ ưu tiên</option>
                    <option value="urgent">Khẩn cấp</option>
                    <option value="high">Cao</option>
                    <option value="medium">Trung bình</option>
                    <option value="low">Thấp</option>
                </select>

                <select
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[180px]"
                >
                    <option value="all">Tất cả người phụ trách</option>
                    {eventAssignees.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                </select>
            </div>

            {/* Table with Phase Separator Rows */}
            <div className="w-full bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xs">
                <div className="w-full overflow-x-auto scrollbar-thin">
                    <table className="w-full text-xs sm:text-sm text-left border-collapse min-w-[850px]">
                        <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-[var(--text-secondary)] select-none">
                            <tr>
                                <th className="py-3 px-4 font-bold text-xs sm:text-sm text-center w-16">#</th>
                                <th className="py-3 px-4 font-bold text-xs sm:text-sm text-left">Tên Công việc / Nhiệm vụ</th>
                                <th className="py-3 px-4 font-bold text-xs sm:text-sm text-left w-44">Người phụ trách</th>
                                <th className="py-3 px-4 font-bold text-xs sm:text-sm text-center w-28">Ưu tiên</th>
                                <th className="py-3 px-4 font-bold text-xs sm:text-sm text-center w-36">Thời hạn</th>
                                <th className="py-3 px-4 font-bold text-xs sm:text-sm text-center w-36">Trạng thái</th>
                                {!readOnly && (
                                    <th className="py-3 px-4 font-bold text-xs sm:text-sm text-center w-20">Thao tác</th>
                                )}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[var(--border-color)]">
                            {rootPhases.length === 0 && childTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={totalColumns} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                <IconTable className="w-7 h-7" />
                                            </div>
                                            <h4 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                                                Chưa có công việc nào trong lộ trình
                                            </h4>
                                            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md">
                                                Hãy tạo các giai đoạn và phân chia nhiệm vụ chi tiết để theo dõi tiến độ sự kiện.
                                            </p>
                                            {!readOnly && (
                                                <div className="flex items-center gap-2 flex-wrap justify-center mt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setModalState({ isOpen: true, node: null, parentId: null })}
                                                        className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-xl text-xs sm:text-sm font-semibold border border-[var(--border-color)] cursor-pointer"
                                                    >
                                                        + Thêm Giai đoạn
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : groupedPhases.length === 0 && orphanedTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={totalColumns} className="p-12 text-center text-xs sm:text-sm text-[var(--text-secondary)]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <p className="font-semibold text-sm text-[var(--text-primary)]">Không tìm thấy công việc phù hợp</p>
                                            <p>Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearch('');
                                                    setSelectedPhase('all');
                                                    setSelectedStatus('all');
                                                    setSelectedPriority('all');
                                                    setSelectedAssignee('all');
                                                }}
                                                className="mt-2 text-xs font-semibold text-blue-600 hover:underline cursor-pointer bg-transparent border-none"
                                            >
                                                Xóa tất cả bộ lọc
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {groupedPhases.map((phase) => {
                                        const palette = phaseColorPalette[(phase.phaseIndex - 1) % phaseColorPalette.length] || phaseColorPalette[0];
                                        return (
                                            <React.Fragment key={`group-phase-${phase.id}`}>
                                                {/* Phase Separator Row */}
                                                <tr className={`bg-[var(--bg-secondary)]/80 border-t-2 border-b border-[var(--border-color)] select-none ${palette.border}`}>
                                                    <td colSpan={totalColumns} className="px-4 py-3 sm:py-3.5">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                                            {/* Left: Phase Title, Badge & Dates */}
                                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs ${palette.badge}`}>
                                                                    Giai đoạn {phase.phaseIndex}
                                                                </span>
                                                                <span className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
                                                                    {phase.name}
                                                                </span>
                                                                {(phase.startDate || phase.dueDate) && (
                                                                    <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] font-medium bg-[var(--bg-primary)] px-2 py-0.5 rounded-md border border-[var(--border-color)]">
                                                                        <IconCalendar className="w-3 h-3 text-[var(--text-secondary)]" />
                                                                        <span>
                                                                            {phase.startDate ? formatDate(phase.startDate) : ''}
                                                                            {phase.startDate && phase.dueDate ? ' → ' : ''}
                                                                            {phase.dueDate ? formatDate(phase.dueDate) : ''}
                                                                        </span>
                                                                    </span>
                                                                )}
                                                                {(event?.stationPhaseId === phase.id || phase.attachStations) && stations.length > 0 && (
                                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 px-2 py-0.5 rounded-md">
                                                                        <IconTable className="w-3 h-3" />
                                                                        <span>{stations.length} Phân khu</span>
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Right: Progress stats & Phase Action Buttons */}
                                                            <div className="flex items-center gap-3 flex-wrap self-end sm:self-auto">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-semibold text-[var(--text-secondary)] whitespace-nowrap">
                                                                        {phase.completedTasks}/{phase.totalTasks} việc ({phase.progressPercent}%)
                                                                    </span>
                                                                    <div className="w-16 sm:w-20 h-2 rounded-full bg-[var(--border-color)] overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                                                            style={{ width: `${phase.progressPercent}%` }}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {!readOnly && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setModalState({ isOpen: true, node: null, parentId: phase.id })}
                                                                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 border-none cursor-pointer shadow-2xs transition-all"
                                                                            title="Thêm công việc vào giai đoạn này"
                                                                        >
                                                                            <IconPlus className="w-3 h-3" />
                                                                            <span>Thêm việc</span>
                                                                        </button>

                                                                        <ActionMenu
                                                                            items={[
                                                                                {
                                                                                    label: 'Chỉnh sửa Giai đoạn',
                                                                                    icon: IconEdit,
                                                                                    onClick: () => setModalState({ isOpen: true, node: phase, parentId: null }),
                                                                                },
                                                                                {
                                                                                    label: 'Thêm công việc',
                                                                                    icon: IconPlus,
                                                                                    onClick: () => setModalState({ isOpen: true, node: null, parentId: phase.id }),
                                                                                },
                                                                                { divider: true },
                                                                                {
                                                                                    label: 'Xóa Giai đoạn',
                                                                                    icon: IconTrash,
                                                                                    danger: true,
                                                                                    onClick: () => handleDeleteNode(phase.id),
                                                                                },
                                                                            ]}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Task Rows inside Phase */}
                                                {phase.tasks.length === 0 ? (
                                                    <tr className="bg-[var(--bg-primary)]">
                                                        <td colSpan={totalColumns} className="py-4 px-6 text-center text-xs text-[var(--text-secondary)] italic">
                                                            <span>Chưa có công việc nào trong giai đoạn này.</span>
                                                            {!readOnly && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setModalState({ isOpen: true, node: null, parentId: phase.id })}
                                                                    className="ml-2 font-semibold text-blue-600 hover:underline cursor-pointer bg-transparent border-none"
                                                                >
                                                                    + Thêm công việc ngay
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    phase.tasks.map((task, tIdx) => {
                                                        const commentCount = (task.comments || []).length;
                                                        const info = getAssigneeInfo(task.assignee);
                                                        const prio = priorityConfig[task.priority] || priorityConfig.medium;
                                                        const st = statusConfig[task.status] || statusConfig.pending;
                                                        const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now() && task.status !== 'completed';
                                                        const badgeClasses = "px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] inline-flex items-center gap-1.5 transition-colors shadow-2xs";

                                                        return (
                                                            <tr
                                                                key={task.id}
                                                                className="hover:bg-[var(--bg-secondary)]/40 transition-colors bg-[var(--bg-primary)]"
                                                            >
                                                                {/* 1. # */}
                                                                <td className="py-3 px-4 text-center">
                                                                    <span className="font-mono text-xs text-[var(--text-secondary)] font-medium">
                                                                        {phase.phaseIndex}.{tIdx + 1}
                                                                    </span>
                                                                </td>

                                                                {/* 2. Tên Công việc / Nhiệm vụ */}
                                                                <td className="py-3 px-4">
                                                                    <div className="flex flex-col gap-1">
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className={`font-semibold text-xs sm:text-sm ${task.status === 'completed' ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                                                                                {task.name}
                                                                            </span>

                                                                            {/* Nút Bình luận có viền và nền đồng bộ */}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setCommentsModalTask(task)}
                                                                                className={`px-2 py-0.5 rounded-lg border border-[var(--border-color)] text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs ${
                                                                                    commentCount > 0
                                                                                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold'
                                                                                        : 'bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                                                                }`}
                                                                                title={commentCount > 0 ? `Có ${commentCount} nhận xét` : 'Thêm nhận xét'}
                                                                            >
                                                                                <IconChatBubble className="w-3 h-3" />
                                                                                {commentCount > 0 && <span>{commentCount}</span>}
                                                                            </button>

                                                                            {/* Nút Gửi Zalo rút gọn thành icon Send */}
                                                                            {!readOnly && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleOpenZaloForTask(task)}
                                                                                    className="w-6 h-6 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center cursor-pointer transition-colors shadow-2xs shrink-0"
                                                                                    title={task.assignee ? `Gửi Zalo cho người phụ trách (${info?.name || 'Thành viên'})` : 'Gửi Zalo (Chưa gán người làm)'}
                                                                                >
                                                                                    <IconSend className="w-3 h-3" />
                                                                                </button>
                                                                            )}

                                                                            {task.lastZaloSentAt && (
                                                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900" title="Đã gửi thông báo Zalo">
                                                                                    <IconMessageSquare className="w-2.5 h-2.5" />
                                                                                    <span>Đã gửi</span>
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {task.description && (
                                                                            <span className="text-xs text-[var(--text-secondary)] line-clamp-1">{task.description}</span>
                                                                        )}

                                                                        {/* Minh chứng (Proof Link) */}
                                                                        <TaskProofLink
                                                                            task={task}
                                                                            currentUser={currentUser}
                                                                            members={members}
                                                                            event={event}
                                                                            readOnly={readOnly}
                                                                            onUpdateProofLink={handleUpdateProofLink}
                                                                        />
                                                                    </div>
                                                                </td>

                                                                {/* 3. Người phụ trách */}
                                                                <td className="py-3 px-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                                                                            {info?.name ? info.name.charAt(0).toUpperCase() : '?'}
                                                                        </div>
                                                                        <span className={`text-xs font-medium truncate max-w-[130px] ${info?.name ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] italic'}`} title={info?.name || 'Chưa gán'}>
                                                                            {info?.name || 'Chưa gán'}
                                                                        </span>
                                                                    </div>
                                                                </td>

                                                                {/* 4. Độ ưu tiên */}
                                                                <td className="py-3 px-4 text-center">
                                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${prio.textColor}`}>
                                                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${prio.dot}`} />
                                                                        <span>{prio.label}</span>
                                                                    </span>
                                                                </td>

                                                                {/* 5. Thời hạn */}
                                                                <td className="py-3 px-4 text-center">
                                                                    {task.dueDate ? (
                                                                        <div className="flex flex-col items-center">
                                                                            <span className={`text-xs ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-[var(--text-primary)]'}`}>
                                                                                {formatDate(task.dueDate)}
                                                                            </span>
                                                                            {isOverdue && <span className="text-[10px] text-rose-500 font-medium">Quá hạn</span>}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-xs text-[var(--text-secondary)] italic">Chưa đặt</span>
                                                                    )}
                                                                </td>

                                                                {/* 6. Trạng thái */}
                                                                <td className="py-3 px-4 text-center">
                                                                    {readOnly ? (
                                                                        <span className={badgeClasses}>
                                                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                                                                            <span>{st.label}</span>
                                                                        </span>
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleQuickCycleStatus(task)}
                                                                            className={`${badgeClasses} cursor-pointer hover:bg-[var(--bg-secondary)] hover:border-gray-400`}
                                                                            title="Bấm để chuyển nhanh trạng thái tiếp theo"
                                                                        >
                                                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                                                                            <span>{st.label}</span>
                                                                        </button>
                                                                    )}
                                                                </td>

                                                                {/* 7. Thao tác */}
                                                                {!readOnly && (
                                                                    <td className="py-3 px-4 text-center">
                                                                        <ActionMenu
                                                                            items={[
                                                                                { label: 'Chỉnh sửa', icon: IconEdit, onClick: () => handleOpenEditTask(task) },
                                                                                { label: 'Gửi Zalo nhắc việc', icon: IconMessageSquare, onClick: () => handleOpenZaloForTask(task) },
                                                                                { label: 'Bình luận / Ghi chú', icon: IconChatBubble, onClick: () => setCommentsModalTask(task) },
                                                                                { divider: true },
                                                                                { label: 'Xóa công việc', icon: IconTrash, danger: true, onClick: () => handleDeleteTaskWithPermission(task.id) },
                                                                            ]}
                                                                        />
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </React.Fragment>
                                        );
                                    })}

                                    {/* Orphaned tasks (if any) */}
                                    {orphanedTasks.length > 0 && (
                                        <React.Fragment key="group-phase-orphaned">
                                            <tr className="bg-[var(--bg-secondary)]/80 border-t-2 border-b border-[var(--border-color)] border-l-4 border-l-gray-400">
                                                <td colSpan={totalColumns} className="px-4 py-3 sm:py-3.5">
                                                    <span className="font-bold text-sm text-[var(--text-primary)]">
                                                        Nhiệm vụ chung / Khác
                                                    </span>
                                                </td>
                                            </tr>
                                            {orphanedTasks.map((task, tIdx) => {
                                                const commentCount = (task.comments || []).length;
                                                const info = getAssigneeInfo(task.assignee);
                                                const prio = priorityConfig[task.priority] || priorityConfig.medium;
                                                const st = statusConfig[task.status] || statusConfig.pending;
                                                const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now() && task.status !== 'completed';
                                                const badgeClasses = "px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] inline-flex items-center gap-1.5 transition-colors shadow-2xs";

                                                return (
                                                    <tr key={task.id} className="hover:bg-[var(--bg-secondary)]/40 transition-colors bg-[var(--bg-primary)]">
                                                        <td className="py-3 px-4 text-center">
                                                            <span className="font-mono text-xs text-[var(--text-secondary)] font-medium">
                                                                0.{tIdx + 1}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-semibold text-xs sm:text-sm text-[var(--text-primary)]">{task.name}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setCommentsModalTask(task)}
                                                                        className={`px-2 py-0.5 rounded-lg border border-[var(--border-color)] text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs ${
                                                                            commentCount > 0
                                                                                ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold'
                                                                                : 'bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                                                        }`}
                                                                        title={commentCount > 0 ? `Có ${commentCount} nhận xét` : 'Thêm nhận xét'}
                                                                    >
                                                                        <IconChatBubble className="w-3 h-3" />
                                                                        {commentCount > 0 && <span>{commentCount}</span>}
                                                                    </button>

                                                                    {!readOnly && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleOpenZaloForTask(task)}
                                                                            className="w-6 h-6 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center cursor-pointer transition-colors shadow-2xs shrink-0"
                                                                            title={task.assignee ? `Gửi Zalo cho người phụ trách (${info?.name || 'Thành viên'})` : 'Gửi Zalo (Chưa gán người làm)'}
                                                                        >
                                                                            <IconSend className="w-3 h-3" />
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {task.description && (
                                                                    <span className="text-xs text-[var(--text-secondary)] line-clamp-1">{task.description}</span>
                                                                )}

                                                                {/* Minh chứng (Proof Link) */}
                                                                <TaskProofLink
                                                                    task={task}
                                                                    currentUser={currentUser}
                                                                    members={members}
                                                                    event={event}
                                                                    readOnly={readOnly}
                                                                    onUpdateProofLink={handleUpdateProofLink}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                                                                    {info?.name ? info.name.charAt(0).toUpperCase() : '?'}
                                                                </div>
                                                                <span className={`text-xs font-medium truncate max-w-[130px] ${info?.name ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] italic'}`}>
                                                                    {info?.name || 'Chưa gán'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${prio.textColor}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${prio.dot}`} />
                                                                <span>{prio.label}</span>
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            {task.dueDate ? (
                                                                <div className="flex flex-col items-center">
                                                                    <span className={`text-xs ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-[var(--text-primary)]'}`}>
                                                                        {formatDate(task.dueDate)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-[var(--text-secondary)] italic">Chưa đặt</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            {readOnly ? (
                                                                <span className={badgeClasses}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                                                                    <span>{st.label}</span>
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleQuickCycleStatus(task)}
                                                                    className={`${badgeClasses} cursor-pointer hover:bg-[var(--bg-secondary)] hover:border-gray-400`}
                                                                >
                                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                                                                    <span>{st.label}</span>
                                                                </button>
                                                            )}
                                                        </td>
                                                        {!readOnly && (
                                                            <td className="py-3 px-4 text-center">
                                                                <ActionMenu
                                                                    items={[
                                                                        { label: 'Chỉnh sửa', icon: IconEdit, onClick: () => handleOpenEditTask(task) },
                                                                        { label: 'Gửi Zalo nhắc việc', icon: IconMessageSquare, onClick: () => handleOpenZaloForTask(task) },
                                                                        { label: 'Bình luận / Ghi chú', icon: IconChatBubble, onClick: () => setCommentsModalTask(task) },
                                                                        { divider: true },
                                                                        { label: 'Xóa công việc', icon: IconTrash, danger: true, onClick: () => handleDeleteTaskWithPermission(task.id) },
                                                                    ]}
                                                                />
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    )}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Add / Edit Phase or Task */}
            <AddEditRoadmapModal
                isOpen={modalState.isOpen}
                node={modalState.node}
                parentId={modalState.parentId}
                rootPhases={rootPhases}
                childTasks={childTasks}
                eventAssignees={eventAssignees}
                stations={stations}
                onClose={() => setModalState({ isOpen: false, node: null, parentId: null })}
                onSave={handleSaveNode}
            />

            {/* Modal: Task Comments */}
            <TaskCommentsModal
                isOpen={!!commentsModalTask}
                task={commentsModalTask}
                onClose={() => setCommentsModalTask(null)}
                onAddComment={handleAddComment}
                readOnly={readOnly}
            />

            {/* Modal: Send Zalo Task Message */}
            <SendTaskZaloModal
                isOpen={!!zaloModalTask}
                task={zaloModalTask}
                event={event}
                users={users}
                members={members}
                onClose={() => setZaloModalTask(null)}
                onSendSuccess={handleSendZaloSuccess}
            />
        </div>
    );
}
