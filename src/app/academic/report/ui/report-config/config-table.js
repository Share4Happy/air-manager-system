'use client'

import {
    deleteReportConfigAction,
    toggleReportConfigAction,
} from '@/app/actions/reportConfig.actions'
import {
    WEEKDAY_LABELS,
    FREQ_LABELS,
    TYPE_LABELS,
    fmtDate,
} from './constants'

export default function ConfigTable({
    configs = [],
    loading = false,
    onOpenSettings,
    onOpenHistory,
    onOpenLibrary,
    onOpenCreateConfig,
    onEditConfig,
    onSendNow,
    onRunAction,
}) {
    return (
        <div className="bg-white border border-[var(--border-color)] rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Cấu hình báo cáo</h3>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={onOpenSettings}
                        className="px-4 py-2 rounded bg-gray-100 border border-gray-300 text-sm font-medium cursor-pointer transition-colors hover:bg-gray-200">
                        Cài đặt gửi tin
                    </button>
                    <button onClick={onOpenHistory}
                        className="px-4 py-2 rounded bg-gray-100 border border-gray-300 text-sm font-medium cursor-pointer transition-colors hover:bg-gray-200">
                        Lịch sử gửi tin
                    </button>
                    <button onClick={onOpenLibrary}
                        className="px-4 py-2 rounded bg-gray-100 border border-gray-300 text-sm font-medium cursor-pointer transition-colors hover:bg-gray-200">
                        Thư viện mẫu
                    </button>
                    <button onClick={onOpenCreateConfig}
                        className="px-4 py-2 rounded bg-[var(--main_d)] text-white text-sm font-medium border-none cursor-pointer transition-colors hover:bg-[var(--main_b)]">
                        + Tạo cấu hình mới
                    </button>
                </div>
            </div>
            {loading ? (
                <p className="text-sm text-[var(--text-secondary)] italic">Đang tải...</p>
            ) : configs.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] italic">Chưa có cấu hình báo cáo nào.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-max">
                        <thead>
                            <tr className="bg-[var(--main_d)] text-white">
                                <th className="p-2 font-medium text-left">Tên</th>
                                <th className="p-2 font-medium text-left">Người nhận</th>
                                <th className="p-2 font-medium text-left">Zalo gửi</th>
                                <th className="p-2 font-medium text-left">Loại</th>
                                <th className="p-2 font-medium text-left">Tần suất</th>
                                <th className="p-2 font-medium text-left">Gửi lần tới</th>
                                <th className="p-2 font-medium text-left">Gửi lần cuối</th>
                                <th className="p-2 font-medium text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {configs.map(c => (
                                <tr key={c._id} className="border-b border-[var(--border-color)] hover:bg-blue-50">
                                    <td className="p-2 font-medium">{c.name || '—'}</td>
                                    <td className="p-2">{(c.recipientUserIds || []).map(r => r?.name).filter(Boolean).join(', ') || '—'}</td>
                                    <td className="p-2">{c.zaloAccountId?.name || '—'}</td>
                                    <td className="p-2">{TYPE_LABELS[c.reportType] || c.reportType}</td>
                                    <td className="p-2">
                                        {FREQ_LABELS[c.frequency] || c.frequency}
                                        {c.frequency === 'weekly' && ` · ${WEEKDAY_LABELS[(c.weekday || 1) - 1]}`}
                                        {c.frequency === 'monthly' && ` · ngày ${c.monthDay || 1}`}
                                        <span className="block text-xs text-[var(--text-secondary)]">{c.sendTime}</span>
                                    </td>
                                    <td className="p-2">{fmtDate(c.nextRunAt)}</td>
                                    <td className="p-2">{fmtDate(c.lastSentAt)}</td>
                                    <td className="p-2">
                                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                            <form action={toggleReportConfigAction} onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.target); await onRunAction(toggleReportConfigAction, fd); }}>
                                                <input type="hidden" name="_id" value={c._id} />
                                                <button type="submit" className={`px-2 py-1 rounded text-xs cursor-pointer border-none text-white ${c.isActive ? 'bg-green-600' : 'bg-gray-400'}`}>
                                                    {c.isActive ? 'Bật' : 'Tắt'}
                                                </button>
                                            </form>
                                            <button onClick={() => onSendNow(c)} className="px-2 py-1 rounded bg-blue-600 text-white text-xs cursor-pointer border-none hover:bg-blue-700">
                                                Gửi ngay
                                            </button>
                                            <button onClick={() => onEditConfig(c)} className="px-2 py-1 rounded bg-gray-200 text-xs cursor-pointer border-none hover:bg-gray-300">
                                                Sửa
                                            </button>
                                            <form action={deleteReportConfigAction} onSubmit={async (e) => { e.preventDefault(); if (!confirm('Xóa cấu hình này?')) return; const fd = new FormData(e.target); await onRunAction(deleteReportConfigAction, fd); }}>
                                                <input type="hidden" name="_id" value={c._id} />
                                                <button type="submit" className="px-2 py-1 rounded bg-red-600 text-white text-xs cursor-pointer border-none hover:bg-red-700">
                                                    Xóa
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
