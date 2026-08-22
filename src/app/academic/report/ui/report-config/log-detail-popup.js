'use client'

import FlexiblePopup from '@/components/(features)/(popup)/popup_right'
import { fmtDate, logContent } from './constants'

export default function LogDetailPopup({
    log,
    onClose,
}) {
    return (
        <FlexiblePopup
            open={!!log}
            onClose={onClose}
            title="Nội dung tin đã gửi"
            width="640px"
            renderItemList={() => (
                <div className="flex flex-col gap-3 p-4">
                    <div className="flex items-center gap-4 flex-wrap text-sm">
                        <span className="text-[var(--text-secondary)]">Thời gian: <span className="text-[var(--text-primary)]">{fmtDate(log?.createdAt)}</span></span>
                        <span className="text-[var(--text-secondary)]">Zalo gửi: <span className="text-[var(--text-primary)]">{log?.zalo?.name || '—'}</span></span>
                        <span className="text-[var(--text-secondary)]">Trạng thái: <span className={log?.status?.status ? 'text-green-600' : 'text-red-600'}>{log?.status?.status ? 'Thành công' : 'Thất bại'}</span></span>
                    </div>
                    {log?._logs?.length > 0 && (
                        <div>
                            <div className="text-sm text-[var(--text-secondary)] mb-1.5">Chi tiết từng người nhận:</div>
                            <div className="overflow-x-auto max-h-64 overflow-y-auto border border-[var(--border-color)] rounded-lg">
                                <table className="w-full text-sm min-w-max">
                                    <thead className="sticky top-0">
                                        <tr className="bg-[var(--main_d)] text-white">
                                            <th className="p-2 font-medium text-left">Họ tên</th>
                                            <th className="p-2 font-medium text-left">SĐT</th>
                                            <th className="p-2 font-medium text-left">Trạng thái</th>
                                            <th className="p-2 font-medium text-left">Chi tiết</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {log._logs.map((l, i) => (
                                            <tr key={i} className="border-b border-[var(--border-color)] align-top">
                                                <td className="p-2">{l.status?.data?.recipientNames?.[0] || '—'}</td>
                                                <td className="p-2">{l.status?.data?.recipients?.[0] || '—'}</td>
                                                <td className="p-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs text-white ${l.status?.status ? 'bg-green-600' : 'bg-red-600'}`}>
                                                        {l.status?.status ? 'Thành công' : 'Thất bại'}
                                                    </span>
                                                </td>
                                                <td className="p-2 text-xs text-[var(--text-secondary)]">{l.status?.message || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {logContent(log) ? (
                        <pre className="text-sm text-[var(--text-primary)] whitespace-pre-wrap bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-3 max-h-96 overflow-auto">{logContent(log)}</pre>
                    ) : (
                        <p className="text-sm text-[var(--text-secondary)] italic">Không có nội dung lưu trữ cho lần gửi này (log được tạo trước bản sửa lỗi).</p>
                    )}
                    <div className="flex justify-end pt-3 border-t border-[var(--border-color)]">
                        <button onClick={onClose}
                            className="px-4 py-2 rounded bg-gray-200 text-sm cursor-pointer border-none hover:bg-gray-300">
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        />
    )
}
