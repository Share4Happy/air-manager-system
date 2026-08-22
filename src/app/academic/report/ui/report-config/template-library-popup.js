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
            width="900px"
            renderItemList={() => (
                <div className="flex flex-col gap-3 p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <button onClick={onOpenCreateTemplate}
                            className="px-4 py-2 rounded bg-[var(--main_d)] text-white text-sm font-medium border-none cursor-pointer transition-colors hover:bg-[var(--main_b)]">
                            + Tạo mẫu mới
                        </button>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs text-[var(--text-secondary)] flex flex-col gap-1">
                            <span className="font-semibold text-[var(--text-primary)]">Hướng dẫn tạo mẫu</span>
                            <span>• Dùng placeholder {'{body}'} (nội dung báo cáo tự sinh), {'{period}'} (kỳ báo cáo), {'{date}'} (ngày gửi).</span>
                            <span>• "Loại tin nhắn" dùng để phân loại mẫu; chọn mẫu từ thư viện ngay trong popup cấu hình để chèn vào ô tin nhắn.</span>
                        </div>
                    </div>
                    {templates.length === 0 ? (
                        <p className="text-sm text-[var(--text-secondary)] italic">Chưa có mẫu nào.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-max">
                                <thead>
                                    <tr className="bg-[var(--main_d)] text-white">
                                        <th className="p-2 font-medium text-left">Tên</th>
                                        <th className="p-2 font-medium text-left">Loại tin nhắn</th>
                                        <th className="p-2 font-medium text-left">Loại báo cáo</th>
                                        <th className="p-2 font-medium text-left">Nội dung</th>
                                        <th className="p-2 font-medium text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {templates.map(t => (
                                        <tr key={t._id} className="border-b border-[var(--border-color)] hover:bg-blue-50 align-top">
                                            <td className="p-2 font-medium whitespace-nowrap">{t.name}</td>
                                            <td className="p-2 whitespace-nowrap">
                                                <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                                                    {MESSAGE_TYPE_LABELS[t.messageType] || 'Khác'}
                                                </span>
                                            </td>
                                            <td className="p-2 whitespace-nowrap">
                                                <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
                                                    {t.reportType === 'all' ? 'Tất cả' : TYPE_LABELS[t.reportType] || t.reportType}
                                                </span>
                                            </td>
                                            <td className="p-2 text-xs text-[var(--text-secondary)] whitespace-pre-wrap line-clamp-2 max-w-md">{t.content}</td>
                                            <td className="p-2">
                                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                    <button onClick={() => { onClose(); onStartEditTemplate(t) }} className="px-2 py-1 rounded bg-gray-200 text-xs cursor-pointer border-none hover:bg-gray-300">
                                                        Sửa
                                                    </button>
                                                    <form action={deleteReportTemplateAction} onSubmit={async (e) => { e.preventDefault(); if (!confirm('Xóa mẫu này?')) return; const fd = new FormData(e.target); await onRunAction(deleteReportTemplateAction, fd); }}>
                                                        <input type="hidden" name="_id" value={t._id} />
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
            )}
        />
    )
}
