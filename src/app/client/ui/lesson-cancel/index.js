'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import Noti from '@/components/(features)/(noti)/noti';
import { sendCancelNotificationAction, sendTestCareNotificationAction } from '@/app/actions/lessonCancel.actions';
import { saveCareTemplateAction, deleteCareTemplateAction } from '@/app/actions/careTemplate.actions';
import SettingZalo from '@/app/client/ui/zalo';
import { srcImage } from '@/function/index';
import DateInput from '@/components/(ui)/(input)/DateInput';

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

function logRecipients(l) {
    if (l?._recipientNames?.length) return l._recipientNames;
    if (l?._recipients?.length) return l._recipients;
    const r = l?.status?.data?.recipients;
    return Array.isArray(r) ? r : [];
}

function logContent(l) {
    return l?.status?.data?.message || l?.message || '';
}

function progressBadge(count, total) {
    if (!total) return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-[var(--text-secondary)]">—</span>;
    const full = count >= total;
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${full ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{count}/{total}</span>;
}

function kindBadge(item) {
    if (item.kind === 'today') return <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 whitespace-nowrap">Buổi hôm nay</span>;
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-600 whitespace-nowrap">Lớp nghỉ</span>;
}

function checkinText(code) {
    if (code === 1) return 'Có mặt';
    if (code === 2) return 'Xin nghỉ';
    if (code === 3) return 'Vắng mặt';
    return 'Chưa điểm danh';
}

const SEND_VARIABLES = [
    { key: 'HoTen', label: 'Tên học sinh' },
    { key: 'TenPH', label: 'Tên phụ huynh' },
    { key: 'Lop', label: 'Tên lớp' },
    { key: 'Ngay', label: 'Ngày buổi học' },
    { key: 'GiaoVien', label: 'Giáo viên' },
    { key: 'DiemDanh', label: 'Điểm danh' },
    { key: 'HinhAnh', label: 'Link hình ảnh' },
    { key: 'NhanXetGV', label: 'Nhận xét giáo viên' },
    { key: 'LinkEportfolio', label: 'Link e-portfolio' },
];

function VariableChips({ onInsert }) {
    return (
        <div className="flex flex-wrap gap-1.5 mt-1">
            {SEND_VARIABLES.map(v => (
                <button
                    key={v.key}
                    type="button"
                    onClick={() => onInsert(`{${v.key}}`)}
                    title={v.label}
                    className="px-2 py-0.5 rounded bg-gray-100 border border-gray-300 text-xs font-mono text-[var(--main_d)] cursor-pointer hover:bg-blue-100 hover:border-blue-300">
                    {`{${v.key}}`}
                </button>
            ))}
        </div>
    );
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
    const [selectedDate, setSelectedDate] = useState('');

    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyItems, setHistoryItems] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [sendHistoryOpen, setSendHistoryOpen] = useState(false);
    const [sendHistoryItems, setSendHistoryItems] = useState([]);
    const [sendHistoryLoading, setSendHistoryLoading] = useState(false);
    const [selectedSendLog, setSelectedSendLog] = useState(null);

    const [sendTarget, setSendTarget] = useState(null);
    const [sendSelectedIds, setSendSelectedIds] = useState([]);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [testPhone, setTestPhone] = useState('');
    const [testOpen, setTestOpen] = useState(false);
    const [sendingTest, setSendingTest] = useState(false);

    const [templates, setTemplates] = useState([]);
    const [templateListOpen, setTemplateListOpen] = useState(false);
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
            const qs = history ? 'history=1' : (selectedDate ? `date=${selectedDate}` : '');
            const res = await fetch(`/api/client/lesson-cancel${qs ? '?' + qs : ''}`);
            const json = await res.json();
            setter(json.success ? json.data : []);
        } catch (err) {
            console.error(err);
            setter([]);
        } finally {
            loadSetter(false);
        }
    }, [selectedDate]);

    const fetchTemplates = useCallback(async () => {
        try {
            const res = await fetch('/api/client/lesson-cancel?templates=1');
            const json = await res.json();
            if (json.success) setTemplates(json.data || []);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchSendHistory = useCallback(async () => {
        setSendHistoryLoading(true);
        try {
            const res = await fetch('/api/client/lesson-cancel?logs=1');
            const json = await res.json();
            setSendHistoryItems(json.success ? json.data || [] : []);
        } catch (err) {
            console.error(err);
            setSendHistoryItems([]);
        } finally {
            setSendHistoryLoading(false);
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
        setSendSelectedIds((item.students || []).filter(s => s.Phone).map(s => s.ID));
        setMessage('Kính gửi quý phụ huynh,\nBuổi học hôm nay được thông báo nghỉ. Xin cảm ơn!');
        setTestOpen(false);
        setTestPhone('');
    };

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
            fd.append('courseId', sendTarget.courseId);
            fd.append('detailId', sendTarget.detailId);
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
            fd.append('courseId', sendTarget.courseId);
            fd.append('detailId', sendTarget.detailId);
            fd.append('message', message);
            sendSelectedIds.forEach(id => fd.append('studentIds', id));
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
                    <h5 className="font-semibold text-[var(--text-primary)]">Chăm sóc lớp học</h5>
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            <span>Ngày:</span>
                            <DateInput
                                value={selectedDate}
                                onChange={setSelectedDate}
                                className="px-2 py-1.5 border border-gray-300 rounded bg-white text-sm outline-none text-gray-700 cursor-pointer" />
                        </label>
                        <SettingZalo user={user?.[0]} zalo={zaloData} />
                        <button
                            onClick={() => fetchList(false)}
                            className="px-4 py-2 rounded bg-gray-100 border border-gray-300 text-sm font-medium cursor-pointer transition-colors hover:bg-gray-200">
                            Làm mới
                        </button>
                        <button
                            onClick={() => { fetchTemplates(); setTemplateListOpen(true); }}
                            className="px-4 py-2 rounded bg-[var(--main_d)] text-white text-sm font-medium cursor-pointer transition-colors hover:bg-[var(--main_b)]">
                            Mẫu tin nhắn
                        </button>
                        <button
                            onClick={() => { setHistoryOpen(true); fetchList(true); }}
                            className="px-4 py-2 rounded bg-gray-100 border border-gray-300 text-sm font-medium cursor-pointer transition-colors hover:bg-gray-200">
                            Lịch sử lớp nghỉ
                        </button>
                        <button
                            onClick={() => { setSendHistoryOpen(true); fetchSendHistory(); }}
                            className="px-4 py-2 rounded bg-gray-100 border border-gray-300 text-sm font-medium cursor-pointer transition-colors hover:bg-gray-200">
                            Lịch sử gửi tin
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p className="p-4 text-sm text-[var(--text-secondary)] italic">Đang tải...</p>
                ) : items.length === 0 ? (
                    <p className="p-4 text-sm text-[var(--text-secondary)] italic">
                        {selectedDate
                            ? `Không có buổi học nào báo nghỉ hoặc diễn ra ngày ${fmtDate(selectedDate)}.`
                            : 'Không có buổi học nào hôm nay hoặc lớp nghỉ trong thời gian tới.'}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-max">
                            <thead>
                                <tr className="bg-[var(--main_d)] text-white">
                                    <th className="p-2 font-medium text-left">Lớp</th>
                                    <th className="p-2 font-medium text-left">Khu vực</th>
                                    <th className="p-2 font-medium text-left">Loại</th>
                                    <th className="p-2 font-medium text-left">Ngày</th>
                                    <th className="p-2 font-medium text-left">Lý do</th>
                                    <th className="p-2 font-medium text-left">Giáo viên</th>
                                    <th className="p-2 font-medium text-center">Số học sinh</th>
                                    <th className="p-2 font-medium text-center">Điểm danh</th>
                                    <th className="p-2 font-medium text-center">Hình ảnh</th>
                                    <th className="p-2 font-medium text-center">Nhận xét</th>
                                    <th className="p-2 font-medium text-left">Trạng thái</th>
                                    <th className="p-2 font-medium text-left">Zalo</th>
                                    <th className="p-2 font-medium text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => {
                                    const isSelected = selectedItem?.detailId === item.detailId;
                                    const isToday = item.kind === 'today';
                                    return (
                                        <tr key={item.detailId}
                                            onClick={() => setSelectedItem(prev => prev?.detailId === item.detailId ? null : item)}
                                            className={`border-b border-[var(--border-color)] cursor-pointer align-top ${isSelected ? 'bg-blue-100' : 'hover:bg-blue-50'}`}>
                                            <td className="p-2 font-medium whitespace-nowrap">{item.courseID}</td>
                                            <td className="p-2 whitespace-nowrap text-[var(--text-secondary)]">{item.areaName}</td>
                                            <td className="p-2">{kindBadge(item)}</td>
                                            <td className={`p-2 whitespace-nowrap font-medium ${isToday ? '' : 'text-red-600'}`}>{fmtDate(item.day)}</td>
                                            <td className="p-2 max-w-[200px] text-[var(--text-secondary)]">{isToday ? '—' : (item.reason || '—')}</td>
                                            <td className="p-2 whitespace-nowrap">{item.teacherName || '—'}</td>
                                            <td className="p-2 text-center">{item.students.length}</td>
                                            <td className="p-2 text-center">{isToday ? progressBadge(item.lesson?.rollCallChecked || 0, item.lesson?.enrolled || 0) : '—'}</td>
                                            <td className="p-2 text-center">{isToday ? progressBadge(item.lesson?.withImage || 0, item.lesson?.enrolled || 0) : '—'}</td>
                                            <td className="p-2 text-center">{isToday ? progressBadge(item.lesson?.withComment || 0, item.lesson?.enrolled || 0) : '—'}</td>
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
                                    <th className="p-2 font-medium text-left">Điểm danh</th>
                                    <th className="p-2 font-medium text-left">Hình ảnh</th>
                                    <th className="p-2 font-medium text-left">Nhận xét</th>
                                    <th className="p-2 font-medium text-left">Trạng thái chăm sóc</th>
                                    <th className="p-2 font-medium text-left">Zalo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedItem.students.length === 0 ? (
                                    <tr><td className="p-2 text-sm italic text-[var(--text-secondary)]" colSpan="9">Lớp chưa có học sinh.</td></tr>
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
                                        const checkin = checkinText(s.checkin);
                                        const checkinCls = s.checkin === 1
                                            ? 'text-emerald-700'
                                            : s.checkin === 2 || s.checkin === 3
                                                ? 'text-rose-600'
                                                : 'text-[var(--text-secondary)]';
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
                                                <td className="p-2 whitespace-nowrap">
                                                    <span className={`text-xs font-medium ${checkinCls}`}>{checkin}</span>
                                                </td>
                                                <td className="p-2">
                                                    {(s.images || []).length ? (
                                                        <div className="flex items-center gap-1">
                                                            {s.images.slice(0, 3).map(img => (
                                                                <img key={img.id} src={srcImage(img.id)} alt=""
                                                                    className="w-7 h-7 rounded object-cover border border-gray-200 cursor-pointer hover:opacity-80"
                                                                    title="Xem ảnh"
                                                                    onClick={e => { e.stopPropagation(); window.open(srcImage(img.id), '_blank'); }} />
                                                            ))}
                                                            {s.images.length > 3 && (
                                                                <span className="text-xs text-[var(--text-secondary)]">+{s.images.length - 3}</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-[var(--text-secondary)]">—</span>
                                                    )}
                                                </td>
                                                <td className="p-2 max-w-[220px] text-[var(--text-secondary)]">
                                                    {s.cmtfn ? <span className="line-clamp-2">{s.cmtfn}</span> : '—'}
                                                </td>
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
                title={sendTarget ? `Gửi Zalo chăm sóc - ${sendTarget.courseID}` : ''}
                width="580px"
                renderItemList={() => {
                    const withPhone = (sendTarget?.students || []).filter(s => s.Phone);
                    return (
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
                                <label className={labelCls} style={{ marginBottom: 0 }}>Người nhận ({sendSelectedIds.length}/{withPhone.length})</label>
                                <div className="flex items-center gap-2 text-xs text-[var(--main_d)]">
                                    <button type="button" onClick={() => setSendSelectedIds(withPhone.map(s => s.ID))}
                                        className="cursor-pointer border-none bg-transparent hover:underline">
                                        Chọn tất cả
                                    </button>
                                    <button type="button" onClick={() => setSendSelectedIds([])}
                                        className="cursor-pointer border-none bg-transparent hover:underline">
                                        Bỏ chọn
                                    </button>
                                </div>
                            </div>
                            <div className="max-h-52 overflow-y-auto border border-gray-200 rounded bg-white">
                                {withPhone.length === 0 ? (
                                    <p className="p-3 text-xs italic text-[var(--text-secondary)]">Lớp không có học sinh nào có số điện thoại.</p>
                                ) : (
                                    withPhone.map(s => (
                                        <label key={s.ID} className="flex items-center gap-2 px-2.5 py-1.5 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-blue-50 text-sm">
                                            <input type="checkbox" checked={sendSelectedIds.includes(s.ID)}
                                                onChange={() => setSendSelectedIds(prev => prev.includes(s.ID) ? prev.filter(x => x !== s.ID) : [...prev, s.ID])}
                                                className="cursor-pointer" />
                                            <span className="text-[var(--text-primary)]">{s.Name}</span>
                                            <span className="text-[var(--text-secondary)] text-xs">({s.Phone})</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Nội dung tin nhắn</label>
                            <textarea rows="6" className={`${inputCls} resize-y`} value={message} onChange={e => setMessage(e.target.value)}
                                placeholder="Nhập nội dung tin nhắn..." />
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
                                <button onClick={handleSend} disabled={sending || sendSelectedIds.length === 0}
                                    className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium cursor-pointer border-none hover:bg-blue-700 disabled:opacity-50">
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
                    );
                }}
            />

            {/* POPUP DANH SÁCH MẪU TIN NHẮN */}
            <FlexiblePopup
                open={templateListOpen}
                onClose={() => setTemplateListOpen(false)}
                title="Mẫu tin nhắn"
                width="820px"
                renderItemList={() => (
                    <div className="flex flex-col gap-3 p-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="text-xs text-[var(--text-secondary)]">Chọn mẫu để sử dụng / sửa, hoặc tạo mẫu mới.</p>
                            <button onClick={() => { setTemplateForm({ _id: '', name: '', content: '', messageType: 'notice' }); setTemplateListOpen(false); setTemplatePopupOpen(true); }}
                                className="px-4 py-2 rounded bg-[var(--main_d)] text-white text-sm font-medium cursor-pointer transition-colors hover:bg-[var(--main_b)]">
                                + Tạo mẫu
                            </button>
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
                                                <td className="p-2 text-xs text-[var(--text-secondary)] whitespace-pre-wrap line-clamp-2 max-w-md">{t.content}</td>
                                                <td className="p-2">
                                                    <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                                                        <button onClick={() => { setMessage(t.content); setTemplateListOpen(false); }}
                                                            className="px-2 py-1 rounded bg-blue-600 text-white text-xs cursor-pointer border-none hover:bg-blue-700">
                                                            Dùng
                                                        </button>
                                                        <button onClick={() => { setTemplateForm({ _id: t._id, name: t.name, content: t.content, messageType: t.messageType || 'notice' }); setTemplateListOpen(false); setTemplatePopupOpen(true); }}
                                                            className="px-2 py-1 rounded bg-gray-200 text-xs cursor-pointer border-none hover:bg-gray-300">
                                                            Sửa
                                                        </button>
                                                        <button onClick={() => handleDeleteTemplate(t._id)}
                                                            className="px-2 py-1 rounded bg-red-600 text-white text-xs cursor-pointer border-none hover:bg-red-700">
                                                            Xóa
                                                        </button>
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
                            <p className="text-xs text-[var(--text-secondary)] mt-1 mb-1">Chèn biến động — sẽ được thay bằng dữ liệu riêng của từng học sinh khi gửi:</p>
                            <VariableChips onInsert={tok => setTemplateForm(t => ({ ...t, content: (t.content || '') + tok }))} />
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
                            Xác nhận đã thông báo buổi {notifyTarget?.kind === 'today' ? '' : 'nghỉ '}
                            <span className="text-[var(--text-primary)] font-medium">{fmtDate(notifyTarget?.day)}</span> của lớp{' '}
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
                                            <td className="p-2 whitespace-nowrap">{careBadge(item)}
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

            {/* POPUP LỊCH SỬ GỬI TIN */}
            <FlexiblePopup
                open={sendHistoryOpen}
                onClose={() => setSendHistoryOpen(false)}
                title="Lịch sử gửi tin"
                width="900px"
                renderItemList={() => (
                    <div className="p-4">
                        {sendHistoryLoading ? (
                            <p className="text-sm text-[var(--text-secondary)] italic">Đang tải...</p>
                        ) : sendHistoryItems.length === 0 ? (
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
                                        {sendHistoryItems.map(l => (
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
                                                    <button onClick={() => setSelectedSendLog(l)}
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

            {/* POPUP XEM NỘI DUNG TIN ĐÃ GỬI */}
            <FlexiblePopup
                open={!!selectedSendLog}
                onClose={() => setSelectedSendLog(null)}
                title="Nội dung tin đã gửi"
                width="640px"
                renderItemList={() => (
                    <div className="flex flex-col gap-3 p-4">
                        <div className="flex items-center gap-4 flex-wrap text-sm">
                            <span className="text-[var(--text-secondary)]">Thời gian: <span className="text-[var(--text-primary)]">{fmtDate(selectedSendLog?.createdAt)} {fmtTime(selectedSendLog?.createdAt)}</span></span>
                            <span className="text-[var(--text-secondary)]">Zalo gửi: <span className="text-[var(--text-primary)]">{selectedSendLog?.zalo?.name || '—'}</span></span>
                            <span className="text-[var(--text-secondary)]">Trạng thái: <span className={selectedSendLog?.status?.status ? 'text-green-600' : 'text-red-600'}>{selectedSendLog?.status?.status ? 'Thành công' : 'Thất bại'}</span></span>
                        </div>
                        {logRecipients(selectedSendLog).length > 0 && (
                            <div className="text-sm">
                                <span className="text-[var(--text-secondary)]">Người nhận: </span>
                                <span className="text-[var(--text-primary)]">{logRecipients(selectedSendLog).join(', ')}</span>
                            </div>
                        )}
                        {logContent(selectedSendLog) ? (
                            <pre className="text-sm text-[var(--text-primary)] whitespace-pre-wrap bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-3 max-h-96 overflow-auto">{logContent(selectedSendLog)}</pre>
                        ) : (
                            <p className="text-sm text-[var(--text-secondary)] italic">Không có nội dung lưu trữ cho lần gửi này.</p>
                        )}
                        <div className="flex justify-end pt-3 border-t border-[var(--border-color)]">
                            <button onClick={() => setSelectedSendLog(null)}
                                className="px-4 py-2 rounded bg-gray-200 text-sm cursor-pointer border-none hover:bg-gray-300">
                                Đóng
                            </button>
                        </div>
                    </div>
                )}
            />
        </div>
    );
}
