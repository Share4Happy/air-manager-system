'use client';
import React, { useState, useEffect, useMemo } from 'react';
import AddEditStationModal from '../stations/AddEditStationModal';
import TaskCommentsModal from './modals/TaskCommentsModal';
import SendTaskZaloModal from './modals/SendTaskZaloModal';
import TreeToolbar from './tree/TreeToolbar';
import TreePhaseCard from './tree/TreePhaseCard';
import TreeScenarioMatrixBranch from './tree/TreeScenarioMatrixBranch';
import AddEditNodeModal from './tree/AddEditNodeModal';
import PhotoLightboxModal from './tree/PhotoLightboxModal';
import { statusConfig, priorityConfig, phaseColorPalette } from './tree/treeConstants';
import { IconLayers, IconPlus, IconTable } from '@/app/events/ui/icons';
import { canManageRoadmapTasks, canEditTaskProofLink } from './roadmapPermissions';
import { useEventDialog, buildEventAssigneesList, resolveAssigneeInfo } from '@/app/events/ui/common';

export default function RoadmapTreeView({
    roadmap = [],
    stations = [],
    onUpdateRoadmap,
    onUpdateStations,
    onUpdateMultiple,
    currentUser = null,
    users = [],
    members = [],
    event = {},
    roadmapMode = 'tree',
    setRoadmapMode,
    readOnly = false,
    highlightTaskId = null,
    onClearHighlight = null,
}) {
    const dialog = useEventDialog();
    const [collapsedPhases, setCollapsedPhases] = useState({});
    const [stationPhaseId, setStationPhaseId] = useState(event?.stationPhaseId ?? 'auto');
    const [editingNode, setEditingNode] = useState(null);
    const [addingParentId, setAddingParentId] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [commentsModalTask, setCommentsModalTask] = useState(null);
    const [zaloModalTask, setZaloModalTask] = useState(null);
    const [previewPhoto, setPreviewPhoto] = useState(null);
    const [currentPhaseId, setCurrentPhaseId] = useState(event?.currentPhaseId || null);
    const [highlightedTaskId, setHighlightedTaskId] = useState(null);
    const [isStationModalOpen, setIsStationModalOpen] = useState(false);
    const [editingStation, setEditingStation] = useState(null);

    // Form state for Add/Edit
    const [nodeForm, setNodeForm] = useState({
        name: '',
        description: '',
        proofLink: '',
        assignee: '',
        dueDate: '',
        priority: 'medium',
        status: 'pending',
        attachStations: false,
    });

    // React to highlightTaskId prop when switching tabs or passed from parent
    useEffect(() => {
        if (!highlightTaskId) return;

        const targetTask = Array.isArray(roadmap) ? roadmap.find(n => String(n.id) === String(highlightTaskId)) : null;
        if (targetTask && targetTask.parentId) {
            setCollapsedPhases(prev => {
                if (prev[targetTask.parentId]) {
                    const next = { ...prev };
                    delete next[targetTask.parentId];
                    return next;
                }
                return prev;
            });
        }

        setHighlightedTaskId(String(highlightTaskId));

        let attempts = 0;
        const tryScroll = () => {
            const el = document.getElementById(`roadmap-task-${highlightTaskId}`) || document.getElementById(`roadmap-phase-${highlightTaskId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (attempts < 10) {
                attempts++;
                setTimeout(tryScroll, 100);
            }
        };
        setTimeout(tryScroll, 80);

        const timer = setTimeout(() => {
            setHighlightedTaskId(null);
            onClearHighlight?.();
        }, 3500);

        return () => clearTimeout(timer);
    }, [highlightTaskId, roadmap, onClearHighlight]);

    // Listen to task highlight events from chat task clicks when already mounted
    useEffect(() => {
        const handleHighlightTask = (e) => {
            const taskId = e.detail?.taskId;
            if (!taskId) return;

            const targetTask = Array.isArray(roadmap) ? roadmap.find(n => String(n.id) === String(taskId)) : null;
            if (targetTask && targetTask.parentId) {
                setCollapsedPhases(prev => {
                    if (prev[targetTask.parentId]) {
                        const next = { ...prev };
                        delete next[targetTask.parentId];
                        return next;
                    }
                    return prev;
                });
            }

            setHighlightedTaskId(String(taskId));

            let attempts = 0;
            const tryScroll = () => {
                const el = document.getElementById(`roadmap-task-${taskId}`) || document.getElementById(`roadmap-phase-${taskId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else if (attempts < 8) {
                    attempts++;
                    setTimeout(tryScroll, 100);
                }
            };
            setTimeout(tryScroll, 50);

            const timer = setTimeout(() => {
                setHighlightedTaskId(null);
            }, 3500);

            return () => clearTimeout(timer);
        };

        window.addEventListener('air_highlight_roadmap_task', handleHighlightTask);
        return () => window.removeEventListener('air_highlight_roadmap_task', handleHighlightTask);
    }, [roadmap]);

    const toggleMenu = (e, menuId) => {
        e.stopPropagation();
        setActiveMenuId(prev => prev === menuId ? null : menuId);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('[data-dropdown-menu]')) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Sync stationPhaseId & currentPhaseId if event props change
    useEffect(() => {
        if (event?.stationPhaseId !== undefined) {
            setStationPhaseId(event.stationPhaseId ?? 'auto');
        }
        if (event?.currentPhaseId !== undefined) {
            setCurrentPhaseId(event.currentPhaseId || null);
        }
    }, [event?.stationPhaseId, event?.currentPhaseId]);

    // Available Assignees: only people listed in event members (or event lead)
    const eventAssignees = useMemo(() => {
        return buildEventAssigneesList(members, users);
    }, [members, users]);

    // Helper to resolve any assignee
    const getAssigneeInfo = (assigneeId) => {
        return resolveAssigneeInfo(assigneeId, members, users);
    };


    // Separate Root Phases and Child Tasks
    const rootPhases = useMemo(() => roadmap.filter(node => !node.parentId), [roadmap]);
    const getChildrenOf = (phaseId) => roadmap.filter(node => node.parentId === phaseId);

    // Compute active phase
    const resolvedCurrentPhaseId = useMemo(() => {
        if (currentPhaseId && rootPhases.some(p => p.id === currentPhaseId)) {
            return currentPhaseId;
        }
        for (const phase of rootPhases) {
            const childTasks = getChildrenOf(phase.id);
            if (childTasks.some(t => t.status === 'in_progress')) {
                return phase.id;
            }
        }
        const firstUnfinished = rootPhases.find(p => {
            const childTasks = getChildrenOf(p.id);
            return childTasks.length === 0 || childTasks.some(t => t.status !== 'completed');
        });
        if (firstUnfinished) return firstUnfinished.id;

        return rootPhases[0]?.id || null;
    }, [currentPhaseId, rootPhases, roadmap]);

    const handleSetCurrentPhase = (phaseId) => {
        const nextPhaseId = currentPhaseId === phaseId ? null : phaseId;
        setCurrentPhaseId(nextPhaseId);
        onUpdateMultiple?.({ currentPhaseId: nextPhaseId });
    };

    // Task Approval Toggle
    const handleToggleApprove = (nodeId, shouldApprove) => {
        const updatedRoadmap = roadmap.map(node => {
            if (node.id === nodeId) {
                return {
                    ...node,
                    isApproved: shouldApprove,
                    approvedBy: shouldApprove ? 'Ban tổ chức' : '',
                    approvedAt: shouldApprove ? new Date() : null,
                    status: (shouldApprove && node.status === 'pending') ? 'completed' : node.status,
                    completedAt: (shouldApprove && node.status === 'pending') ? new Date() : node.completedAt,
                };
            }
            return node;
        });
        onUpdateRoadmap(updatedRoadmap);
    };

    // Task Comments Handler
    const handleAddComment = (nodeId, content) => {
        const newComment = {
            id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            author: 'Ban tổ chức',
            authorRole: 'Quản trị',
            content,
            createdAt: new Date(),
        };

        const updatedRoadmap = roadmap.map(node => {
            if (node.id === nodeId) {
                const existing = node.comments || [];
                const updatedComments = [...existing, newComment];
                const updatedNode = {
                    ...node,
                    comments: updatedComments,
                };
                if (commentsModalTask && commentsModalTask.id === nodeId) {
                    setCommentsModalTask(updatedNode);
                }
                return updatedNode;
            }
            return node;
        });

        onUpdateRoadmap(updatedRoadmap);
    };

    const handleSendZaloSuccess = (newHistory) => {
        if (newHistory && onUpdateMultiple) {
            onUpdateMultiple({ 'zaloConfig.history': newHistory });
        }
    };

    // Compute which phase holds scenario matrix
    const resolvedStationPhaseId = useMemo(() => {
        if (stationPhaseId === 'none') return null;
        if (stationPhaseId === 'standalone') return 'standalone';
        if (stationPhaseId && stationPhaseId !== 'auto') {
            const exists = rootPhases.some(p => p.id === stationPhaseId);
            if (exists) return stationPhaseId;
        }

        if (rootPhases.length === 0) return 'standalone';

        const keywordPhase = rootPhases.find(p => {
            const nameLower = (p.name || '').toLowerCase();
            return nameLower.includes('d-day') ||
                nameLower.includes('ngày hội') ||
                nameLower.includes('thực hiện') ||
                nameLower.includes('trải nghiệm') ||
                nameLower.includes('diễn ra');
        });
        if (keywordPhase) return keywordPhase.id;

        if (rootPhases.length >= 2) return rootPhases[1].id;
        return rootPhases[0].id;
    }, [stationPhaseId, rootPhases]);

    const handleSelectStationPhase = (newPhaseId) => {
        setStationPhaseId(newPhaseId);
        if (onUpdateMultiple) {
            onUpdateMultiple({ stationPhaseId: newPhaseId });
        }
    };

    const handleQuickAssign = (nodeId, newAssigneeId) => {
        if (!canManageRoadmapTasks(currentUser, members, event)) {
            dialog.alert('Bạn không có quyền phân công lại công việc. Chỉ Thư ký, Quản lý và Admin mới có quyền thao tác.', { title: 'Không có quyền', type: 'warning' });
            return;
        }
        const updatedRoadmap = roadmap.map(node => {
            if (node.id === nodeId) {
                return {
                    ...node,
                    assignee: newAssigneeId || null,
                };
            }
            return node;
        });
        onUpdateRoadmap(updatedRoadmap);
        dialog.toast('Đã cập nhật người phụ trách', 'success');
    };

    const handleAdvanceStatus = (nodeId, currentStatus) => {
        const nextStatus = statusConfig[currentStatus]?.next || 'in_progress';
        const updatedRoadmap = roadmap.map(node => {
            if (node.id === nodeId) {
                return {
                    ...node,
                    status: nextStatus,
                    completedAt: nextStatus === 'completed' ? new Date() : null,
                };
            }
            return node;
        });
        onUpdateRoadmap(updatedRoadmap);
    };

    // Fast Link / Proof Link Update Handler
    const handleUpdateProofLink = (taskId, newProofLink) => {
        const updated = (roadmap || []).map(n => n.id === taskId ? { ...n, proofLink: (newProofLink || '').trim() } : n);
        onUpdateRoadmap?.(updated);
    };

    const handleOpenAddPhase = () => {
        if (!canManageRoadmapTasks(currentUser, members, event)) {
            dialog.alert('Bạn không có quyền thêm giai đoạn mới. Chỉ Thư ký, Quản lý và Admin mới có quyền thao tác.', { title: 'Không có quyền', type: 'warning' });
            return;
        }
        setAddingParentId(null);
        setNodeForm({
            name: '',
            description: '',
            proofLink: '',
            assignee: '',
            dueDate: '',
            priority: 'medium',
            status: 'pending',
            attachStations: stations.length > 0 && rootPhases.length === 0,
        });
        setIsAddModalOpen(true);
    };

    const handleOpenAddSubTask = (phaseId) => {
        if (!canManageRoadmapTasks(currentUser, members, event)) {
            dialog.alert('Bạn không có quyền thêm công việc mới. Chỉ Thư ký, Quản lý và Admin mới có quyền thao tác.', { title: 'Không có quyền', type: 'warning' });
            return;
        }
        setAddingParentId(phaseId);
        setNodeForm({
            name: '',
            description: '',
            proofLink: '',
            assignee: '',
            dueDate: '',
            priority: 'medium',
            status: 'pending',
            attachStations: false,
        });
        setIsAddModalOpen(true);
    };

    const handleOpenEdit = (node) => {
        if (!canManageRoadmapTasks(currentUser, members, event)) {
            dialog.alert('Bạn không có quyền chỉnh sửa mục này. Chỉ Thư ký, Quản lý và Admin mới có quyền thao tác.', { title: 'Không có quyền', type: 'warning' });
            return;
        }
        setEditingNode(node);
        setNodeForm({
            name: node.name || '',
            description: node.description || '',
            proofLink: node.proofLink || '',
            assignee: node.assignee?._id || node.assignee?.id || node.assignee || '',
            dueDate: node.dueDate ? new Date(node.dueDate).toISOString().slice(0, 10) : '',
            priority: node.priority || 'medium',
            status: node.status || 'pending',
            attachStations: resolvedStationPhaseId === node.id,
        });
    };

    const handleSaveAdd = (e) => {
        e.preventDefault();
        if (!nodeForm.name.trim()) return;
        if (!canManageRoadmapTasks(currentUser, members, event)) {
            dialog.alert('Bạn không có quyền lưu thay đổi. Chỉ Thư ký, Quản lý và Admin mới có quyền thao tác.', { title: 'Không có quyền', type: 'warning' });
            return;
        }

        const newNodeId = `node-${Date.now()}`;
        const newNode = {
            id: newNodeId,
            parentId: addingParentId,
            name: nodeForm.name.trim(),
            description: nodeForm.description.trim(),
            proofLink: nodeForm.proofLink ? nodeForm.proofLink.trim() : '',
            assignee: nodeForm.assignee || null,
            dueDate: nodeForm.dueDate ? new Date(nodeForm.dueDate) : null,
            priority: nodeForm.priority || 'medium',
            status: nodeForm.status || 'pending',
            order: roadmap.length + 1,
        };

        onUpdateRoadmap([...roadmap, newNode]);

        if (!addingParentId && nodeForm.attachStations) {
            handleSelectStationPhase(newNodeId);
        }

        setIsAddModalOpen(false);
        dialog.toast(addingParentId ? 'Đã thêm công việc mới' : 'Đã thêm giai đoạn mới', 'success');
    };

    const handleSaveEdit = (e) => {
        e.preventDefault();
        if (!editingNode || !nodeForm.name.trim()) return;
        if (!canManageRoadmapTasks(currentUser, members, event)) {
            dialog.alert('Bạn không có quyền lưu thay đổi. Chỉ Thư ký, Quản lý và Admin mới có quyền thao tác.', { title: 'Không có quyền', type: 'warning' });
            return;
        }

        const updatedRoadmap = roadmap.map(node => {
            if (node.id === editingNode.id) {
                return {
                    ...node,
                    name: nodeForm.name.trim(),
                    description: nodeForm.description.trim(),
                    proofLink: nodeForm.proofLink ? nodeForm.proofLink.trim() : '',
                    assignee: nodeForm.assignee || null,
                    dueDate: nodeForm.dueDate ? new Date(nodeForm.dueDate) : null,
                    priority: nodeForm.priority,
                    status: nodeForm.status,
                    completedAt: nodeForm.status === 'completed' ? (node.completedAt || new Date()) : null,
                };
            }
            return node;
        });

        onUpdateRoadmap(updatedRoadmap);

        if (!editingNode.parentId) {
            if (nodeForm.attachStations) {
                handleSelectStationPhase(editingNode.id);
            } else if (resolvedStationPhaseId === editingNode.id) {
                handleSelectStationPhase('none');
            }
        }

        setEditingNode(null);
        dialog.toast('Đã cập nhật thông tin', 'success');
    };

    const handleDeleteNode = async (nodeId) => {
        if (!canManageRoadmapTasks(currentUser, members, event)) {
            dialog.alert('Bạn không có quyền xóa mục này. Chỉ Thư ký, Quản lý và Admin mới có quyền thao tác.', { title: 'Không có quyền', type: 'warning' });
            return;
        }
        const ok = await dialog.confirm('Bạn có chắc chắn muốn xóa mục này? Nếu là Giai đoạn cha, các nhiệm vụ con cũng sẽ bị xóa.', {
            title: 'Xóa mục lộ trình',
            type: 'danger',
            confirmText: 'Xóa mục',
        });
        if (!ok) return;

        const toDeleteIds = new Set([nodeId]);
        roadmap.forEach(n => {
            if (n.parentId === nodeId) toDeleteIds.add(n.id);
        });

        const updatedRoadmap = roadmap.filter(n => !toDeleteIds.has(n.id));
        onUpdateRoadmap(updatedRoadmap);

        if (resolvedStationPhaseId === nodeId) {
            handleSelectStationPhase('none');
        }
        dialog.toast('Đã xóa mục khỏi lộ trình', 'info');
    };

    const handleOpenEditStation = (station, index) => {
        setEditingStation({ ...station, _editIndex: index });
        setIsStationModalOpen(true);
    };

    const handleSaveStation = (stationData) => {
        if (!onUpdateStations) return;
        let updated;
        if (editingStation) {
            const editIdx = typeof editingStation._editIndex === 'number' ? editingStation._editIndex : -1;
            const targetId = editingStation.id || editingStation._id;
            
            let foundIdx = editIdx;
            if (foundIdx === -1 || !stations[foundIdx]) {
                foundIdx = stations.findIndex((s, idx) => (targetId && (s.id === targetId || s._id === targetId)) || s === editingStation);
            }

            if (foundIdx !== -1 && stations[foundIdx]) {
                const persistentId = stations[foundIdx].id || stations[foundIdx]._id || targetId || stationData.id || `station-${Date.now()}`;
                updated = stations.map((s, idx) => idx === foundIdx ? { ...s, ...stationData, id: persistentId, order: s.order || idx + 1 } : s);
            } else {
                const newId = stationData.id || `station-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                updated = [...stations, { ...stationData, id: newId, order: stations.length + 1 }];
            }
        } else {
            const newId = stationData.id || `station-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            updated = [...stations, { ...stationData, id: newId, order: stations.length + 1 }];
        }
        onUpdateStations(updated);
        setIsStationModalOpen(false);
        setEditingStation(null);
        dialog.toast(editingStation ? 'Đã cập nhật phân khu / trạm' : 'Đã thêm phân khu / trạm mới', 'success');
    };

    const handleDeleteStation = async (stationId, stationIndex) => {
        if (!onUpdateStations) return;
        const ok = await dialog.confirm('Bạn có chắc chắn muốn xóa phân khu / trạm này khỏi kịch bản?', {
            title: 'Xóa phân khu / trạm',
            type: 'danger',
            confirmText: 'Xóa trạm',
        });
        if (!ok) return;

        const updated = stations.filter((s, idx) => {
            if (typeof stationIndex === 'number' && idx === stationIndex) return false;
            if (stationId && (s.id === stationId || s._id === stationId)) return false;
            return true;
        });
        onUpdateStations(updated);
        dialog.toast('Đã xóa phân khu / trạm khỏi kịch bản', 'info');
    };

    const partnerName = event?.location || event?.targetAudience || 'Địa điểm tổ chức';

    return (
        <div className="flex flex-col gap-6">
            {/* Unified Toolbar */}
            <TreeToolbar
                roadmapMode={roadmapMode}
                setRoadmapMode={setRoadmapMode}
                onOpenAddPhase={handleOpenAddPhase}
                readOnly={readOnly}
            />

            {/* Tree Roadmap Structure */}
            <div className="flex flex-col gap-6">
                {rootPhases.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-primary)] flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <IconLayers className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--text-primary)]">Chưa có giai đoạn nào trong lộ trình</h4>
                        <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                            Hãy thêm các giai đoạn chuẩn bị hoặc chọn mẫu quy trình chuẩn để sinh tự động.
                        </p>
                        {!readOnly && (
                            <button
                                type="button"
                                onClick={handleOpenAddPhase}
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold border-none cursor-pointer shadow-xs flex items-center gap-1.5"
                            >
                                <IconPlus className="w-3.5 h-3.5" />
                                <span>Thêm Giai đoạn đầu tiên</span>
                            </button>
                        )}
                    </div>
                ) : (
                    rootPhases.map((phase, pIndex) => {
                        const children = getChildrenOf(phase.id);
                        const phaseTheme = phaseColorPalette[pIndex % phaseColorPalette.length];
                        const isPhaseHoldingStations = resolvedStationPhaseId === phase.id;
                        const isCurrentPhase = resolvedCurrentPhaseId === phase.id;
                        const isPhaseHighlighted = highlightedTaskId && String(highlightedTaskId) === String(phase.id);

                        return (
                            <TreePhaseCard
                                key={phase.id}
                                phase={phase}
                                pIndex={pIndex}
                                phaseTheme={phaseTheme}
                                children={children}
                                isCollapsed={!!collapsedPhases[phase.id]}
                                isPhaseHighlighted={isPhaseHighlighted}
                                isPhaseHoldingStations={isPhaseHoldingStations}
                                isCurrentPhase={isCurrentPhase}
                                stations={stations}
                                highlightedTaskId={highlightedTaskId}
                                readOnly={readOnly}
                                activeMenuId={activeMenuId}
                                onToggleCollapse={(pId) => setCollapsedPhases(prev => ({ ...prev, [pId]: !prev[pId] }))}
                                onToggleMenu={toggleMenu}
                                onOpenAddSubTask={handleOpenAddSubTask}
                                onOpenEdit={handleOpenEdit}
                                onSetCurrentPhase={handleSetCurrentPhase}
                                onSelectStationPhase={handleSelectStationPhase}
                                onDeletePhase={handleDeleteNode}
                                // Task item handlers
                                currentUser={currentUser}
                                eventAssignees={eventAssignees}
                                getAssigneeInfo={getAssigneeInfo}
                                onAdvanceStatus={handleAdvanceStatus}
                                onToggleApprove={handleToggleApprove}
                                onOpenZaloModal={setZaloModalTask}
                                onOpenCommentsModal={setCommentsModalTask}
                                onQuickAssign={handleQuickAssign}
                                onDeleteTask={handleDeleteNode}
                                onUpdateProofLink={handleUpdateProofLink}
                                // Scenario Matrix handlers
                                event={event}
                                users={users}
                                members={members}
                                partnerName={partnerName}
                                onOpenEditStation={(!readOnly && onUpdateStations) ? handleOpenEditStation : null}
                                onDeleteStation={(!readOnly && onUpdateStations) ? handleDeleteStation : null}
                                onPreviewPhoto={setPreviewPhoto}
                            />
                        );
                    })
                )}

                {/* Standalone Scenario Matrix Block */}
                {resolvedStationPhaseId === 'standalone' && (
                    <div className="bg-[var(--bg-primary)] rounded-2xl border border-blue-300 overflow-hidden shadow-xs">
                        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-transparent border-b border-[var(--border-color)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                                    <IconTable className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[var(--text-primary)]">
                                        Khối Ma trận Kịch bản Thực địa ({stations.length} trạm song song)
                                    </h4>
                                    <p className="text-xs text-[var(--text-secondary)]">
                                        Bảng điều phối chi tiết song song với các giai đoạn chuẩn bị
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleSelectStationPhase('none')}
                                    className="px-2.5 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold cursor-pointer transition-colors"
                                >
                                    Ẩn khối ma trận
                                </button>
                            </div>
                        </div>
                        <TreeScenarioMatrixBranch
                            isStandalone={true}
                            event={event}
                            stations={stations}
                            users={users}
                            members={members}
                            partnerName={partnerName}
                            readOnly={readOnly}
                            onOpenEditStation={(!readOnly && onUpdateStations) ? handleOpenEditStation : null}
                            onDeleteStation={(!readOnly && onUpdateStations) ? handleDeleteStation : null}
                            onPreviewPhoto={setPreviewPhoto}
                            onSelectStationPhase={handleSelectStationPhase}
                        />
                    </div>
                )}

                {/* Detached Scenario Matrix Banner */}
                {resolvedStationPhaseId === null && stations.length > 0 && (
                    <div className="p-3.5 rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                                <IconTable className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="font-bold text-[var(--text-primary)]">
                                    Ma trận Kịch bản ({stations.length} trạm) đang được tháo rời khỏi các giai đoạn
                                </span>
                                <p className="text-[11px] text-[var(--text-secondary)] m-0">
                                    Bạn có thể gắn lại vào giai đoạn bất kỳ qua menu 3 chấm ⋮ của giai đoạn đó, hoặc mở xem dạng khối độc lập bên dưới.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => handleSelectStationPhase('standalone')}
                                className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold text-xs cursor-pointer shadow-2xs"
                            >
                                Mở dạng khối độc lập
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Add/Edit Phase or Task */}
            <AddEditNodeModal
                isOpen={isAddModalOpen || !!editingNode}
                editingNode={editingNode}
                addingParentId={addingParentId}
                nodeForm={nodeForm}
                setNodeForm={setNodeForm}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingNode(null);
                }}
                onSave={editingNode ? handleSaveEdit : handleSaveAdd}
                stations={stations}
                eventAssignees={eventAssignees}
            />

            {/* Modal: Add/Edit Station */}
            <AddEditStationModal
                isOpen={isStationModalOpen}
                onClose={() => {
                    setIsStationModalOpen(false);
                    setEditingStation(null);
                }}
                onSave={handleSaveStation}
                station={editingStation}
                users={users}
                members={members}
                partnerName={partnerName}
                eventId={event._id}
            />

            {/* Modal: Photo Lightbox Preview */}
            <PhotoLightboxModal
                photo={previewPhoto}
                onClose={() => setPreviewPhoto(null)}
            />

            {/* Modal: Task Comments / Feedback */}
            <TaskCommentsModal
                isOpen={!!commentsModalTask}
                task={commentsModalTask}
                onClose={() => setCommentsModalTask(null)}
                onAddComment={handleAddComment}
                readOnly={readOnly}
            />

            {/* Modal: Send Task Zalo Message */}
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
