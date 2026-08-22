'use client';

import React, { useState, useEffect } from 'react';
import CenterPopup from '@/components/(features)/(popup)/popup_center';

const WEEKDAYS = [
    { value: 1, label: 'Thứ 2' },
    { value: 2, label: 'Thứ 3' },
    { value: 3, label: 'Thứ 4' },
    { value: 4, label: 'Thứ 5' },
    { value: 5, label: 'Thứ 6' },
    { value: 6, label: 'Thứ 7' },
    { value: 7, label: 'Chủ nhật' },
];

function formatDateTime(d) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '—';
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

export default function ScheduleModal({ open, onClose, onSaved }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [config, setConfig] = useState({
        isActive: false,
        frequency: 'daily',
        scanTime: '03:00',
        weekday: 1,
        monthDay: 1,
        areas: [],
        nextRunAt: null,
        lastRunAt: null,
        lastRunStats: null,
    });

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        setError('');
        setSuccessMsg('');
        fetch('/api/drive-storage/schedule')
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setError(data.error);
                } else {
                    const cfg = data.config || {};
                    setConfig({
                        isActive: Boolean(cfg.isActive),
                        frequency: cfg.frequency || 'daily',
                        scanTime: cfg.scanTime || '03:00',
                        weekday: cfg.weekday || 1,
                        monthDay: cfg.monthDay || 1,
                        areas: [],
                        nextRunAt: cfg.nextRunAt || null,
                        lastRunAt: cfg.lastRunAt || null,
                        lastRunStats: cfg.lastRunStats || null,
                    });
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [open]);

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccessMsg('');
        try {
            const res = await fetch('/api/drive-storage/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...config, areas: [] }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                setError(data.error || 'Lưu cấu hình thất bại');
            } else {
                setSuccessMsg('Đã lưu cấu hình lịch quét Drive thành công!');
                if (data.config) {
                    const cfg = data.config;
                    setConfig({
                        isActive: Boolean(cfg.isActive),
                        frequency: cfg.frequency || 'daily',
                        scanTime: cfg.scanTime || '03:00',
                        weekday: cfg.weekday || 1,
                        monthDay: cfg.monthDay || 1,
                        areas: [],
                        nextRunAt: cfg.nextRunAt || null,
                        lastRunAt: cfg.lastRunAt || null,
                        lastRunStats: cfg.lastRunStats || null,
                    });
                }
                if (onSaved) onSaved();
            }
        } catch (err) {
            setError(err.message || 'Lỗi kết nối máy chủ');
        } finally {
            setSaving(false);
        }
    };

    return (
        <CenterPopup open={open} onClose={onClose} title="Cài đặt lịch quét Google Drive tự động" size="md">
            <div className="p-5 flex flex-col gap-4 text-sm max-h-[80vh] overflow-y-auto">
                {loading ? (
                    <div className="py-12 text-center text-gray-500">Đang tải cấu hình...</div>
                ) : (
                    <>
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                                {error}
                            </div>
                        )}
                        {successMsg && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-medium">
                                {successMsg}
                            </div>
                        )}

                        {/* Toggle Kích hoạt */}
                        <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-lg">
                            <div>
                                <p className="font-semibold text-gray-800">Tự động quét định kỳ</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Hệ thống sẽ tự động quét toàn bộ dung lượng file Drive theo lịch
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={config.isActive}
                                    onChange={e => setConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--main_d)]"></div>
                            </label>
                        </div>

                        {/* Tần suất quét */}
                        <div className="flex flex-col gap-2">
                            <label className="font-medium text-gray-700">Tần suất quét:</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'daily', label: 'Hàng ngày', desc: 'Mỗi ngày 1 lần' },
                                    { id: 'weekly', label: 'Hàng tuần', desc: '1 ngày trong tuần' },
                                    { id: 'monthly', label: 'Hàng tháng', desc: '1 ngày trong tháng' },
                                ].map(item => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setConfig(prev => ({ ...prev, frequency: item.id }))}
                                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                                            config.frequency === item.id
                                                ? 'border-[var(--main_d)] bg-blue-50/60 ring-2 ring-[var(--main_d)]/20'
                                                : 'border-gray-200 bg-white hover:bg-gray-50'
                                        }`}
                                    >
                                        <p className={`font-semibold text-xs sm:text-sm ${config.frequency === item.id ? 'text-[var(--main_d)]' : 'text-gray-800'}`}>
                                            {item.label}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Thời gian & Ngày quét */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="font-medium text-gray-700">Giờ quét (Giờ Việt Nam):</label>
                                <input
                                    type="time"
                                    value={config.scanTime}
                                    onChange={e => setConfig(prev => ({ ...prev, scanTime: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:border-[var(--main_d)] text-gray-800 font-medium"
                                />
                                <span className="text-xs text-gray-500">Khuyến nghị nên quét vào ban đêm (02:00 - 05:00)</span>
                            </div>

                            {config.frequency === 'weekly' && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-medium text-gray-700">Thứ trong tuần:</label>
                                    <select
                                        value={config.weekday}
                                        onChange={e => setConfig(prev => ({ ...prev, weekday: Number(e.target.value) }))}
                                        className="px-3 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:border-[var(--main_d)] text-gray-800"
                                    >
                                        {WEEKDAYS.map(w => (
                                            <option key={w.value} value={w.value}>{w.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {config.frequency === 'monthly' && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-medium text-gray-700">Ngày trong tháng:</label>
                                    <select
                                        value={config.monthDay}
                                        onChange={e => setConfig(prev => ({ ...prev, monthDay: Number(e.target.value) }))}
                                        className="px-3 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:border-[var(--main_d)] text-gray-800"
                                    >
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                            <option key={day} value={day}>Ngày {day}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Thông tin trạng thái lần quét */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs flex flex-col gap-1.5">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Lần quét tiếp theo:</span>
                                <span className="font-semibold text-blue-700">
                                    {config.isActive && config.nextRunAt ? formatDateTime(config.nextRunAt) : 'Chưa kích hoạt'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Lần quét gần nhất:</span>
                                <span className="text-gray-700">{formatDateTime(config.lastRunAt)}</span>
                            </div>
                            {config.lastRunStats && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Kết quả lần trước:</span>
                                    <span className={config.lastRunStats.status === 'success' ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                                        {config.lastRunStats.status === 'success'
                                            ? `Thành công (${config.lastRunStats.updatedFiles || 0} file trong ${Math.round((config.lastRunStats.durationMs || 0) / 1000)}s)`
                                            : config.lastRunStats.error || 'Thất bại'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Footer buttons */}
                        <div className="flex justify-end gap-2 border-t pt-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium cursor-pointer border-none"
                            >
                                Đóng
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 rounded-lg bg-[var(--main_d)] hover:opacity-90 text-white text-xs font-medium cursor-pointer border-none disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {saving ? 'Đang lưu...' : 'Lưu cài đặt lịch'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </CenterPopup>
    );
}
