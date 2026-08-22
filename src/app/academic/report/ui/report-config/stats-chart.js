'use client'

import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { RANGE_LABELS } from './constants'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function ReportStatsChart({ data }) {
    const values = data?.data || []
    const todayIndex = typeof data?.todayIndex === 'number' ? data.todayIndex : -1
    const chartData = {
        labels: data?.labels || [],
        datasets: [
            {
                label: 'Số tin đã gửi',
                data: values,
                backgroundColor: values.map((_, i) =>
                    i === todayIndex ? 'rgba(47, 111, 208, 0.9)' : 'rgba(54, 162, 235, 0.6)'),
                borderColor: values.map((_, i) =>
                    i === todayIndex ? 'rgba(26, 84, 165, 1)' : 'rgba(54, 162, 235, 1)'),
                borderWidth: 1,
                borderRadius: 4,
            },
        ],
    }
    return (
        <div style={{ position: 'relative', height: 220, width: '100%' }}>
            <Bar options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={chartData} />
        </div>
    )
}

export default function StatsChartSection({ stats, statsRange, statsLoading, onRangeChange }) {
    return (
        <div className="bg-white border border-[var(--border-color)] rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Thống kê tin báo cáo đã gửi</h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {Object.entries(RANGE_LABELS).map(([v, l]) => (
                        <button key={v} onClick={() => onRangeChange(v)}
                            className={`px-3 py-1.5 rounded text-sm cursor-pointer border transition-colors ${statsRange === v ? 'bg-[var(--main_d)] text-white border-[var(--main_d)]' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'}`}>
                            {l}
                        </button>
                    ))}
                </div>
            </div>
            {statsLoading && !stats ? (
                <p className="text-sm text-[var(--text-secondary)] italic">Đang tải...</p>
            ) : stats ? (
                <ReportStatsChart data={stats} />
            ) : (
                <p className="text-sm text-[var(--text-secondary)] italic">Chưa có dữ liệu thống kê.</p>
            )}
        </div>
    )
}
