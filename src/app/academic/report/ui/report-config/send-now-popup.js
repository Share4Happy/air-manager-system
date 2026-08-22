'use client'

import FlexiblePopup from '@/components/(features)/(popup)/popup_right'

export default function SendNowPopup({
    open,
    onClose,
    sendNowPrep,
    sendStep,
    sendProgress,
    sendResults,
    sendBlocked,
    onStartSend,
}) {
    return (
        <FlexiblePopup
            open={open}
            onClose={onClose}
            title="Gửi báo cáo ngay"
            width="720px"
            renderItemList={() => (
                <div className="flex flex-col gap-3 p-4">
                    {sendNowPrep.loading ? (
                        <p className="text-sm text-[var(--text-secondary)] italic">Đang chuẩn bị tin gửi...</p>
                    ) : sendNowPrep.error ? (
                        <>
                            <p className="text-sm text-red-600">{sendNowPrep.error}</p>
                            <div className="flex justify-end pt-3 border-t border-[var(--border-color)]">
                                <button onClick={onClose}
                                    className="px-4 py-2 rounded bg-gray-200 text-sm cursor-pointer border-none hover:bg-gray-300">
                                    Đóng
                                </button>
                            </div>
                        </>
                    ) : sendNowPrep.data ? (
                        <>
                            <div className="flex items-center gap-4 flex-wrap text-sm">
                                <span className="text-[var(--text-secondary)]">Zalo gửi: <span className="text-[var(--text-primary)]">{sendNowPrep.data.zaloName || '—'}</span></span>
                                <span className="text-[var(--text-secondary)]">Số người nhận: <span className="text-[var(--text-primary)] font-medium">{sendNowPrep.data.targets.length}</span></span>
                            </div>

                            {sendStep === 'confirm' && (
                                <>
                                    <div>
                                        <div className="text-sm text-[var(--text-secondary)] mb-1.5">Danh sách người nhận:</div>
                                        <div className="overflow-x-auto max-h-56 overflow-y-auto border border-[var(--border-color)] rounded-lg">
                                            <table className="w-full text-sm min-w-max">
                                                <thead className="sticky top-0">
                                                    <tr className="bg-[var(--main_d)] text-white">
                                                        <th className="p-2 font-medium text-left">Họ tên</th>
                                                        <th className="p-2 font-medium text-left">SĐT</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sendNowPrep.data.targets.map((t, i) => (
                                                        <tr key={i} className="border-b border-[var(--border-color)]">
                                                            <td className="p-2">{t.name || '—'}</td>
                                                            <td className="p-2">{t.phone}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    {sendNowPrep.data.text ? (
                                        <pre className="text-sm text-[var(--text-primary)] whitespace-pre-wrap bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-3 max-h-56 overflow-auto">{sendNowPrep.data.text}</pre>
                                    ) : (
                                        <p className="text-sm text-[var(--text-secondary)] italic">Không có nội dung tin.</p>
                                    )}
                                    <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
                                        <button onClick={onClose}
                                            className="px-4 py-2 rounded bg-gray-200 text-sm cursor-pointer border-none hover:bg-gray-300">
                                            Hủy
                                        </button>
                                        <button onClick={onStartSend}
                                            className="px-4 py-2 rounded bg-blue-600 text-white text-sm cursor-pointer border-none hover:bg-blue-700">
                                            Tiến hành gửi
                                        </button>
                                    </div>
                                </>
                            )}

                            {(sendStep === 'sending' || sendStep === 'done') && (
                                <>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-[var(--text-primary)] font-medium">
                                            {sendStep === 'sending'
                                                ? `Đang gửi: ${sendProgress.current}/${sendProgress.total}`
                                                : `Đã gửi xong: ${sendProgress.current}/${sendProgress.total}`}
                                        </span>
                                        {sendBlocked && (
                                            <span className="text-sm text-amber-600">Đạt giới hạn tin/giờ, dừng gửi.</span>
                                        )}
                                    </div>
                                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 transition-all duration-300"
                                            style={{ width: `${sendProgress.total > 0 ? Math.round((sendProgress.current / sendProgress.total) * 100) : 0}%` }} />
                                    </div>
                                    {sendStep === 'done' && (
                                        <div className="flex items-center gap-3 text-sm flex-wrap">
                                            <span className="px-2 py-1 rounded text-xs text-white bg-green-600">Thành công: {sendResults.filter(r => r.ok).length}</span>
                                            <span className="px-2 py-1 rounded text-xs text-white bg-red-600">Thất bại: {sendResults.filter(r => r.ok === false && !sendBlocked).length}</span>
                                            {sendBlocked && <span className="px-2 py-1 rounded text-xs text-white bg-amber-500">Chưa gửi: {sendResults.filter(r => r.state === 'pending').length}</span>}
                                        </div>
                                    )}
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
                                                {sendResults.map((r, i) => (
                                                    <tr key={i} className="border-b border-[var(--border-color)] align-top">
                                                        <td className="p-2">{r.name || '—'}</td>
                                                        <td className="p-2">{r.phone}</td>
                                                        <td className="p-2">
                                                            {r.state === 'sending' ? (
                                                                <span className="text-xs text-blue-600">Đang gửi...</span>
                                                            ) : r.state === 'pending' ? (
                                                                <span className="text-xs text-[var(--text-secondary)]">Chờ gửi</span>
                                                            ) : r.ok ? (
                                                                <span className="px-2 py-0.5 rounded text-xs text-white bg-green-600">Thành công</span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded text-xs text-white bg-red-600">Thất bại</span>
                                                            )}
                                                        </td>
                                                        <td className="p-2 text-xs text-[var(--text-secondary)]">{r.message || '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {sendStep === 'done' && (
                                        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
                                            <button onClick={onClose}
                                                className="px-4 py-2 rounded bg-gray-200 text-sm cursor-pointer border-none hover:bg-gray-300">
                                                Đóng
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    ) : null}
                </div>
            )}
        />
    )
}
