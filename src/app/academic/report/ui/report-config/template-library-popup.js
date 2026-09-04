'use client'

import FlexiblePopup from '@/components/(features)/(popup)/popup_right'
import { deleteReportTemplateAction } from '@/app/actions/reportConfig.actions'
import { MESSAGE_TYPE_LABELS, TYPE_LABELS } from './constants'

export default function TemplateLibraryPopup({
    open,
    onClose,
    templates = [],
    onOpenCreateTemplate,
    onStartEditTemplate,
    onRunAction,
}) {
    return (
        <FlexiblePopup
            open={open}
            onClose={onClose}
            title="Thư viện mẫu tin nhắn"
            width="860px"
            renderItemList={() => (
                <div className="flex flex-col gap-3 p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <button onClick={onOpenCreateTemplate}
                            className="px-4 py-2 rounded bg-[var(--main_d)] text-white text-sm font-medium border-none cursor-pointer transition-colors hover:bg-[var(--main_b)]">
                            + Tạo mẫu mới
                        </button>
                        <div className="p-2.5 bg-gray-50 border border-gray-200 rounded text-xs text-[var(--text-secondary)] flex flex-col gap-0.5 max-w-lg">
                            <span className="font-semibold text-[var(--text-primary)]">Hướng dẫn tạo mẫu</span>
                            <span className="truncate">• Hỗ trợ thẻ: {'{tong_so_lop}'}, {'{co_mat}'}, {'{vang_mat}'}, {'{chi_tiet_lop}'}, {'{hoc_phi}'}, {'{period}'}, {'{date}'}...</span>
                        </div>
                    </div>
                    {templates.length === 0 ? (
                        <p className="text-sm text-[var(--text-secondary)] italic">Chưa có mẫu nào.</p>
                    ) : (
                        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto border border-[var(--border-color)] rounded-lg">
                            <table className="w-full text-sm min-w-max">
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-[var(--main_d)] text-white">
                                        <th className="p-2.5 font-medium text-left">Tên mẫu</th>
                                        <th className="p-2.5 font-medium text-left">Loại tin nhắn</th>
                                        <th className="p-2.5 font-medium text-left">Loại báo cáo</th>
                                        <th className="p-2.5 font-medium text-left">Nội dung mẫu</th>
                                        <th className="p-2.5 font-medium text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {templates.map(t => (
                                        <tr key={t._id} className="border-b border-[var(--border-color)] hover:bg-blue-50/50 align-top">
                                            <td className="p-2.5 font-medium max-w-[180px] truncate" title={t.name}>
                                                {t.name}
                                            </td>
                                            <td className="p-2.5 whitespace-nowrap">
                                                <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                                                    {MESSAGE_TYPE_LABELS[t.messageType] || 'Khác'}
                                                </span>
                                            </td>
                                            <td className="p-2.5 whitespace-nowrap">
                                                <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
                                                    {t.reportType === 'all' ? 'Tất cả' : TYPE_LABELS[t.reportType] || t.reportType}
                                                </span>
                                            </td>
                                            <td className="p-2.5 max-w-xs md:max-w-sm">
                                                <div
                                                    className="text-xs text-[var(--text-secondary)] font-mono line-clamp-2 max-h-12 overflow-hidden break-words"
                                                    title={t.content}
                                                >
                                                    {t.content}
                                                </div>
                                            </td>
                                            <td className="p-2.5 whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button onClick={() => { onClose(); onStartEditTemplate(t) }} className="px-2.5 py-1 rounded bg-gray-200 text-xs cursor-pointer border-none hover:bg-gray-300 transition-colors">
                                                        Sửa
                                                    </button>
                                                    <form action={deleteReportTemplateAction} onSubmit={async (e) => { e.preventDefault(); if (!confirm('Xóa mẫu này?')) return; const fd = new FormData(e.target); await onRunAction(deleteReportTemplateAction, fd); }}>
                                                        <input type="hidden" name="_id" value={t._id} />
                                                        <button type="submit" className="px-2.5 py-1 rounded bg-red-600 text-white text-xs cursor-pointer border-none hover:bg-red-700 transition-colors">
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
            )}
        />
    )
}
