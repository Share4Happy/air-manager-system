'use client';

import { useState } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import { fmtDate, fmtTime, logRecipients, logContent } from './constants';

export default function SendLogsPopup({
    open,
    onClose,
    items = [],
    loading = false,
}) {
    const [selectedLog, setSelectedLog] = useState(null);

    return (
        <>
            {/* POPUP LỊCH SỬ GỬI TIN */}
            <FlexiblePopup
                open={open}
                onClose={onClose}
                title="Lịch sử gửi tin"
                width="900px"
                renderItemList={() => (
                    <div className="p-4">
                        {loading ? (
                            <p className="text-sm text-[var(--text-secondary)] italic">Đang tải...</p>
                        ) : items.length === 0 ? (
                            <p className="text-sm text-[var(--text-secondary)] italic">Chưa có lịch sử gửi tin.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-max">
                                    <thead>
                                        <tr className="bg-[var(--main_d)] text-white">
                                            <th className="p-2 font-medium text-left">Thời gian</th>
                                            <th className="p-2 font-medium text-left">Zalo gửi</th>
                                            <th className="p-2 font-medium text-left">Người tạo</th>
                                            <th className="p-2 font-medium text-left">Người nhận</th>
                                            <th className="p-2 font-medium text-left">Trạng thái</th>
                                            <th className="p-2 font-medium text-center">Xem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map(l => (
                                            <tr key={l._id} className="border-b border-[var(--border-color)] hover:bg-blue-50 align-top">
                                                <td className="p-2 whitespace-nowrap">{fmtDate(l.createdAt)} {fmtTime(l.createdAt)}</td>
                                                <td className="p-2 whitespace-nowrap">{l.zalo?.name || '—'}</td>
                                                <td className="p-2 whitespace-nowrap">{l.createBy?.name || '—'}</td>
                                                <td className="p-2 text-[var(--text-secondary)]">{logRecipients(l).join(', ') || '—'}</td>
                                                <td className="p-2 whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 rounded text-xs text-white ${l.status?.status ? 'bg-green-600' : 'bg-red-600'}`}>
                                                        {l.status?.status ? 'Thành công' : 'Thất bại'}
                                                    </span>
                                                    <span className="block text-xs text-[var(--text-secondary)] mt-0.5">{l.status?.message}</span>
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button
                                                        onClick={() => setSelectedLog(l)}
                                                        className="px-2 py-1 rounded bg-blue-600 text-white text-xs cursor-pointer border-none hover:bg-blue-700"
                                                    >
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

            {/* POPUP XEM NỘI DUNG TIN ĐÃ GỬI */}
            <FlexiblePopup
                open={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                title="Nội dung tin đã gửi"
                width="640px"
                globalZIndex={1100}
                renderItemList={() => (
                    <div className="flex flex-col gap-3 p-4">
                        <div className="flex items-center gap-4 flex-wrap text-sm">
                            <span className="text-[var(--text-secondary)]">
                                Thời gian: <span className="text-[var(--text-primary)]">{fmtDate(selectedLog?.createdAt)} {fmtTime(selectedLog?.createdAt)}</span>
                            </span>
                            <span className="text-[var(--text-secondary)]">
                                Zalo gửi: <span className="text-[var(--text-primary)]">{selectedLog?.zalo?.name || '—'}</span>
                            </span>
                            <span className="text-[var(--text-secondary)]">
                                Trạng thái: <span className={selectedLog?.status?.status ? 'text-green-600' : 'text-red-600'}>{selectedLog?.status?.status ? 'Thành công' : 'Thất bại'}</span>
                            </span>
                        </div>
                        {logRecipients(selectedLog).length > 0 && (
                            <div className="text-sm">
                                <span className="text-[var(--text-secondary)]">Người nhận: </span>
                                <span className="text-[var(--text-primary)]">{logRecipients(selectedLog).join(', ')}</span>
                            </div>
                        )}
                        {logContent(selectedLog) ? (
                            <pre className="text-sm text-[var(--text-primary)] whitespace-pre-wrap bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-3 max-h-96 overflow-auto">
                                {logContent(selectedLog)}
                            </pre>
                        ) : (
                            <p className="text-sm text-[var(--text-secondary)] italic">Không có nội dung lưu trữ cho lần gửi này.</p>
                        )}
                        <div className="flex justify-end pt-3 border-t border-[var(--border-color)]">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 rounded bg-gray-200 text-sm cursor-pointer border-none hover:bg-gray-300"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                )}
            />
        </>
    );
}
