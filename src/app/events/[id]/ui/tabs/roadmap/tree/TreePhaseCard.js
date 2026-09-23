'use client';
import React from 'react';
import TreeTaskItem from './TreeTaskItem';
import TreeScenarioMatrixBranch from './TreeScenarioMatrixBranch';
import {
    IconChevronDown,
    IconChevronRight,
    IconDotsVertical,
    IconPlus,
    IconEdit,
    IconStar,
    IconTable,
    IconTrash,
} from '@/app/events/ui/icons';

export default function TreePhaseCard({
    phase,
    pIndex,
    phaseTheme,
    children = [],
    isCollapsed = false,
    isPhaseHighlighted = false,
    isPhaseHoldingStations = false,
    isCurrentPhase = false,
    stations = [],
    highlightedTaskId,
    readOnly = false,
    activeMenuId,
    onToggleCollapse,
    onToggleMenu,
    onOpenAddSubTask,
    onOpenEdit,
    onSetCurrentPhase,
    onSelectStationPhase,
    onDeletePhase,
    // Task item handlers
    currentUser = null,
    eventAssignees = [],
    getAssigneeInfo,
    onAdvanceStatus,
    onToggleApprove,
    onOpenZaloModal,
    onOpenCommentsModal,
    onQuickAssign,
    onDeleteTask,
    onUpdateProofLink,
    // Scenario Matrix handlers
    event,
    users = [],
    members = [],
    partnerName,
    onOpenEditStation,
    onDeleteStation,
    onPreviewPhoto,
}) {
    const completedCount = children.filter(c => c.status === 'completed').length;
    const phasePercent = children.length > 0 ? Math.round((completedCount / children.length) * 100) : 0;
    const menuKey = `phase-${phase.id}`;

    return (
        <div
            id={`roadmap-phase-${phase.id}`}
            className={`bg-[var(--bg-primary)] rounded-2xl border transition-all duration-300 ${
                isPhaseHighlighted
                    ? 'ring-4 ring-blue-500 shadow-xl scale-[1.01] border-blue-400'
                    : isPhaseHoldingStations ? phaseTheme.activeHoldingBorder : phaseTheme.cardBorder
            } shadow-xs`}
        >
            {/* Phase Header Card (Root Node) */}
            <div className={`p-4 sm:p-5 ${phaseTheme.headerBg} ${!isCollapsed ? 'border-b border-[var(--border-color)] rounded-t-2xl' : 'rounded-2xl'} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => onToggleCollapse?.(phase.id)}
                        className="w-7 h-7 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] cursor-pointer shadow-2xs"
                    >
                        {isCollapsed ? <IconChevronRight className="w-3.5 h-3.5" /> : <IconChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <div>
                        {/* Green Tag "Giai đoạn đang diễn ra" placed on top */}
                        {isCurrentPhase && (
                            <div className="mb-2.5">
                                <span className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-lg bg-emerald-600 text-white shadow-xs tracking-wide uppercase">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-90"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                    </span>
                                    <span>Giai đoạn đang diễn ra</span>
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-2.5 flex-wrap">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${phaseTheme.badge} uppercase tracking-wider`}>
                                Giai đoạn {pIndex + 1}
                            </span>

                            <h4 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                                {phase.name}
                            </h4>

                            {/* Badge if this phase holds the scenario matrix */}
                            {isPhaseHoldingStations && stations.length > 0 && (
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${phaseTheme.holdingBadge} flex items-center gap-1.5 shadow-2xs`}>
                                    <IconTable className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Chứa Ma trận Kịch bản ({stations.length} Trạm)</span>
                                </span>
                            )}
                        </div>
                        {phase.description && (
                            <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                                {phase.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Phase Progress & 3-Dots Action Menu */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-24 h-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                style={{ width: `${phasePercent}%` }}
                            />
                        </div>
                        <span className="font-bold text-[var(--text-primary)] text-sm">
                            {completedCount}/{children.length} ({phasePercent}%)
                        </span>
                    </div>

                    {/* 3-Dots Dropdown for Phase */}
                    {!readOnly && (
                        <div className="relative" data-dropdown-menu="true">
                            <button
                                type="button"
                                onClick={(e) => onToggleMenu?.(e, menuKey)}
                                className="w-8 h-8 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors shadow-2xs"
                                title="Thao tác giai đoạn"
                            >
                                <IconDotsVertical className="w-4 h-4" />
                            </button>

                            {activeMenuId === menuKey && (
                                <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[210px] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-xl py-1.5">
                                    <button
                                        type="button"
                                        onClick={() => onOpenAddSubTask?.(phase.id)}
                                        className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] flex items-center gap-2.5 transition-colors border-none bg-transparent cursor-pointer"
                                    >
                                        <IconPlus className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Thêm nhiệm vụ con</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onOpenEdit?.(phase)}
                                        className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] flex items-center gap-2.5 transition-colors border-none bg-transparent cursor-pointer"
                                    >
                                        <IconEdit className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Chỉnh sửa giai đoạn</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onSetCurrentPhase?.(phase.id)}
                                        className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2.5 transition-colors border-none bg-transparent cursor-pointer ${
                                            isCurrentPhase
                                                ? 'text-emerald-600 font-semibold'
                                                : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                                        }`}
                                    >
                                        <IconStar className={`w-3.5 h-3.5 ${isCurrentPhase ? 'text-emerald-500 fill-emerald-500' : 'text-emerald-600'}`} />
                                        <span>{isCurrentPhase ? 'Giai đoạn hiện tại' : 'Đặt làm Giai đoạn hiện tại'}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onSelectStationPhase?.(isPhaseHoldingStations ? 'none' : phase.id)}
                                        className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2.5 transition-colors border-none bg-transparent cursor-pointer ${
                                            isPhaseHoldingStations
                                                ? 'text-amber-600 hover:bg-amber-50 font-semibold'
                                                : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                                        }`}
                                    >
                                        <IconTable className={`w-3.5 h-3.5 ${isPhaseHoldingStations ? 'text-amber-600' : 'text-blue-600'}`} />
                                        <span>{isPhaseHoldingStations ? 'Bỏ ma trận kịch bản' : 'Gắn ma trận kịch bản'}</span>
                                    </button>

                                    <div className="my-1 border-t border-[var(--border-color)]" />

                                    <button
                                        type="button"
                                        onClick={() => onDeletePhase?.(phase.id)}
                                        className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors border-none bg-transparent cursor-pointer"
                                    >
                                        <IconTrash className="w-3.5 h-3.5 text-rose-600" />
                                        <span>Xóa giai đoạn</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Child Nodes / Tasks Branches */}
            {!isCollapsed && (
                <div className="p-4 sm:p-5 flex flex-col gap-3 relative">
                    {/* Tree vertical connector line */}
                    <div className={`absolute left-7 top-0 bottom-6 w-0.5 ${phaseTheme.treeLine} hidden sm:block`} />

                    {children.length === 0 ? (
                        <div className="py-4 text-center text-xs text-[var(--text-secondary)] italic">
                            {readOnly ? 'Chưa có nhiệm vụ cụ thể cho giai đoạn này.' : 'Chưa có nhiệm vụ con nào. Bấm 3 chấm ⋮ để "+ Thêm việc".'}
                        </div>
                    ) : (
                        children.map((child) => (
                            <TreeTaskItem
                                key={child.id}
                                task={child}
                                phaseTheme={phaseTheme}
                                isHighlighted={highlightedTaskId && String(highlightedTaskId) === String(child.id)}
                                readOnly={readOnly}
                                currentUser={currentUser}
                                members={members}
                                event={event}
                                eventAssignees={eventAssignees}
                                getAssigneeInfo={getAssigneeInfo}
                                activeMenuId={activeMenuId}
                                onToggleMenu={onToggleMenu}
                                onAdvanceStatus={onAdvanceStatus}
                                onToggleApprove={onToggleApprove}
                                onOpenZaloModal={onOpenZaloModal}
                                onOpenCommentsModal={onOpenCommentsModal}
                                onQuickAssign={onQuickAssign}
                                onOpenEdit={onOpenEdit}
                                onDeleteTask={onDeleteTask}
                                onUpdateProofLink={onUpdateProofLink}
                            />
                        ))
                    )}

                    {/* Scenario Matrix Table rendered under this Phase if selected */}
                    {isPhaseHoldingStations && (
                        <TreeScenarioMatrixBranch
                            isStandalone={false}
                            event={event}
                            stations={stations}
                            users={users}
                            members={members}
                            partnerName={partnerName}
                            readOnly={readOnly}
                            onOpenEditStation={onOpenEditStation}
                            onDeleteStation={onDeleteStation}
                            onPreviewPhoto={onPreviewPhoto}
                            onSelectStationPhase={onSelectStationPhase}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
