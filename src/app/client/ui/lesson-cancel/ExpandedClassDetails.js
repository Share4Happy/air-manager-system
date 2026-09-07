'use client';

import { useState } from 'react';
import Link from 'next/link';
import { srcImage } from '@/function/index';
import { fmtDate, fmtTime, checkinText } from './constants';

export default function ExpandedClassDetails({ item, onRefresh, showNoti, onClose, onSendZalo }) {
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [bulkStatus, setBulkStatus] = useState('done');
    const [bulking, setBulking] = useState(false);

    const toggleSelectStudent = (id) => {
        setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = (checked) => {
        setSelectedStudentIds(checked ? (item.students || []).map(s => s.ID) : []);
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
                    courseId: item.courseId,
                    detailId: item.detailId,
                    studentIds: selectedStudentIds,
                    status: bulkStatus,
                }),
            });
            const json = await res.json();
            showNoti(json.success, json.success ? `Đã cập nhật trạng thái cho ${json.data?.count || selectedStudentIds.length} học sinh.` : (json.error || 'Lỗi hệ thống.'));
            if (json.success) {
                setSelectedStudentIds([]);
                onRefresh();
            }
        } catch (err) {
            console.error(err);
            showNoti(false, err.message || 'Lỗi hệ thống.');
        } finally {
            setBulking(false);
        }
    };

    const toggleStudentCare = async (student, status) => {
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
            if (json.success) {
                onRefresh();
            } else {
                showNoti(false, json.error || 'Lỗi hệ thống.');
            }
        } catch (err) {
            console.error(err);
            showNoti(false, err.message || 'Lỗi hệ thống.');
        }
    };

    const allSelected = (item.students || []).length > 0 && selectedStudentIds.length === (item.students || []).length;

    return (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            {/* Header inside accordion card */}
            <div className="flex justify-between items-center px-3.5 py-2.5 bg-gray-100 border-b border-gray-200 border-l-4 border-[var(--main_d)]">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-800">
                        Danh sách học sinh lớp <span className="text-[var(--main_d)] font-mono font-bold bg-white px-2 py-0.5 rounded border border-gray-200 text-xs">{item.courseID}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-200">
                        {(item.students || []).length} học sinh
                    </span>
                    <span className="text-xs text-gray-500">
                        • {fmtDate(item.day)}{item.reason ? ` (${item.reason})` : ''}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="px-2.5 py-1 rounded bg-white hover:bg-gray-50 border border-gray-300 text-xs font-medium text-gray-700 cursor-pointer transition-colors shadow-2xs"
                >
                    Thu gọn
                </button>
            </div>

            {/* Bulk actions bar */}
            <div className="flex flex-wrap items-center gap-2.5 px-3.5 py-2.5 bg-gray-100 border-b border-gray-200">
                <span className="text-xs text-gray-700">
                    Đã chọn: <strong className="text-[var(--main_d)] font-semibold">{selectedStudentIds.length}</strong>/{(item.students || []).length} học sinh
                </span>
                <div className="h-3.5 w-[1px] bg-gray-300 hidden sm:block"></div>
                <span className="text-xs text-gray-700">Cập nhật trạng thái:</span>
                <select
                    value={bulkStatus}
                    onChange={e => setBulkStatus(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded bg-white text-xs outline-none text-gray-700 cursor-pointer focus:border-[var(--main_d)]"
                >
                    <option value="done">Đã chăm sóc</option>
                    <option value="failed">Liên lạc không được</option>
                    <option value="pending">Chưa</option>
                </select>
                <button
                    type="button"
                    onClick={handleBulkStatus}
                    disabled={bulking || selectedStudentIds.length === 0}
                    className="px-3 py-1 rounded bg-[var(--main_d)] hover:bg-[var(--main_b)] text-white text-xs font-medium cursor-pointer border-none transition-colors shadow-xs disabled:opacity-50"
                >
                    {bulking ? 'Đang cập nhật...' : 'Áp dụng cho học sinh đã chọn'}
                </button>
                {onSendZalo && (
                    <button
                        type="button"
                        onClick={() => onSendZalo(item, selectedStudentIds.length > 0 ? selectedStudentIds : null)}
                        className="px-3 py-1 rounded bg-[var(--main_d)] hover:bg-[var(--main_b)] text-white text-xs font-medium cursor-pointer border-none transition-colors shadow-xs flex items-center gap-1.5"
                        title={selectedStudentIds.length > 0 ? `Gửi Zalo cho ${selectedStudentIds.length} học sinh đã chọn` : 'Gửi Zalo cho lớp này'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={11} height={11} fill="currentColor">
                            <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480l0-83.6c0-4 1.5-7.8 4.2-10.8L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z" />
                        </svg>
                        <span>Gửi Zalo{selectedStudentIds.length > 0 ? ` (${selectedStudentIds.length})` : ''}</span>
                    </button>
                )}
            </div>

            {/* Students table */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left min-w-max">
                    <thead>
                        <tr className="bg-gray-200/90 text-gray-800 font-semibold border-b border-gray-300">
                            <th className="p-2.5 w-8 text-center">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={e => toggleSelectAll(e.target.checked)}
                                    className="cursor-pointer accent-[var(--main_d)]"
                                />
                            </th>
                            <th className="p-2.5 text-left">Tên học sinh</th>
                            <th className="p-2.5 text-left">Phụ huynh</th>
                            <th className="p-2.5 text-left">Số điện thoại</th>
                            <th className="p-2.5 text-center">Điểm danh</th>
                            <th className="p-2.5 text-left">Hình ảnh</th>
                            <th className="p-2.5 text-left">Nhận xét</th>
                            <th className="p-2.5 text-left">Trạng thái chăm sóc</th>
                            <th className="p-2.5 text-left">Zalo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(item.students || []).length === 0 ? (
                            <tr>
                                <td colSpan={9} className="p-4 text-center text-[var(--text-secondary)] italic">
                                    Không có học sinh nào trong lớp.
                                </td>
                            </tr>
                        ) : (
                            item.students.map(s => {
                                const checkin = checkinText(s.checkin);
                                const checkinCls = s.checkin === 1 ? 'text-emerald-600 font-medium' : s.checkin === 2 ? 'text-amber-600 font-medium' : s.checkin === 3 ? 'text-rose-600 font-medium' : 'text-[var(--text-secondary)]';
                                const care = s.notifyStatus || 'pending';
                                const zalo = s.zaloStatus || 'pending';
                                const isSel = selectedStudentIds.includes(s.ID);
                                const zaloBadgeContent = zalo === 'sent'
                                    ? <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">Đã gửi {s.zaloAt ? fmtTime(s.zaloAt) : ''}</span>
                                    : zalo === 'failed'
                                        ? <span className="px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-600">Gửi lỗi</span>
                                        : <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-[var(--text-secondary)]">Chưa gửi</span>;

                                return (
                                    <tr
                                        key={s.ID}
                                        className={`border-b border-[var(--border-color)] hover:bg-[var(--hover)] transition-colors ${
                                            isSel ? 'bg-blue-50/50' : ''
                                        }`}
                                    >
                                        <td className="p-2.5 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isSel}
                                                onChange={() => toggleSelectStudent(s.ID)}
                                                className="cursor-pointer accent-[var(--main_d)]"
                                            />
                                        </td>
                                        <td className="p-2.5 whitespace-nowrap font-medium">
                                            <Link
                                                href={`/${s.ID}`}
                                                className="text-[var(--main_d)] hover:underline font-semibold"
                                            >
                                                {s.Name}
                                            </Link>
                                        </td>
                                        <td className="p-2.5 whitespace-nowrap text-[var(--text-secondary)]">{s.ParentName || '—'}</td>
                                        <td className="p-2.5 whitespace-nowrap font-mono text-xs text-[var(--text-secondary)]">{s.Phone || '—'}</td>
                                        <td className="p-2.5 whitespace-nowrap text-center">
                                            <span className={`text-xs ${checkinCls}`}>{checkin}</span>
                                        </td>
                                        <td className="p-2.5">
                                            {(s.images || []).length ? (
                                                <div className="flex items-center gap-1">
                                                    {s.images.slice(0, 3).map(img => (
                                                        <img
                                                            key={img.id}
                                                            src={srcImage(img.id)}
                                                            alt=""
                                                            className="w-7 h-7 rounded object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                                            title="Xem ảnh"
                                                            onClick={e => { e.stopPropagation(); window.open(srcImage(img.id), '_blank'); }}
                                                        />
                                                    ))}
                                                    {s.images.length > 3 && (
                                                        <span className="text-xs text-[var(--text-secondary)] font-medium">+{s.images.length - 3}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-[var(--text-secondary)]">—</span>
                                            )}
                                        </td>
                                        <td className="p-2.5 max-w-[220px] text-[var(--text-secondary)]">
                                            {s.cmtfn ? <span className="line-clamp-2">{s.cmtfn}</span> : '—'}
                                        </td>
                                        <td className="p-2.5">
                                            <select
                                                value={care}
                                                onChange={e => toggleStudentCare(s, e.target.value)}
                                                className={`px-2 py-1 border rounded text-xs outline-none cursor-pointer font-medium ${
                                                    care === 'done'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                        : care === 'failed'
                                                            ? 'bg-rose-50 text-rose-600 border-rose-300'
                                                            : 'bg-gray-50 text-[var(--text-secondary)] border-gray-300'
                                                }`}
                                                title="Trạng thái chăm sóc"
                                            >
                                                <option value="pending">Chưa</option>
                                                <option value="done">Đã chăm sóc</option>
                                                <option value="failed">Liên lạc không được</option>
                                            </select>
                                        </td>
                                        <td className="p-2.5 whitespace-nowrap">{zaloBadgeContent}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Confirmations footer */}
            <div className="border-t border-[var(--border-color)] px-3.5 py-2.5 flex flex-col gap-1 bg-gray-50/50">
                <span className="text-xs font-semibold text-[var(--text-primary)]">Lịch sử xác nhận:</span>
                {(item.notify?.confirmations || []).length ? (
                    item.notify.confirmations.map((cf, i) => (
                        <span key={i} className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--main_d)]"></span>
                            <strong className="text-[var(--text-primary)] font-medium">{cf.name || '—'}</strong>
                            <span>({cf.action === 'zalo' ? 'gửi Zalo' : 'xác nhận đã thông báo'})</span>
                            <span>lúc {fmtTime(cf.at)} {fmtDate(cf.at)}</span>
                        </span>
                    ))
                ) : (
                    <span className="text-xs italic text-[var(--text-secondary)]">Chưa có ai xác nhận thông báo cho lớp này.</span>
                )}
            </div>
        </div>
    );
}
