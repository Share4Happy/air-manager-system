'use client'

import { useState } from 'react'
import Tabs from '@/components/(ui)/(tabs)'
import Report from '@/app/teacher/ui/report'
import AttendanceTab from './attendance-tab'
import ReportConfigTab from './report-config-tab'

const REPORT_TABS = [
    { id: 'attendance', label: 'Báo cáo & Thông báo' },
    { id: 'report', label: 'Báo cáo nhận xét' },
    { id: 'config', label: 'Cấu hình báo cáo' },
]

export default function ReportClient({ initialReports, users = [], zalo = [], areas = [] }) {
    const [tab, setTab] = useState('attendance')

    return (
        <div className="h-full flex flex-col min-h-0 p-0 gap-2">
            <Tabs
                tabs={REPORT_TABS}
                activeTab={tab}
                onTabChange={setTab}
            />

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
