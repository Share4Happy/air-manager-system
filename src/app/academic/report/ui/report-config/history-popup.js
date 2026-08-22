'use client'

import FlexiblePopup from '@/components/(features)/(popup)/popup_right'
import { fmtDate, logContent } from './constants'

export default function HistoryPopup({
    open,
    onClose,
    history = [],
    historyLoading = false,
    onSelectLog,
}) {
    return (
        <FlexiblePopup
            open={open}
            onClose={onClose}
            title="Lịch sử gửi tin báo cáo"
            width="900px"
            renderItemList={() => (
                <div className="flex flex-col gap-3 p-4">
                    {historyLoading ? (
                        <p className="text-sm text-[var(--text-secondary)] italic">Đang tải...</p>
                    ) : history.length === 0 ? (
                        <p className="text-sm text-[var(--text-secondary)] italic">Chưa có lịch sử gửi tin báo cáo.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-max">
                                <thead>
                                    <tr className="bg-[var(--main_d)] text-white">
                                        <th className="p-2 font-medium text-left">Thời gian</th>
                                        <th className="p-2 font-medium text-left">Zalo gửi</th>
                                        <th className="p-2 font-medium text-left">Người tạo</th>
                                        <th className="p-2 font-medium text-left">Trạng thái</th>
                                        <th className="p-2 font-medium text-left">Nội dung</th>
                                        <th className="p-2 font-medium text-center">Xem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(l => (
                                        <tr key={l._id} className="border-b border-[var(--border-color)] hover:bg-blue-50 align-top">
                                            <td className="p-2 whitespace-nowrap">{fmtDate(l.createdAt)}</td>
                                            <td className="p-2">{l.zalo?.name || '—'}</td>
                                            <td className="p-2">{l.createBy?.name || '—'}</td>
                                            <td className="p-2">
                                                <span className={`px-2 py-0.5 rounded text-xs text-white ${l.status?.status ? 'bg-green-600' : 'bg-red-600'}`}>
                                                    {l.status?.status ? 'Thành công' : 'Thất bại'}
                                                </span>
                                                <span className="block text-xs text-[var(--text-secondary)] mt-0.5">{l.status?.message}</span>
                                            </td>
                                            <td className="p-2 text-xs text-[var(--text-secondary)] whitespace-pre-wrap line-clamp-3 max-w-xs">{logContent(l) || '—'}</td>
                                            <td className="p-2 text-center">
                                                <button onClick={() => onSelectLog(l)}
                                                    className="px-2 py-1 rounded bg-blue-600 text-white text-xs cursor-pointer border-none hover:bg-blue-700">
                                                    Xem
                                                </button>
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
