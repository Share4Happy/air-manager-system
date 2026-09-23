'use client'

import { useState } from 'react'
import Report from '@/app/teacher/ui/report'
import AttendanceTab from './attendance-tab'
import ReportConfigTab from './report-config-tab'

export default function ReportClient({ initialReports, users = [], zalo = [], areas = [] }) {
    const [tab, setTab] = useState('attendance')

    return (
        <div className="flex flex-col gap-3 p-4 h-full">
            <div className="flex gap-0 border-b border-[var(--border-color)] overflow-x-auto">
                <button
                    className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${tab === 'attendance' ? 'text-[var(--main_d)] border-b-2 border-[var(--main_d)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    onClick={() => setTab('attendance')}
                >
                    Báo cáo & Thông báo
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${tab === 'report' ? 'text-[var(--main_d)] border-b-2 border-[var(--main_d)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    onClick={() => setTab('report')}
                >
                    Báo cáo nhận xét
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${tab === 'config' ? 'text-[var(--main_d)] border-b-2 border-[var(--main_d)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    onClick={() => setTab('config')}
                >
                    Cấu hình báo cáo
                </button>
            </div>

            {tab === 'report' ? (
                <div className="flex-1 overflow-auto">
                    <Report initialReports={initialReports} />
                </div>
            ) : tab === 'attendance' ? (
                <AttendanceTab />
            ) : (
                <ReportConfigTab users={users} zalo={zalo} areas={areas} />
            )}
        </div>
    )
}
