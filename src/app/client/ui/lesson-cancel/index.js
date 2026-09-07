'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import Link from 'next/link';
import Noti from '@/components/(features)/(noti)/noti';
import DateInput from '@/components/(ui)/(input)/DateInput';
import SettingZalo from '@/app/client/ui/zalo';
import { fmtDate, progressBadge, kindBadge, careBadge, zaloBadge } from './constants';
import ExpandedClassDetails from './ExpandedClassDetails';
import SendZaloPopup from './SendZaloPopup';
import TemplatesPopup from './TemplatesPopup';
import NotifyConfirmPopup from './NotifyConfirmPopup';
import HistoryPopup from './HistoryPopup';
import SendLogsPopup from './SendLogsPopup';

export default function LessonCancelTab({ user = [], users = [], zaloData = [] }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [noti, setNoti] = useState({ open: false, status: true, mes: '' });
    const [expandedIds, setExpandedIds] = useState({});
    const [selectedDate, setSelectedDate] = useState('');

    // Popups states
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyItems, setHistoryItems] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [sendHistoryOpen, setSendHistoryOpen] = useState(false);
    const [sendHistoryItems, setSendHistoryItems] = useState([]);
    const [sendHistoryLoading, setSendHistoryLoading] = useState(false);

    const [sendTarget, setSendTarget] = useState(null);
    const [sendInitialIds, setSendInitialIds] = useState(null);

    const [templates, setTemplates] = useState([]);
    const [templateListOpen, setTemplateListOpen] = useState(false);

    const [notifyTarget, setNotifyTarget] = useState(null);

    const selectedZalo = user?.[0]?.zalo?.name || '';
    const showNoti = useCallback((status, mes) => setNoti({ open: true, status, mes }), []);

    const fetchList = useCallback(async (history = false) => {
        const setter = history ? setHistoryItems : setItems;
        const loadSetter = history ? setHistoryLoading : setLoading;
        loadSetter(true);
        try {
            const params = new URLSearchParams();
            if (history) params.set('history', '1');
            if (selectedDate) params.set('date', selectedDate);
            params.set('_t', Date.now().toString());
            const res = await fetch(`/api/client/lesson-cancel?${params.toString()}`, {
                cache: 'no-store',
            });
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

    const toggleExpand = (id) => {
        setExpandedIds(prev => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const isAllExpanded = items.length > 0 && items.every(it => expandedIds[it.detailId]);

    const toggleExpandAll = () => {
        if (isAllExpanded) {
            setExpandedIds({});
        } else {
            const all = {};
            items.forEach(it => { all[it.detailId] = true; });
            setExpandedIds(all);
        }
    };

    const openSend = (item, customStudentIds = null) => {
        setSendTarget(item);
        setSendInitialIds(customStudentIds);
    };

    return (
        <div className="flex flex-col gap-3">
            <Noti open={noti.open} onClose={() => setNoti(p => ({ ...p, open: false }))} status={noti.status} mes={noti.mes} />

            <div className="bg-[var(--bg-primary)] rounded-md border border-[var(--border-color)]">
                {/* Header Toolbar */}
                <div className="flex justify-between items-center p-3 border-b border-[var(--border-color)] flex-wrap gap-2">
                    <h5 className="font-semibold text-[var(--text-primary)]">Chăm sóc lớp học</h5>
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            <span>Ngày:</span>
                            <DateInput
                                value={selectedDate}
                                onChange={setSelectedDate}
                                className="px-2 py-1.5 border border-gray-300 rounded bg-white text-sm outline-none text-gray-700 cursor-pointer"
                            />
                        </label>
                        <SettingZalo user={user?.[0]} zalo={zaloData} />
                        {items.length > 0 && (
                            <button
                                onClick={toggleExpandAll}
                                className="px-3 py-1.5 rounded border border-gray-300 bg-[var(--bg-primary)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--main_d)] hover:bg-[var(--hover)] transition-colors flex items-center gap-1.5 cursor-pointer"
                                title={isAllExpanded ? 'Thu gọn tất cả lớp' : 'Mở tất cả lớp'}
                            >
                                <svg
                                    className={`transition-transform duration-150 ${isAllExpanded ? 'rotate-180' : ''}`}
                                    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={10} height={10} fill="currentColor"
                                >
                                    <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z" />
                                </svg>
                                <span>{isAllExpanded ? 'Thu gọn tất cả' : 'Mở tất cả'}</span>
                            </button>
                        )}
                        <button
                            onClick={() => fetchList(false)}
                            className="px-3.5 py-1.5 rounded bg-gray-100 border border-gray-300 text-xs font-medium text-[var(--text-primary)] cursor-pointer transition-colors hover:bg-gray-200"
                        >
                            Làm mới
                        </button>
                        <button
                            onClick={() => { fetchTemplates(); setTemplateListOpen(true); }}
                            className="px-3.5 py-1.5 rounded bg-[var(--main_d)] text-white text-xs font-medium cursor-pointer transition-colors hover:bg-[var(--main_b)] shadow-xs"
                        >
                            Mẫu tin nhắn
                        </button>
                        <button
                            onClick={() => { setHistoryOpen(true); fetchList(true); }}
                            className="px-3.5 py-1.5 rounded bg-gray-100 border border-gray-300 text-xs font-medium text-[var(--text-primary)] cursor-pointer transition-colors hover:bg-gray-200"
                        >
                            Lịch sử lớp nghỉ
                        </button>
                        <button
                            onClick={() => { setSendHistoryOpen(true); fetchSendHistory(); }}
                            className="px-3.5 py-1.5 rounded bg-gray-100 border border-gray-300 text-xs font-medium text-[var(--text-primary)] cursor-pointer transition-colors hover:bg-gray-200"
                        >
                            Lịch sử gửi tin
                        </button>
                    </div>
                </div>

                {/* Content Table */}
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
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-[var(--main_d)] text-white">
                                    <th className="p-2.5 font-medium text-left">Lớp</th>
                                    <th className="p-2.5 font-medium text-left">Khu vực</th>
                                    <th className="p-2.5 font-medium text-left">Loại</th>
                                    <th className="p-2.5 font-medium text-left">Ngày</th>
                                    <th className="p-2.5 font-medium text-left">Lý do</th>
                                    <th className="p-2.5 font-medium text-left">Giáo viên</th>
                                    <th className="p-2.5 font-medium text-center">Điểm danh</th>
                                    <th className="p-2.5 font-medium text-center">Hình ảnh</th>
                                    <th className="p-2.5 font-medium text-center">Nhận xét</th>
                                    <th className="p-2.5 font-medium text-left">Trạng thái</th>
                                    <th className="p-2.5 font-medium text-left">Zalo</th>
                                    <th className="p-2.5 font-medium text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => {
                                    const isOpen = !!expandedIds[item.detailId];
                                    const isCancel = item.kind === 'cancel';
                                    const isRegular = !isCancel;
                                    return (
                                        <Fragment key={item.detailId}>
                                            <tr
                                                onClick={() => toggleExpand(item.detailId)}
                                                className={`border-t border-[var(--border-color)] cursor-pointer select-none transition-colors ${
                                                    isOpen ? 'bg-[var(--main_d)]/5 hover:bg-[var(--main_d)]/10 font-medium' : 'hover:bg-[var(--hover)]'
                                                }`}
                                            >
                                                <td className="p-2.5 font-medium whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <svg
                                                            className={`shrink-0 text-[var(--main_d)] transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}
                                                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" height={10} width={10} fill="currentColor"
                                                        >
                                                            <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z" />
                                                        </svg>
                                                        <Link
                                                            href={`/course/${item.courseId || item.courseID}`}
                                                            onClick={e => e.stopPropagation()}
                                                            className="px-2 py-0.5 rounded-md text-xs font-semibold text-[var(--main_d)] bg-[var(--main_d)]/10 hover:bg-[var(--main_d)]/20 transition-colors"
                                                        >
                                                            {item.courseID}
                                                        </Link>
                                                    </div>
                                                </td>
                                                <td className="p-2.5 whitespace-nowrap text-[var(--text-secondary)]">{item.areaName}</td>
                                                <td className="p-2.5">{kindBadge(item)}</td>
                                                <td className={`p-2.5 whitespace-nowrap font-medium ${isCancel ? 'text-rose-600 font-semibold' : ''}`}>{fmtDate(item.day)}</td>
                                                <td className="p-2.5 max-w-[200px] text-[var(--text-secondary)]">{isCancel ? (item.reason || '—') : '—'}</td>
                                                <td className="p-2.5 whitespace-nowrap">{item.teacherName || '—'}</td>
                                                <td className="p-2.5 text-center">{isRegular ? progressBadge(item.lesson?.rollCallChecked || 0, item.lesson?.enrolled || 0) : '—'}</td>
                                                <td className="p-2.5 text-center">{isRegular ? progressBadge(item.lesson?.withImage || 0, item.lesson?.enrolled || 0) : '—'}</td>
                                                <td className="p-2.5 text-center">{isRegular ? progressBadge(item.lesson?.withComment || 0, item.lesson?.enrolled || 0) : '—'}</td>
                                                <td className="p-2.5 whitespace-nowrap">{careBadge(item)}</td>
                                                <td className="p-2.5 whitespace-nowrap">{zaloBadge(item)}</td>
                                                <td className="p-2.5" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                                                        <button
                                                            onClick={() => openSend(item)}
                                                            className="px-2.5 py-1 rounded bg-[var(--main_d)] hover:bg-[var(--main_b)] text-white text-xs font-medium cursor-pointer border-none shadow-xs transition-colors"
                                                        >
                                                            Gửi Zalo
                                                        </button>
                                                        <button
                                                            onClick={() => setNotifyTarget(item)}
                                                            className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-medium cursor-pointer border-none hover:bg-emerald-700 shadow-xs transition-colors"
                                                        >
                                                            Đã thông báo
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isOpen && (
                                                <tr className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/30">
                                                    <td colSpan={12} className="p-3" onClick={e => e.stopPropagation()}>
                                                        <ExpandedClassDetails
                                                            item={item}
                                                            onRefresh={() => fetchList(false)}
                                                            showNoti={showNoti}
                                                            onClose={() => toggleExpand(item.detailId)}
                                                            onSendZalo={openSend}
                                                        />
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* POPUPS & MODALS */}
            <SendZaloPopup
                open={!!sendTarget}
                onClose={() => setSendTarget(null)}
                target={sendTarget}
                initialSelectedIds={sendInitialIds}
                templates={templates}
                selectedZalo={selectedZalo}
                onSuccess={() => fetchList(false)}
                showNoti={showNoti}
            />

            <TemplatesPopup
                listOpen={templateListOpen}
                onCloseList={() => setTemplateListOpen(false)}
                templates={templates}
                onRefreshTemplates={fetchTemplates}
                showNoti={showNoti}
            />

            <NotifyConfirmPopup
                target={notifyTarget}
                onClose={() => setNotifyTarget(null)}
                onSuccess={() => fetchList(false)}
                showNoti={showNoti}
                userName={user?.[0]?.name || '—'}
            />

            <HistoryPopup
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                items={historyItems}
                loading={historyLoading}
            />

            <SendLogsPopup
                open={sendHistoryOpen}
                onClose={() => setSendHistoryOpen(false)}
                items={sendHistoryItems}
                loading={sendHistoryLoading}
            />
        </div>
    );
}
