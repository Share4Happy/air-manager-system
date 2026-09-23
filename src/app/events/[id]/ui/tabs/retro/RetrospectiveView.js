'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { formatDate } from '@/function';
import {
    IconCheck,
    IconCheckCircle,
    IconSparkles,
    IconAlertCircle,
    IconLightbulb,
    IconUsers,
    IconSearch,
    IconChevronDown,
    IconChevronUp,
    IconCalendar,
    IconLayers,
    IconTrophy,
} from '@/app/events/ui/icons';

import {
    TASK_STATUS_CONFIG as statusConfig,
    TASK_PRIORITY_CONFIG as priorityConfig,
} from '@/app/events/ui/common';


export default function RetrospectiveView({
    event = {},
    users = [],
    members = [],
    roadmap = [],
    onUpdateSummaryReport,
    onMarkCompleted,
    readOnly = false,
}) {
    const report = event.summaryReport || {};
    const [formData, setFormData] = useState({
        overview: report.overview || '',
        achievements: report.achievements || '',
        challenges: report.challenges || '',
        lessonsLearned: report.lessonsLearned || '',
        finalAttendeeCount: report.finalAttendeeCount || event.participantsCount || 0,
    });
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(false);

    // Filter states for Member Tasks
    const [taskSearch, setTaskSearch] = useState('');
    const [selectedMemberFilter, setSelectedMemberFilter] = useState('all');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
    const [expandedMembers, setExpandedMembers] = useState(new Set());

    const roadmapData = useMemo(() => event.roadmap || roadmap || [], [event.roadmap, roadmap]);
    const membersData = useMemo(() => event.members || members || [], [event.members, members]);

    // Split into Phases and Tasks
    const rootPhases = useMemo(() => roadmapData.filter(n => !n.parentId), [roadmapData]);
    const allTasks = useMemo(() => {
        const children = roadmapData.filter(n => n.parentId);
        if (children.length > 0) return children;
        return roadmapData;
    }, [roadmapData]);

    // Map Phase ID -> Phase Info
    const phaseMap = useMemo(() => {
        const map = {};
        rootPhases.forEach((p, idx) => {
            map[p.id] = { ...p, index: idx + 1 };
        });
        return map;
    }, [rootPhases]);

    // Build unified assignees list without duplicate entries
    const allAssignees = useMemo(() => {
        const list = [];
        const seenMemberIds = new Set();
        const seenUserIds = new Set();
        const seenNames = new Set();

        // 1. Members registered in event
        membersData.forEach(m => {
            const mId = String(m.id || m._id || '');
            const uId = m.userId ? String(m.userId) : null;
            if (mId && !seenMemberIds.has(mId)) {
                seenMemberIds.add(mId);
                if (uId) seenUserIds.add(uId);
                if (m.name) seenNames.add(m.name.trim().toLowerCase());
                list.push({
                    id: mId,
                    name: m.name || 'Thành viên',
                    role: m.role || 'Thành viên',
                    organization: m.organization || '',
                    isExternal: m.isExternal ?? true,
                    userId: uId,
                });
            }
        });

        // 2. System users involved who are not already listed as event members
        users.forEach(u => {
            const uId = String(u._id);
            const uName = (u.name || '').trim().toLowerCase();
            if (!seenUserIds.has(uId) && (!uName || !seenNames.has(uName))) {
                seenUserIds.add(uId);
                if (uName) seenNames.add(uName);
                list.push({
                    id: uId,
                    name: u.name || 'Nhân sự',
                    role: Array.isArray(u.role) ? u.role.join(', ') : u.role || 'Nhân sự AIR',
                    organization: 'AI Robotic',
                    isExternal: false,
                    userId: uId,
                });
            }
        });

        // 3. Any assignee from roadmap tasks not yet in the list
        allTasks.forEach(t => {
            if (t.assignee) {
                const aId = typeof t.assignee === 'object' ? String(t.assignee._id || t.assignee.id || '') : String(t.assignee);
                const aName = (t.assigneeName || (typeof t.assignee === 'object' ? t.assignee.name : '') || '').trim().toLowerCase();
                if (aId && !seenMemberIds.has(aId) && !seenUserIds.has(aId) && (!aName || !seenNames.has(aName))) {
                    seenMemberIds.add(aId);
                    if (aName) seenNames.add(aName);
                    list.push({
                        id: aId,
                        name: t.assigneeName || (typeof t.assignee === 'object' ? t.assignee.name : 'Thành viên'),
                        role: 'Phụ trách công việc',
                        organization: '',
                        isExternal: t.assigneeType === 'member',
                    });
                }
            } else if (t.assigneeName && t.assigneeName.trim()) {
                const nameTrimmed = t.assigneeName.trim();
                const nameKey = nameTrimmed.toLowerCase();
                if (!seenNames.has(nameKey)) {
                    seenNames.add(nameKey);
                    list.push({
                        id: `name-${nameTrimmed}`,
                        name: nameTrimmed,
                        role: 'Phụ trách công việc',
                        organization: '',
                        isExternal: true,
                    });
                }
            }
        });

        return list;
    }, [membersData, users, allTasks]);

    // Check if task belongs to a member
    const isTaskAssignedTo = (task, member) => {
        if (!task || !member) return false;
        if (task.assignee) {
            const taskIdStr = typeof task.assignee === 'object' ? String(task.assignee._id || task.assignee.id) : String(task.assignee);
            if (taskIdStr === member.id) return true;
            if (member.userId && taskIdStr === member.userId) return true;
        }
        if (task.assigneeName && member.name && task.assigneeName.trim().toLowerCase() === member.name.trim().toLowerCase()) {
            return true;
        }
        return false;
    };

    // Calculate Member Task Stats & Grouping
    const memberTaskGroups = useMemo(() => {
        const groups = allAssignees.map(member => {
            const memberTasks = allTasks.filter(task => isTaskAssignedTo(task, member));
            const total = memberTasks.length;
            const completed = memberTasks.filter(t => t.status === 'completed').length;
            const inProgress = memberTasks.filter(t => t.status === 'in_progress').length;
            const overdue = memberTasks.filter(t => t.status === 'overdue' || (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed')).length;
            const pending = memberTasks.filter(t => t.status === 'pending').length;
            const blocked = memberTasks.filter(t => t.status === 'blocked').length;
            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

            return {
                member,
                tasks: memberTasks,
                total,
                completed,
                inProgress,
                overdue,
                pending,
                blocked,
                completionRate,
            };
        });

        // Unassigned tasks
        const unassignedTasks = allTasks.filter(task => {
            if (!task.assignee && !task.assigneeName) return true;
            const assigned = allAssignees.some(m => isTaskAssignedTo(task, m));
            return !assigned;
        });

        if (unassignedTasks.length > 0) {
            const total = unassignedTasks.length;
            const completed = unassignedTasks.filter(t => t.status === 'completed').length;
            const inProgress = unassignedTasks.filter(t => t.status === 'in_progress').length;
            const overdue = unassignedTasks.filter(t => t.status === 'overdue' || (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed')).length;
            const pending = unassignedTasks.filter(t => t.status === 'pending').length;
            const blocked = unassignedTasks.filter(t => t.status === 'blocked').length;
            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

            groups.push({
                member: {
                    id: 'unassigned',
                    name: 'Chưa phân công',
                    role: 'Nhiệm vụ chung / Tự do',
                    organization: 'Sự kiện',
                    isExternal: false,
                    isUnassigned: true,
                },
                tasks: unassignedTasks,
                total,
                completed,
                inProgress,
                overdue,
                pending,
                blocked,
                completionRate,
            });
        }

        return groups
            .filter(g => g.total > 0 || membersData.some(m => String(m.id || m._id) === g.member.id))
            .sort((a, b) => {
                if (a.member.isUnassigned) return 1;
                if (b.member.isUnassigned) return -1;
                if (b.total !== a.total) return b.total - a.total;
                return b.completionRate - a.completionRate;
            });
    }, [allAssignees, allTasks, membersData]);

    // Initialize expanded members on mount
    useEffect(() => {
        const initialExpanded = new Set();
        memberTaskGroups.forEach(g => {
            if (g.total > 0) {
                initialExpanded.add(g.member.id);
            }
        });
        setExpandedMembers(initialExpanded);
    }, [memberTaskGroups]);

    // Overall Event Task Statistics
    const overallStats = useMemo(() => {
        const total = allTasks.length;
        const completed = allTasks.filter(t => t.status === 'completed').length;
        const inProgress = allTasks.filter(t => t.status === 'in_progress').length;
        const overdue = allTasks.filter(t => t.status === 'overdue' || (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed')).length;
        const pending = allTasks.filter(t => t.status === 'pending').length;
        const blocked = allTasks.filter(t => t.status === 'blocked').length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            total,
            completed,
            inProgress,
            overdue,
            pending,
            blocked,
            rate,
        };
    }, [allTasks]);

    // Filtered tasks by Member
    const filteredMemberGroups = useMemo(() => {
        const q = taskSearch.trim().toLowerCase();

        return memberTaskGroups
            .map(group => {
                if (selectedMemberFilter !== 'all' && group.member.id !== selectedMemberFilter) {
                    return null;
                }

                const matchedTasks = group.tasks.filter(task => {
                    if (selectedStatusFilter !== 'all') {
                        if (selectedStatusFilter === 'overdue') {
                            const isOverdue = task.status === 'overdue' || (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed');
                            if (!isOverdue) return false;
                        } else if (task.status !== selectedStatusFilter) {
                            return false;
                        }
                    }

                    if (q) {
                        const matchName = task.name && task.name.toLowerCase().includes(q);
                        const matchPhase = phaseMap[task.parentId]?.name && phaseMap[task.parentId].name.toLowerCase().includes(q);
                        const matchAssignee = group.member.name && group.member.name.toLowerCase().includes(q);
                        if (!matchName && !matchPhase && !matchAssignee) return false;
                    }

                    return true;
                });

                if (q && matchedTasks.length === 0 && !group.member.name.toLowerCase().includes(q)) {
                    return null;
                }

                return {
                    ...group,
                    filteredTasks: matchedTasks,
                };
            })
            .filter(Boolean);
    }, [memberTaskGroups, selectedMemberFilter, selectedStatusFilter, taskSearch, phaseMap]);

    useEffect(() => {
        if (event.summaryReport) {
            setFormData({
                overview: event.summaryReport.overview || '',
                achievements: event.summaryReport.achievements || '',
                challenges: event.summaryReport.challenges || '',
                lessonsLearned: event.summaryReport.lessonsLearned || '',
                finalAttendeeCount: event.summaryReport.finalAttendeeCount || event.participantsCount || 0,
            });
        }
    }, [event.summaryReport, event.participantsCount]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onUpdateSummaryReport?.({
                ...formData,
                completedAt: new Date(),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3500);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpandMember = (memberId) => {
        setExpandedMembers(prev => {
            const next = new Set(prev);
            if (next.has(memberId)) next.delete(memberId);
            else next.add(memberId);
            return next;
        });
    };

    const toggleExpandAll = () => {
        if (expandedMembers.size > 0) {
            setExpandedMembers(new Set());
        } else {
            const allIds = new Set(memberTaskGroups.map(g => g.member.id));
            setExpandedMembers(allIds);
        }
    };

    const isCompleted = event.status === 'completed';

    return (
        <div className="w-full flex flex-col gap-6 min-w-0">
            {/* Top Action Bar */}
            <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)] shadow-xs">
                <div className="flex items-center gap-2.5 flex-wrap">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`} />
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                        Trạng thái Sự kiện:
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${isCompleted ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'}`}>
                        {isCompleted ? 'Đã hoàn thành' : 'Đang thực hiện / Tổng kết'}
                    </span>
                </div>

                {!isCompleted && !readOnly && (
                    <button
                        type="button"
                        onClick={onMarkCompleted}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all whitespace-nowrap"
                    >
                        <IconCheck className="w-4 h-4" />
                        <span>Đánh dấu Sự kiện đã Hoàn thành</span>
                    </button>
                )}
            </div>

            {/* ========================================================= */}
            {/* KHỐI 1: TỔNG HỢP CÔNG VIỆC THEO THÀNH VIÊN (TRÊN CÙNG)     */}
            {/* ========================================================= */}
            <div className="w-full bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] p-4 sm:p-6 shadow-xs flex flex-col gap-5">
                {/* Header with Title & Expand/Collapse */}
                <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center border border-indigo-100 dark:border-indigo-900 shrink-0">
                            <IconUsers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] m-0">
                                    Tổng hợp Công việc theo Thành viên
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                    {overallStats.completed}/{overallStats.total} hoàn thành ({overallStats.rate}%)
                                </span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] m-0 mt-1">
                                Theo dõi chi tiết tiến độ nhiệm vụ của từng nhân sự tham gia sự kiện
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={toggleExpandAll}
                        className="px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-xs text-[var(--text-primary)] font-medium cursor-pointer transition-colors whitespace-nowrap"
                    >
                        {expandedMembers.size > 0 ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
                    </button>
                </div>

                {/* Overall KPI Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
                    {/* Hoàn thành */}
                    <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900 flex flex-col justify-between gap-2">
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="truncate">Đã hoàn thành</span>
                        </span>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                                {overallStats.completed}
                            </span>
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                ({overallStats.rate}%)
                            </span>
                        </div>
                    </div>

                    {/* Đang làm */}
                    <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900 flex flex-col justify-between gap-2">
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                            <span className="truncate">Đang thực hiện</span>
                        </span>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300">
                                {overallStats.inProgress}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)]">
                                công việc
                            </span>
                        </div>
                    </div>

                    {/* Trễ hạn */}
                    <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900 flex flex-col justify-between gap-2">
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                            <span className="truncate">Trễ hạn / Cần chú ý</span>
                        </span>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-300">
                                {overallStats.overdue}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)]">
                                công việc
                            </span>
                        </div>
                    </div>

                    {/* Chờ xử lý */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                            <span className="truncate">Chưa làm</span>
                        </span>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-2xl sm:text-3xl font-bold text-slate-700 dark:text-slate-300">
                                {overallStats.pending}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)]">
                                công việc
                            </span>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Controls */}
                <div className="w-full flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[200px]">
                        <IconSearch className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={taskSearch}
                            onChange={e => setTaskSearch(e.target.value)}
                            placeholder="Tìm kiếm công việc, tên nhân sự, vai trò..."
                            className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Member Filter */}
                    <select
                        value={selectedMemberFilter}
                        onChange={e => setSelectedMemberFilter(e.target.value)}
                        className="w-full md:w-auto md:max-w-[260px] px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                        <option value="all">Tất cả thành viên ({memberTaskGroups.length})</option>
                        {memberTaskGroups.map(g => (
                            <option key={g.member.id} value={g.member.id}>
                                {g.member.name} ({g.completed}/{g.total} xong)
                            </option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        value={selectedStatusFilter}
                        onChange={e => setSelectedStatusFilter(e.target.value)}
                        className="w-full md:w-auto md:min-w-[170px] px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="completed">Đã hoàn thành</option>
                        <option value="in_progress">Đang làm</option>
                        <option value="overdue">Trễ hạn</option>
                        <option value="pending">Chưa làm</option>
                    </select>
                </div>

                {/* Member Tasks Accordion List */}
                <div className="w-full flex flex-col gap-3.5">
                    {filteredMemberGroups.length === 0 ? (
                        <div className="py-12 text-center text-xs sm:text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-xl border border-dashed border-[var(--border-color)]">
                            Không tìm thấy thành viên hoặc công việc phù hợp với điều kiện tìm kiếm.
                        </div>
                    ) : (
                        filteredMemberGroups.map(group => {
                            const { member, filteredTasks, total, completed, overdue, completionRate } = group;
                            const isExpanded = expandedMembers.has(member.id);

                            return (
                                <div
                                    key={member.id}
                                    className={`w-full rounded-2xl border transition-all overflow-hidden ${member.isUnassigned ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10' : 'border-[var(--border-color)] bg-[var(--bg-secondary)]'}`}
                                >
                                    {/* Member Header (Click to toggle) */}
                                    <div
                                        onClick={() => toggleExpandMember(member.id)}
                                        className="p-3.5 sm:p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors select-none"
                                    >
                                        {/* Member Info */}
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            {/* Avatar / Initials */}
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${member.isUnassigned ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'}`}>
                                                {member.isUnassigned ? '?' : (member.name ? member.name.charAt(0).toUpperCase() : 'U')}
                                            </div>

                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                                                        {member.name}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold shrink-0 ${member.isExternal ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'}`}>
                                                        {member.role || 'Thành viên'}
                                                    </span>
                                                    {member.organization && (
                                                        <span className="text-xs text-[var(--text-secondary)]">
                                                            ({member.organization})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats, Progress Bar & Accordion Trigger */}
                                        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                                            {total > 0 && (
                                                <div className="hidden sm:flex flex-col items-end gap-1 w-28 lg:w-36">
                                                    <div className="flex items-center justify-between w-full text-xs font-semibold text-[var(--text-primary)]">
                                                        <span>{completed}/{total}</span>
                                                        <span className={completionRate === 100 ? 'text-emerald-600 font-bold' : 'text-blue-600'}>
                                                            {completionRate}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${completionRate === 100 ? 'bg-emerald-500' : completionRate > 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                            style={{ width: `${completionRate}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 text-xs">
                                                {overdue > 0 && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" title="Có task trễ hạn">
                                                        {overdue} trễ
                                                    </span>
                                                )}
                                                <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-[var(--border-color)] text-xs text-[var(--text-primary)] font-semibold">
                                                    {filteredTasks.length} task
                                                </span>
                                                <div className="w-6 h-6 flex items-center justify-center text-[var(--text-secondary)]">
                                                    {isExpanded ? (
                                                        <IconChevronUp className="w-4 h-4" />
                                                    ) : (
                                                        <IconChevronDown className="w-4 h-4" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Tasks List */}
                                    {isExpanded && (
                                        <div className="border-t border-[var(--border-color)] bg-[var(--bg-primary)] p-3 sm:p-4 flex flex-col gap-2.5">
                                            {filteredTasks.length === 0 ? (
                                                <div className="py-4 text-center text-xs text-[var(--text-secondary)] italic">
                                                    Không có công việc nào phù hợp với bộ lọc hiện tại.
                                                </div>
                                            ) : (
                                                filteredTasks.map((task, tIdx) => {
                                                    const st = statusConfig[task.status] || statusConfig.pending;
                                                    const pr = priorityConfig[task.priority] || priorityConfig.medium;
                                                    const phase = phaseMap[task.parentId];
                                                    const isTaskOverdue = task.status === 'overdue' || (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed');

                                                    return (
                                                        <div
                                                            key={task.id || tIdx}
                                                            className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${task.status === 'completed' ? 'border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/20 dark:bg-emerald-950/10' : 'border-[var(--border-color)] bg-[var(--bg-secondary)]'}`}
                                                        >
                                                            {/* Task Info */}
                                                            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className={`text-xs sm:text-sm font-bold text-[var(--text-primary)] ${task.status === 'completed' ? 'line-through text-slate-500 dark:text-slate-400' : ''}`}>
                                                                        {task.name}
                                                                    </span>
                                                                    {task.isApproved && (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                                            <IconCheck className="w-3 h-3" /> Đã duyệt
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] flex-wrap">
                                                                    {phase && (
                                                                        <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                                                                            <IconLayers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                                            <span>{phase.name}</span>
                                                                        </span>
                                                                    )}
                                                                    {task.dueDate && (
                                                                        <span className={`flex items-center gap-1 ${isTaskOverdue ? 'text-rose-600 font-bold' : ''}`}>
                                                                            <IconCalendar className="w-3.5 h-3.5 shrink-0" />
                                                                            <span>Hạn: {formatDate(task.dueDate)}</span>
                                                                        </span>
                                                                    )}
                                                                    {task.completedAt && (
                                                                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                                            <IconCheckCircle className="w-3.5 h-3.5 shrink-0" />
                                                                            <span>Xong: {formatDate(task.completedAt)}</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Badges */}
                                                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${pr.color}`}>
                                                                    {pr.label}
                                                                </span>
                                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${isTaskOverdue ? statusConfig.overdue.badge : st.badge}`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${isTaskOverdue ? 'bg-amber-500' : st.dot}`} />
                                                                    <span>{isTaskOverdue ? 'Trễ hạn' : st.label}</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ========================================================= */}
            {/* KHỐI 2: BÁO CÁO & ĐÁNH GIÁ TỔNG KẾT (PHÍA DƯỚI)           */}
            {/* ========================================================= */}
            <div className="w-full bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] p-4 sm:p-6 shadow-xs flex flex-col gap-5">
                <div className="w-full flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center border border-blue-100 dark:border-blue-900 shrink-0">
                            <IconTrophy className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] m-0">
                                Báo cáo & Đánh giá Tổng kết Sự kiện
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] m-0 mt-1">
                                Đánh giá kết quả tổng thể, thành tựu nổi bật và bài học kinh nghiệm sau sự kiện
                            </p>
                        </div>
                    </div>
                </div>

                {!readOnly ? (
                    /* Editable Form */
                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
                        {saved && (
                            <div className="p-3.5 text-xs sm:text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center gap-2 font-medium">
                                <IconCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                                <span>Đã lưu báo cáo tổng kết thành công!</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
                            <div className="lg:col-span-2 flex flex-col gap-1.5">
                                <label className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                                    1. Đánh giá Tổng quan về Chương trình
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.overview}
                                    onChange={e => setFormData({ ...formData, overview: e.target.value })}
                                    placeholder="Tóm tắt không khí ngày diễn ra, phản hồi của phụ huynh, mức độ hoàn thành mục tiêu..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            <div className="lg:col-span-1 flex flex-col gap-1.5">
                                <label className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                                    Số lượng tham dự thực tế
                                </label>
                                <input
                                    type="number"
                                    value={formData.finalAttendeeCount}
                                    onChange={e => setFormData({ ...formData, finalAttendeeCount: Number(e.target.value) || 0 })}
                                    placeholder="0"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-xs text-[var(--text-secondary)]">
                                    Học sinh / Thí sinh / Khách mời
                                </span>
                            </div>
                        </div>

                        {/* 3 Sub-columns for Achievements, Challenges, Lessons Learned */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
                            {/* Achievements */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                    <IconSparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>2. Điểm nổi bật & Thành tựu</span>
                                </label>
                                <textarea
                                    rows={5}
                                    value={formData.achievements}
                                    onChange={e => setFormData({ ...formData, achievements: e.target.value })}
                                    placeholder="Những khâu làm rất tốt, các đội thi xuất sắc, tỷ lệ chuyển đổi tuyển sinh cao..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                />
                            </div>

                            {/* Challenges */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                    <IconAlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>3. Khó khăn & Vấn đề phát sinh</span>
                                </label>
                                <textarea
                                    rows={5}
                                    value={formData.challenges}
                                    onChange={e => setFormData({ ...formData, challenges: e.target.value })}
                                    placeholder="Sự cố kỹ thuật, thời gian bị trễ, sa bàn bị lỗi, khâu đón tiếp quá tải..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                />
                            </div>

                            {/* Lessons Learned */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                    <IconLightbulb className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span>4. Bài học kinh nghiệm mùa sau</span>
                                </label>
                                <textarea
                                    rows={5}
                                    value={formData.lessonsLearned}
                                    onChange={e => setFormData({ ...formData, lessonsLearned: e.target.value })}
                                    placeholder="Các cải tiến cần làm: chuẩn bị thêm pin dự phòng, test phần mềm sớm hơn 3 ngày..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>
                        </div>

                        <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs border-none cursor-pointer flex items-center gap-2 disabled:opacity-50 transition-all"
                            >
                                {loading ? 'Đang lưu...' : 'Lưu Báo cáo Tổng kết'}
                            </button>
                        </div>
                    </form>
                ) : (
                    /* Read-Only Presentation */
                    <div className="w-full flex flex-col gap-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
                            <div className="lg:col-span-2 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex flex-col gap-2">
                                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                    Đánh giá Tổng quan về Chương trình
                                </span>
                                <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap m-0">
                                    {formData.overview || 'Chưa có nội dung đánh giá tổng quan.'}
                                </p>
                            </div>

                            <div className="lg:col-span-1 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex flex-col justify-center gap-1">
                                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                    Số lượng tham dự thực tế
                                </span>
                                <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                                    {formData.finalAttendeeCount}
                                </span>
                                <span className="text-xs text-[var(--text-secondary)]">
                                    Học sinh / Thí sinh / Khách mời
                                </span>
                            </div>
                        </div>

                        {/* 3 Columns */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
                            {/* Achievements */}
                            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex flex-col gap-2">
                                <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                                    <IconSparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Điểm nổi bật & Thành tựu</span>
                                </span>
                                <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap m-0">
                                    {formData.achievements || 'Chưa có ghi nhận.'}
                                </p>
                            </div>

                            {/* Challenges */}
                            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex flex-col gap-2">
                                <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                                    <IconAlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>Khó khăn & Vấn đề phát sinh</span>
                                </span>
                                <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap m-0">
                                    {formData.challenges || 'Chưa có ghi nhận.'}
                                </p>
                            </div>

                            {/* Lessons Learned */}
                            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex flex-col gap-2">
                                <span className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                                    <IconLightbulb className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span>Bài học kinh nghiệm mùa sau</span>
                                </span>
                                <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap m-0">
                                    {formData.lessonsLearned || 'Chưa có ghi nhận.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
