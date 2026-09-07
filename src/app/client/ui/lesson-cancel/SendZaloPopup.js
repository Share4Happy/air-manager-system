'use client';

import { useState, useEffect } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import VariableChips from './VariableChips';
import { inputCls, labelCls } from './constants';
import { sendCancelNotificationAction, sendTestCareNotificationAction } from '@/app/actions/lessonCancel.actions';

export default function SendZaloPopup({
    open,
    onClose,
    target,
    initialSelectedIds,
    templates = [],
    selectedZalo,
    onSuccess,
    showNoti,
}) {
    const [sendSelectedIds, setSendSelectedIds] = useState([]);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [testPhone, setTestPhone] = useState('');
    const [testOpen, setTestOpen] = useState(false);
    const [sendingTest, setSendingTest] = useState(false);

    useEffect(() => {
        if (!target) return;
        const withPhone = (target.students || []).filter(s => s.Phone);
        if (initialSelectedIds && initialSelectedIds.length > 0) {
            setSendSelectedIds(withPhone.filter(s => initialSelectedIds.includes(s.ID)).map(s => s.ID));
        } else {
            setSendSelectedIds(withPhone.map(s => s.ID));
        }
        setMessage('Kính gửi quý phụ huynh,\nBuổi học hôm nay được thông báo nghỉ. Xin cảm ơn!');
        setTestOpen(false);
        setTestPhone('');
    }, [target, initialSelectedIds]);

    if (!target) return null;

    const withPhone = (target.students || []).filter(s => s.Phone);

    const applyTemplate = (id) => {
        const t = templates.find(x => x._id === id);
        if (t) setMessage(t.content);
    };

    const handleSendTest = async () => {
        if (!testPhone.trim()) {
            showNoti(false, 'Vui lòng nhập số điện thoại nhận tin thử nghiệm.');
            return;
        }
        if (!message.trim()) {
            showNoti(false, 'Vui lòng nhập nội dung tin nhắn.');
            return;
        }
        if (!selectedZalo) {
            showNoti(false, 'Chưa chọn tài khoản Zalo hoạt động. Vào tab Chăm sóc để chọn tài khoản Zalo.');
            return;
        }
        setSendingTest(true);
        try {
            const fd = new FormData();
            fd.append('courseId', target.courseId);
            fd.append('detailId', target.detailId);
            fd.append('message', message);
            fd.append('testPhone', testPhone.trim());
            const res = await sendTestCareNotificationAction(fd);
            showNoti(res.status, res.message);
        } catch (err) {
            console.error(err);
            showNoti(false, err.message || 'Lỗi gửi tin thử nghiệm.');
        } finally {
            setSendingTest(false);
        }
    };

    const handleSend = async () => {
        if (!message.trim()) {
            showNoti(false, 'Vui lòng nhập nội dung tin nhắn.');
            return;
        }
        if (!selectedZalo) {
            showNoti(false, 'Chưa chọn tài khoản Zalo hoạt động. Vào tab Chăm sóc để chọn tài khoản Zalo.');
            return;
        }
        setSending(true);
        try {
            const fd = new FormData();
            fd.append('courseId', target.courseId);
            fd.append('detailId', target.detailId);
            fd.append('message', message);
            sendSelectedIds.forEach(id => fd.append('studentIds', id));
            const res = await sendCancelNotificationAction(fd);
            showNoti(res.status, res.message);
            if (res.status) {
                onClose();
                if (onSuccess) onSuccess();
            }
        } catch (err) {
            console.error(err);
            showNoti(false, err.message || 'Lỗi hệ thống.');
        } finally {
            setSending(false);
        }
    };

    return (
        <FlexiblePopup
            open={open}
            onClose={onClose}
            title={`Gửi Zalo chăm sóc - ${target.courseID}`}
            width="580px"
            renderItemList={() => (
                <div className="flex flex-col gap-3 p-4">
                    <div>
                        <label className={labelCls}>Mẫu tin nhắn</label>
                        <select className={inputCls} defaultValue="" onChange={e => applyTemplate(e.target.value)}>
                            <option value="">Chọn mẫu...</option>
                            {templates.map(t => (
                                <option key={t._id} value={t._id}>{t.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">Quản lý mẫu qua nút "Mẫu tin nhắn" trên thanh công cụ.</p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className={labelCls} style={{ marginBottom: 0 }}>
                                Người nhận ({sendSelectedIds.length}/{withPhone.length})
                            </label>
                            <div className="flex items-center gap-2 text-xs text-[var(--main_d)]">
                                <button
                                    type="button"
                                    onClick={() => setSendSelectedIds(withPhone.map(s => s.ID))}
                                    className="cursor-pointer border-none bg-transparent hover:underline"
                                >
                                    Chọn tất cả
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSendSelectedIds([])}
                                    className="cursor-pointer border-none bg-transparent hover:underline"
                                >
                                    Bỏ chọn
                                </button>
                            </div>
                        </div>
                        <div className="max-h-52 overflow-y-auto border border-gray-200 rounded bg-white">
                            {withPhone.length === 0 ? (
                                <p className="p-3 text-xs italic text-[var(--text-secondary)]">Lớp không có học sinh nào có số điện thoại.</p>
                            ) : (
                                withPhone.map(s => (
                                    <label
                                        key={s.ID}
                                        className="flex items-center gap-2 px-2.5 py-1.5 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-blue-50 text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={sendSelectedIds.includes(s.ID)}
                                            onChange={() =>
                                                setSendSelectedIds(prev =>
                                                    prev.includes(s.ID) ? prev.filter(x => x !== s.ID) : [...prev, s.ID]
                                                )
                                            }
                                            className="cursor-pointer"
                                        />
                                        <span className="text-[var(--text-primary)]">{s.Name}</span>
                                        <span className="text-[var(--text-secondary)] text-xs">({s.Phone})</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Nội dung tin nhắn</label>
                        <textarea
                            rows="6"
                            className={`${inputCls} resize-y`}
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Nhập nội dung tin nhắn..."
                        />
                        <p className="text-xs text-[var(--text-secondary)] mt-1 mb-1">Chèn biến để điền dữ liệu riêng cho từng học sinh:</p>
                        <VariableChips onInsert={tok => setMessage(m => m + tok)} />
                    </div>

                    <p className="text-xs text-[var(--text-secondary)]">
                        Sẽ gửi cho {sendSelectedIds.filter(id => withPhone.some(s => s.ID === id)).length} học sinh được chọn, cách nhau 3–5 phút (giới hạn theo cài đặt gửi tin chung). Nếu đạt giới hạn tin/giờ, số còn lại sẽ vào hàng chờ và gửi tiếp vào giờ sau. Các biến như {'{HoTen}'}, {'{DiemDanh}'}, {'{HinhAnh}'} sẽ được thay bằng dữ liệu riêng của từng học sinh.
                    </p>

                    <div className="flex flex-col gap-2 pt-3 border-t border-[var(--border-color)]">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => setTestOpen(prev => !prev)}
                                className="px-3 py-1.5 rounded border border-gray-300 bg-gray-50 text-gray-700 text-xs font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                                {testOpen ? '▲ Đóng gửi test' : '🧪 Gửi test (thử nghiệm)'}
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={sending || sendSelectedIds.length === 0}
                                className="px-4 py-2 rounded bg-[var(--main_d)] text-white text-sm font-medium cursor-pointer border-none hover:bg-[var(--main_b)] disabled:opacity-50 transition-colors shadow-xs"
                            >
                                {sending ? 'Đang gửi...' : `Gửi thông báo (${sendSelectedIds.length})`}
                            </button>
                        </div>
                        {testOpen && (
                            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-amber-50/80 border border-amber-200 mt-1">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span className="text-xs font-semibold text-amber-800">
                                        Gửi tin thử nghiệm tới số điện thoại:
                                    </span>
                                    {withPhone[0] && (
                                        <span className="text-[11px] text-amber-700">
                                            (Lấy mẫu dữ liệu của: <b>{withPhone[0].Name}</b>)
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="tel"
                                        placeholder="Nhập số điện thoại nhận tin thử (VD: 0912345678)..."
                                        className="flex-1 px-3 py-1.5 border border-amber-300 rounded bg-white text-xs text-gray-800 outline-none focus:border-amber-500"
                                        value={testPhone}
                                        onChange={e => setTestPhone(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSendTest}
                                        disabled={sendingTest || !testPhone.trim()}
                                        className="px-3.5 py-1.5 rounded bg-amber-600 text-white text-xs font-medium cursor-pointer border-none hover:bg-amber-700 disabled:opacity-50 whitespace-nowrap"
                                    >
                                        {sendingTest ? 'Đang gửi test...' : 'Gửi test ngay'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        />
    );
}
