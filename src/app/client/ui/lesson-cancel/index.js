'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import Noti from '@/components/(features)/(noti)/noti';
import { sendCancelNotificationAction } from '@/app/actions/lessonCancel.actions';
import { saveCareTemplateAction, deleteCareTemplateAction } from '@/app/actions/careTemplate.actions';

const MESSAGE_TYPE_LABELS = {
    notice: 'Thông báo',
    reminder: 'Nhắc nhở',
    celebration: 'Chúc mừng',
    other: 'Khác',
};

function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '—';
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

function fmtTime(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

function progressBadge(count, total) {
    if (!total) return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-[var(--text-secondary)]">—</span>;
    const full = count >= total;
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${full ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{count}/{total}</span>;
}

function careBadge(item) {
    const students = item.students || [];
    const handled = students.filter(s => s.notifyStatus === 'done' || s.notifyStatus === 'failed').length;
    return progressBadge(handled, students.length);
}

function zaloBadge(item) {
    const students = item.students || [];
    const sent = students.filter(s => s.zaloStatus === 'sent').length;
    return progressBadge(sent, students.length);
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded bg-white text-sm outline-none text-gray-700 focus:border-[var(--main_d)]';
const labelCls = 'block text-sm font-medium text-[var(--text-primary)] mb-1';

export default function LessonCancelTab({ user = [], users = [], zaloData = [] }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [noti, setNoti] = useState({ open: false, status: true, mes: '' });
    const [selectedItem, setSelectedItem] = useState(null);

    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyItems, setHistoryItems] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [sendTarget, setSendTarget] = useState(null);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const [templates, setTemplates] = useState([]);
    const [templatePopupOpen, setTemplatePopupOpen] = useState(false);
    const [templateForm, setTemplateForm] = useState({ _id: '', name: '', content: '', messageType: 'notice' });

    const [notifyTarget, setNotifyTarget] = useState(null);
    const [notifying, setNotifying] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [bulkStatus, setBulkStatus] = useState('done');
    const [bulking, setBulking] = useState(false);

    const selectedZalo = user?.[0]?.zalo?.name || '';

    const showNoti = useCallback((status, mes) => setNoti({ open: true, status, mes }), []);

    const fetchList = useCallback(async (history = false) => {
        const setter = history ? setHistoryItems : setItems;
        const loadSetter = history ? setHistoryLoading : setLoading;
        loadSetter(true);
        try {
            const res = await fetch(`/api/client/lesson-cancel${history ? '?history=1' : ''}`);
            const json = await res.json();
            setter(json.success ? json.data : []);
        } catch (err) {
            console.error(err);
            setter([]);
        } finally {
            loadSetter(false);
        }
    }, []);

    const fetchTemplates = useCallback(async () => {
        try {
            const res = await fetch('/api/client/lesson-cancel?templates=1');
            const json = await res.json();
            if (json.success) setTemplates(json.data || []);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchList(false);
        fetchTemplates();
    }, [fetchList, fetchTemplates]);

    useEffect(() => {
        const timer = setInterval(() => {
            fetchList(false);
        }, 5 * 60 * 1000);
        return () => clearInterval(timer);
    }, [fetchList]);

    useEffect(() => {
        if (selectedItem) {
            const cur = items.find(x => x.detailId === selectedItem.detailId);
            setSelectedItem(cur || null);
            setSelectedStudentIds([]);
        }
    }, [items, selectedItem]);

    const openSend = (item) => {
        setSendTarget(item);
        setMessage('Kính gửi quý phụ huynh,\nBuổi học hôm nay được thông báo nghỉ. Xin cảm ơn!');
    };

    const applyTemplate = (id) => {
        const t = templates.find(x => x._id === id);
        if (t) setMessage(t.content);
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
            fd.append('courseId', sendTarget.courseId);
            fd.append('detailId', sendTarget.detailId);
            fd.append('message', message);
            const res = await sendCancelNotificationAction(fd);
            showNoti(res.status, res.message);
            if (res.status) {
                setSendTarget(null);
                fetchList(false);
            }
        } catch (err) {
            console.error(err);
            showNoti(false, err.message || 'Lỗi hệ thống.');
        } finally {
            setSending(false);
        }
    };

    const handleSaveTemplate = async () => {
        const fd = new FormData();
        if (templateForm._id) fd.append('_id', templateForm._id);
        fd.append('name', templateForm.name);
        fd.append('content', templateForm.content);
        fd.append('messageType', templateForm.messageType);
        const res = await saveCareTemplateAction(null, fd);
        showNoti(res.status, res.message);
        if (res.status) {
            setTemplatePopupOpen(false);
            setTemplateForm({ _id: '', name: '', content: '', messageType: 'notice' });
            fetchTemplates();
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (!confirm('Xóa mẫu này?')) return;
        const fd = new FormData();
        fd.append('_id', id);
        const res = await deleteCareTemplateAction(null, fd);
        showNoti(res.status, res.message);
        if (res.status) fetchTemplates();
    };

    const handleBulkStatus = async () => {
        if (!selectedStudentIds.length) {
            showNoti(false, 'Vui lòng chọn ít nhất một học sinh.');
            return;
        }
        setBulking(true);
        try {
            const res = await fetch('/api/client/lesson-cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: selectedItem.courseId,
                    detailId: selectedItem.detailId,
                    studentIds: selectedStudentIds,
                    status: bulkStatus,
                }),
            });
            const json = await res.json();
            showNoti(json.success, json.success ? `Đã cập nhật trạng thái cho ${json.data?.count || selectedStudentIds.length} học sinh.` : (json.error || 'Lỗi hệ thống.'));
            if (json.success) {
                setSelectedStudentIds([]);
                fetchList(false);
            }
        } catch (err) {
            console.error(err);
            showNoti(false, err.message || 'Lỗi hệ thống.');
        } finally {
            setBulking(false);
        }
    };

    const toggleSelectStudent = (id) => {
        setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = (checked) => {
        setSelectedStudentIds(checked ? (selectedItem.students || []).map(s => s.ID) : []);
    };

    const openNotify = (item) => {
        setNotifyTarget(item);
    };

    const toggleStudent = async (item, student, status) => {
        try {
            const res = await fetch('/api/client/lesson-cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: item.courseId,
                    detailId: item.detailId,
                    studentId: student.ID,
                    status,
                }),
            });
            const json = await res.json();
            if (json.success) fetchList(false);
            else showNoti(false, json.error || 'Lỗi hệ thống.');
        } catch (err) {
            console.error(err);
            showNoti(false, err.message || 'Lỗi hệ thống.');
        }
    };

    const handleNotify = async () => {
        setNotifying(true);
        try {
            const res = await fetch('/api/client/lesson-cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId: notifyTarget.courseId, detailId: notifyTarget.detailId, method: 'care' }),
            });
            const json = await res.json();
            showNoti(json.success, json.success ? 'Đã đánh dấu thông báo thành công.' : (json.error || 'Lỗi hệ thống.'));
            if (json.success) {
                setNotifyTarget(null);
                fetchList(false);
            }
        } catch (err) {
            console.error(err);
            showNoti(false, err.message || 'Lỗi hệ thống.');
        } finally {
            setNotifying(false);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <Noti open={noti.open} onClose={() => setNoti(p => ({ ...p, open: false }))} status={noti.status} mes={noti.mes} />

            <div className="bg-[var(--bg-primary)] rounded-md border border-[var(--border-color)]">
                <div className="flex justify-between items-center p-3 border-b border-[var(--border-color)]">
                    <h5 className="font-semibold text-[var(--text-primary)]">Thông báo nghỉ buổi học</h5>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-secondary)]">
                            Zalo gửi: <span className="text-[var(--text-primary)] font-medium">{selectedZalo || 'Chưa chọn'}</span>
                        </span>
                        <button
                            onClick={() => fetchList(false)}
                            className="px-4 py-2 rounded bg-gray-100 border border-gray-300 text-sm font-medium cursor-pointer transition-colors hover:bg-gray-200">
                            Làm mới
                        </button>
                        <button
                            onClick={() => { setTemplateForm({ _id: '', name: '', content: '', messageType: 'notice' }); setTemplatePopupOpen(true); }}
                            className="px-4 py-2 rounded bg-[var(--main_d)] text-white text-sm font-medium cursor-pointer transition-colors hover:bg-[var(--main_b)]">
                            + Tạo mẫu
                        </button>
                        <button
                            onClick={() => { setHistoryOpen(true); fetchList(true); }}
                            className="px-4 py-2 rounded bg-gray-100 border border-gray-300 text-sm font-medium cursor-pointer transition-colors hover:bg-gray-200">
                            Lịch sử lớp nghỉ
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p className="p-4 text-sm text-[var(--text-secondary)] italic">Đang tải...</p>
                ) : items.length === 0 ? (
                    <p className="p-4 text-sm text-[var(--text-secondary)] italic">Không có buổi học nào báo nghỉ từ hôm nay trở đi.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-max">
                            <thead>
                                <tr className="bg-[var(--main_d)] text-white">
                                    <th className="p-2 font-medium text-left">Lớp</th>
                                    <th className="p-2 font-medium text-left">Khu vực</th>
                                    <th className="p-2 font-medium text-left">Ngày nghỉ</th>
                                    <th className="p-2 font-medium text-left">Lý do</th>
                                    <th className="p-2 font-medium text-left">Giáo viên</th>
                                    <th className="p-2 font-medium text-center">Số học sinh</th>
                                    <th className="p-2 font-medium text-left">Trạng thái</th>
                                    <th className="p-2 font-medium text-left">Zalo</th>
                                    <th className="p-2 font-medium text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => {
                                    const isSelected = selectedItem?.detailId === item.detailId;
                                    return (
                                        <tr key={item.detailId}
                                            onClick={() => setSelectedItem(prev => prev?.detailId === item.detailId ? null : item)}
                                            className={`border-b border-[var(--border-color)] cursor-pointer align-top ${isSelected ? 'bg-blue-100' : 'hover:bg-blue-50'}`}>
                                            <td className="p-2 font-medium whitespace-nowrap">{item.courseID}</td>
                                            <td className="p-2 whitespace-nowrap text-[var(--text-secondary)]">{item.areaName}</td>
                                            <td className="p-2 whitespace-nowrap font-medium text-red-600">{fmtDate(item.day)}</td>
                                            <td className="p-2 max-w-[200px] text-[var(--text-secondary)]">{item.reason || '—'}</td>
                                            <td className="p-2 whitespace-nowrap">{item.teacherName || '—'}</td>
                                            <td className="p-2 text-center">{item.students.length}</td>
                                            <td className="p-2 whitespace-nowrap">{careBadge(item)}</td>
                                            <td className="p-2 whitespace-nowrap">{zaloBadge(item)}</td>
                                            <td className="p-2" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                                                    <button onClick={() => openSend(item)}
                                                        className="px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-medium cursor-pointer border-none hover:bg-blue-700">
                                                        Gửi Zalo
                                                    </button>
                                                    <button onClick={() => openNotify(item)}
                                                        className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-medium cursor-pointer border-none hover:bg-emerald-700">
                                                        Đã thông báo
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* BẢNG HỌC SINH CỦA LỚP ĐƯỢC CHỌN */}
            {selectedItem && (
                <div className="bg-[var(--bg-primary)] rounded-md border border-[var(--border-color)]">
                    <div className="flex justify-between items-center p-3 border-b border-[var(--border-color)]">
                        <h5 className="font-semibold text-[var(--text-primary)]">
                            Học sinh lớp {selectedItem.courseID} ({selectedItem.students.length})
                        </h5>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--text-secondary)]">
                                {fmtDate(selectedItem.day)}{selectedItem.reason ? ` · ${selectedItem.reason}` : ''}
                            </span>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="px-3 py-1 rounded bg-gray-200 text-xs font-medium cursor-pointer border-none hover:bg-gray-300">
                                Đóng
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 p-3 border-b border-[var(--border-color)] bg-gray-50">
                        <span className="text-sm text-[var(--text-secondary)]">
                            Đã chọn: <span className="font-semibold text-[var(--main_d)]">{selectedStudentIds.length}</span> học sinh
                        </span>
                        <select
                            value={bulkStatus}
                            onChange={e => setBulkStatus(e.target.value)}
                            className="px-2 py-1.5 border border-gray-300 rounded bg-white text-sm outline-none text-gray-700 cursor-pointer">
                            <option value="done">Đã chăm sóc</option>
                            <option value="failed">Liên lạc không được</option>
                            <option value="pending">Chưa</option>
                        </select>
                        <button
                            onClick={handleBulkStatus}
                            disabled={bulking || selectedStudentIds.length === 0}
                            className="px-3 py-1.5 rounded bg-[var(--main_d)] text-white text-sm font-medium cursor-pointer border-none hover:bg-[var(--main_b)] disabled:opacity-50">
                            {bulking ? 'Đang cập nhật...' : 'Áp dụng cho các học sinh đã chọn'}
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-max">
                            <thead>
                                <tr className="bg-[var(--main_d)] text-white">
                                    <th className="p-2 w-8">
                                        <input type="checkbox"
                                            checked={selectedItem.students.length > 0 && selectedStudentIds.length === selectedItem.students.length}
                                            onChange={e => toggleSelectAll(e.target.checked)}
                                            className="cursor-pointer" />
                                    </th>
                                    <th className="p-2 font-medium text-left">Tên học sinh</th>
                                    <th className="p-2 font-medium text-left">Phụ huynh</th>
                                    <th className="p-2 font-medium text-left">Số điện thoại</th>
                                    <th className="p-2 font-medium text-left">Trạng thái chăm sóc</th>
                                    <th className="p-2 font-medium text-left">Zalo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedItem.students.length === 0 ? (
                                    <tr><td className="p-2 text-sm italic text-[var(--text-secondary)]" colSpan="6">Lớp chưa có học sinh.</td></tr>
                                ) : (
                                    selectedItem.students.map(s => {
                                        const care = s.notifyStatus || 'pending';
                                        const zalo = s.zaloStatus || 'pending';
                                        const isSel = selectedStudentIds.includes(s.ID);
                                        const zaloBadge = zalo === 'sent'
                                            ? <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">Đã gửi {s.zaloAt ? fmtTime(s.zaloAt) : ''}</span>
                                            : zalo === 'failed'
                                                ? <span className="px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-600">Gửi lỗi</span>
                                                : <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-[var(--text-secondary)]">Chưa gửi</span>;
                                        return (
                                            <tr key={s.ID} className={`border-b border-[var(--border-color)] hover:bg-blue-50 ${isSel ? 'bg-blue-50' : ''}`}>
                                                <td className="p-2">
                                                    <input type="checkbox"
                                                        checked={isSel}
                                                        onChange={() => toggleSelectStudent(s.ID)}
                                                        className="cursor-pointer" />
                                                </td>
                                                <td className="p-2 whitespace-nowrap font-medium">{s.Name}</td>
                                                <td className="p-2 whitespace-nowrap">{s.ParentName || '—'}</td>
                                                <td className="p-2 whitespace-nowrap">{s.Phone || '—'}</td>
                                                <td className="p-2">
                                                    <select
                                                        value={care}
                                                        onChange={e => toggleStudent(selectedItem, s, e.target.value)}
                                                        className={`px-2 py-1 border rounded text-xs outline-none cursor-pointer ${
                                                            care === 'done'
                                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                                                : care === 'failed'
                                                                    ? 'bg-rose-100 text-rose-600 border-rose-300'
                                                                    : 'bg-gray-100 text-[var(--text-secondary)] border-gray-300'
                                                        }`}
                                                        title="Trạng thái chăm sóc">
                                                        <option value="pending">Chưa</option>
                                                        <option value="done">Đã chăm sóc</option>
                                                        <option value="failed">Liên lạc không được</option>
                                                    </select>
                                                </td>
                                                <td className="p-2 whitespace-nowrap">{zaloBadge}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="border-t border-[var(--border-color)] p-3 flex flex-col gap-1">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">Lịch sử xác nhận</span>
                        {selectedItem.notify?.confirmations?.length ? (
                            selectedItem.notify.confirmations.map((cf, i) => (
                                <span key={i} className="text-xs text-[var(--text-secondary)]">
                                    • {cf.name || '—'} {cf.action === 'zalo' ? 'đã gửi Zalo' : 'xác nhận đã thông báo'} lúc {fmtTime(cf.at)} {fmtDate(cf.at)}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs italic text-[var(--text-secondary)]">Chưa có ai xác nhận thông báo cho lớp này.</span>
                        )}
                    </div>
                </div>
            )}

            {/* POPUP GỬI ZALO */}
            <FlexiblePopup
                open={!!sendTarget}
                onClose={() => setSendTarget(null)}
                title={sendTarget ? `Gửi thông báo nghỉ - ${sendTarget.courseID}` : ''}
                width="560px"
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
                            <p className="text-xs text-[var(--text-secondary)] mt-1">Tạo mẫu mới bằng nút "+ Tạo mẫu" trên thanh công cụ.</p>
                        </div>
                        <div>
                            <label className={labelCls}>Nội dung tin nhắn</label>
                            <textarea rows="6" className={`${inputCls} resize-y`} value={message} onChange={e => setMessage(e.target.value)}
                                placeholder="Nhập nội dung thông báo nghỉ..." />
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">
                            Sẽ gửi cho {sendTarget?.students?.filter(s => s.Phone).length || 0} học sinh có số điện thoại, cách nhau 3–5 phút (giới hạn theo cài đặt gửi tin chung).
                        </p>
                        <div className="flex justify-end pt-3 border-t border-[var(--border-color)]">
                            <button onClick={handleSend} disabled={sending}
                                className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium cursor-pointer border-none hover:bg-blue-700 disabled:opacity-50">
                                {sending ? 'Đang gửi...' : 'Gửi thông báo'}
                            </button>
                        </div>
                    </div>
                )}
            />

            {/* POPUP TẠO MẪU CHĂM SÓC */}
            <FlexiblePopup
                open={templatePopupOpen}
                onClose={() => setTemplatePopupOpen(false)}
                title={templateForm._id ? 'Cập nhật mẫu tin nhắn' : 'Tạo mẫu tin nhắn'}
                width="520px"
                globalZIndex={1100}
                renderItemList={() => (
                    <div className="flex flex-col gap-3 p-4">
                        <div>
                            <label className={labelCls}>Tên mẫu</label>
                            <input className={inputCls} value={templateForm.name} onChange={e => setTemplateForm(t => ({ ...t, name: e.target.value }))} placeholder="VD: Mẫu thông báo nghỉ buổi học" />
                        </div>
                        <div>
                            <label className={labelCls}>Loại tin nhắn</label>
                            <select className={inputCls} value={templateForm.messageType} onChange={e => setTemplateForm(t => ({ ...t, messageType: e.target.value }))}>
                                {Object.entries(MESSAGE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Nội dung mẫu</label>
                            <textarea rows="5" className={`${inputCls} resize-y`} value={templateForm.content} onChange={e => setTemplateForm(t => ({ ...t, content: e.target.value }))} placeholder="Nội dung tin nhắn..." />
                        </div>
                        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
                            {templateForm._id && (
                                <button type="button" onClick={() => handleDeleteTemplate(templateForm._id)}
                                    className="px-4 py-2 rounded bg-red-600 text-white text-sm cursor-pointer border-none hover:bg-red-700">
                                    Xóa
                                </button>
                            )}
                            <button onClick={handleSaveTemplate}
                                className="px-4 py-2 rounded bg-[var(--main_d)] text-white text-sm font-medium cursor-pointer border-none hover:bg-[var(--main_b)]">
                                Lưu mẫu
                            </button>
                        </div>
                    </div>
                )}
            />

            {/* POPUP ĐÁNH DẤU ĐÃ THÔNG BÁO */}
            <FlexiblePopup
                open={!!notifyTarget}
                onClose={() => setNotifyTarget(null)}
                title={notifyTarget ? `Đã thông báo - ${notifyTarget.courseID}` : ''}
                width="460px"
                renderItemList={() => (
                    <div className="flex flex-col gap-3 p-4">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Xác nhận đã thông báo buổi nghỉ <span className="text-[var(--text-primary)] font-medium">{fmtDate(notifyTarget?.day)}</span> của lớp{' '}
                            <span className="text-[var(--text-primary)] font-medium">{notifyTarget?.courseID}</span> cho phụ huynh.
                        </p>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-[var(--text-secondary)]">
                            Người xác nhận: <span className="text-[var(--text-primary)] font-medium">{user?.[0]?.name || '—'}</span>
                        </div>
                        <div className="flex justify-end pt-3 border-t border-[var(--border-color)]">
                            <button onClick={handleNotify} disabled={notifying}
                                className="px-4 py-2 rounded bg-emerald-600 text-white text-sm font-medium cursor-pointer border-none hover:bg-emerald-700 disabled:opacity-50">
                                {notifying ? 'Đang lưu...' : 'Xác nhận đã thông báo'}
                            </button>
                        </div>
                    </div>
                )}
            />

            {/* POPUP LỊCH SỬ */}
            <FlexiblePopup
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                title="Lịch sử các lớp nghỉ"
                width="820px"
                renderItemList={() => (
                    <div className="p-4">
                        {historyLoading ? (
                            <p className="text-sm text-[var(--text-secondary)] italic">Đang tải...</p>
                        ) : historyItems.length === 0 ? (
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
                                        {historyItems.map(item => {
                                            const cfs = item.notify?.confirmations || [];
                                            const lastCf = cfs[cfs.length - 1];
                                            return (
                                                <tr key={item.detailId} className="border-b border-[var(--border-color)] hover:bg-blue-50 align-top">
                                                    <td className="p-2 font-medium whitespace-nowrap">{item.courseID}</td>
                                                    <td className="p-2 whitespace-nowrap">{fmtDate(item.day)}</td>
                                                    <td className="p-2 max-w-[200px] text-[var(--text-secondary)]">{item.reason || '—'}</td>
                                                    <td className="p-2 text-center">{item.students.length}</td>
                                                    <td className="p-2 whitespace-nowrap">{careBadge(item)}</td>
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
        </div>
    );
}
