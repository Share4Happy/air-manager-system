'use client';

import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import { fmtDate, fmtTime, careBadge, zaloBadge } from './constants';

export default function HistoryPopup({
    open,
    onClose,
    items = [],
    loading = false,
}) {
    return (
        <FlexiblePopup
            open={open}
            onClose={onClose}
            title="Lịch sử các lớp nghỉ"
            width="820px"
            renderItemList={() => (
                <div className="p-4">
                    {loading ? (
                        <p className="text-sm text-[var(--text-secondary)] italic">Đang tải...</p>
                    ) : items.length === 0 ? (
                        <p className="text-sm text-[var(--text-secondary)] italic">Không có lịch sử lớp nghỉ.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-max">
                                <thead>
                                    <tr className="bg-[var(--main_d)] text-white">
                                        <th className="p-2 font-medium text-left">Lớp</th>
                                        <th className="p-2 font-medium text-left">Ngày nghỉ</th>
                                        <th className="p-2 font-medium text-left">Lý do</th>
                                        <th className="p-2 font-medium text-center">Số học sinh</th>
                                        <th className="p-2 font-medium text-left">Trạng thái</th>
                                        <th className="p-2 font-medium text-left">Zalo</th>
                                        <th className="p-2 font-medium text-left">Xác nhận</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => {
                                        const cfs = item.notify?.confirmations || [];
                                        const lastCf = cfs[cfs.length - 1];
                                        return (
                                            <tr key={item.detailId} className="border-b border-[var(--border-color)] hover:bg-blue-50 align-top">
                                                <td className="p-2 font-medium whitespace-nowrap">{item.courseID}</td>
                                                <td className="p-2 whitespace-nowrap">{fmtDate(item.day)}</td>
                                                <td className="p-2 max-w-[200px] text-[var(--text-secondary)]">{item.reason || '—'}</td>
                                                <td className="p-2 text-center">{item.students.length}</td>
                                                <td className="p-2 whitespace-nowrap">
                                                    {careBadge(item)}
                                                    {item.notify?.pendingQueueCount > 0 && (
                                                        <span className="block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 whitespace-nowrap">
                                                            Hàng chờ: {item.notify.pendingQueueCount} tin{item.notify.queueResumeAt ? ` · ${fmtTime(item.notify.queueResumeAt)}` : ''}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-2 whitespace-nowrap">{zaloBadge(item)}</td>
                                                <td className="p-2 whitespace-nowrap">
                                                    {lastCf
                                                        ? `${lastCf.name || '—'} · ${fmtTime(lastCf.at)} ${fmtDate(lastCf.at)}`
                                                        : <span className="text-[var(--text-secondary)]">—</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        />
    );
}
