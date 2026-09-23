'use client';
import React from 'react';
import ScenarioMatrixTable from '../../stations/ScenarioMatrixTable';
import { IconTable } from '@/app/events/ui/icons';

export default function TreeScenarioMatrixBranch({
    isStandalone = false,
    event,
    stations = [],
    users = [],
    members = [],
    partnerName,
    readOnly = false,
    onOpenEditStation,
    onDeleteStation,
    onPreviewPhoto,
    onSelectStationPhase,
}) {
    if (stations.length === 0) {
        return (
            <div className={`${isStandalone ? 'p-4 sm:p-5' : 'sm:ml-8 mt-2'} flex flex-col gap-3 relative`}>
                {!isStandalone && (
                    <div className="absolute -left-5 top-4 w-5 h-0.5 bg-blue-300 hidden sm:block" />
                )}
                <div className="p-6 text-center rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <IconTable className="w-5 h-5" />
                    </div>
                    <div>
                        <h5 className="font-bold text-xs text-[var(--text-primary)]">
                            Chưa có phân khu / trạm kịch bản nào
                        </h5>
                        <p className="text-[11px] text-[var(--text-secondary)]">
                            Nạp mẫu chuẩn hoặc thêm trạm mới để xây dựng bảng ma trận kịch bản thực địa
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${isStandalone ? 'p-4 sm:p-5' : 'sm:ml-8 mt-2'} flex flex-col gap-3 relative`}>
            {!isStandalone && (
                <div className="absolute -left-5 top-4 w-5 h-0.5 bg-blue-300 hidden sm:block" />
            )}

            {/* Scenario Matrix Title & Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center font-bold text-blue-600 shrink-0">
                        <IconTable className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                        <h5 className="font-bold text-sm sm:text-base text-[var(--text-primary)] truncate flex items-center gap-2.5">
                            <span>Bảng Ma trận Kịch bản Điều phối ({stations.length} trạm song song)</span>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                                {isStandalone ? 'Khối độc lập' : 'Thực địa D-Day'}
                            </span>
                        </h5>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] truncate mt-0.5">
                            Phân định trách nhiệm hai chiều: Bên phụ trách vs {partnerName}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                    {!isStandalone && !readOnly && (
                        <button
                            type="button"
                            onClick={() => onSelectStationPhase?.('none')}
                            className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            title="Bỏ ma trận kịch bản"
                        >
                            <span>Bỏ ma trận kịch bản</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Scenario Matrix Table */}
            <ScenarioMatrixTable
                event={event}
                stations={stations}
                users={users}
                members={members}
                partnerName={partnerName}
                onOpenEditStation={onOpenEditStation}
                onDeleteStation={onDeleteStation}
                onPreviewPhoto={onPreviewPhoto}
                hideTitleBar={true}
            />
        </div>
    );
}
