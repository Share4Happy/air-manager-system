'use client';

import { useState, useEffect, useMemo } from 'react';
import ScheduleModal from './ui/schedule-modal';

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function DriveStoragePage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [progress, setProgress] = useState(null);
    const [error, setError] = useState('');
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedArea, setSelectedArea] = useState('ALL');

    const loadData = () => {
        setLoading(true);
        setError('');
        fetch('/api/drive-storage/summary')
            .then(r => r.json())
            .then(d => {
                if (d.error) { setError(d.error); return; }
                setData(d);
            })
            .catch(e => { setError(e.message); })
            .finally(() => setLoading(false));
    };

    useEffect(loadData, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        setProgress({ current: 0, total: 1, label: 'Đang kết nối...' });
        setError('');

        try {
            const res = await fetch('/api/drive-storage/refresh', { method: 'POST' });
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const msg = JSON.parse(line);
                        if (msg.type === 'progress') {
                            setProgress({ current: msg.current, total: msg.total, label: msg.label });
                        } else if (msg.type === 'done') {
                            setData(msg.data);
                            setProgress(null);
                            setRefreshing(false);
                        } else if (msg.type === 'error') {
                            setError(msg.message);
                            setProgress(null);
                            setRefreshing(false);
                        }
                    } catch { }
                }
            }
        } catch (e) {
            setError(e.message);
            setProgress(null);
            setRefreshing(false);
        }
    };

    const areasList = data?.areas || [];
    const coursesList = data?.courses || [];

    const filteredCourses = useMemo(() => {
        return coursesList.filter(c => {
            const matchSearch = !searchTerm || c.name?.toLowerCase().includes(searchTerm.trim().toLowerCase());
            const matchArea = selectedArea === 'ALL'
                ? true
                : selectedArea === 'NONE'
                ? !c.area
                : c.area?._id === selectedArea || c.area?.name === selectedArea;
            return matchSearch && matchArea;
        });
    }, [coursesList, searchTerm, selectedArea]);

    if (loading) return <div className="h-full overflow-auto p-4"><p className="text-gray-400 text-center pt-8">Đang tải...</p></div>;
    if (error) return <div className="h-full overflow-auto p-4"><p className="text-red-500 text-center pt-8">Lỗi: {error}</p></div>;
    if (!data) return null;

    const { summary, updated, lastUpdated } = data;
    const progressPct = progress ? Math.round((progress.current / progress.total) * 100) : 0;

    return (
        <div className="h-full overflow-auto p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Dung lượng Google Drive</h1>
                    <p className="text-sm text-gray-500">
                        Danh sách từ Drive — {coursesList.length} thư mục
                        {lastUpdated && <> · Cập nhật: {new Date(lastUpdated).toLocaleString('vi-VN')}</>}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setShowScheduleModal(true)}
                        className="px-3.5 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 cursor-pointer flex items-center gap-2 transition-all shadow-xs"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={14} height={14} fill="currentColor">
                            <path d="M464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM232 120l0 136c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2 280 120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"/>
                        </svg>
                        <span>Cài đặt lịch quét</span>
                    </button>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="px-4 py-2 bg-[var(--main_d)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 cursor-pointer border-none flex items-center gap-2 shrink-0 transition-all shadow-xs"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={14} height={14} fill="currentColor"
                            className={refreshing ? 'animate-spin' : ''}>
                            <path d="M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160 352 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l111.5 0c0 0 0 0 0 0l.8 0c13.2 0 24-10.8 24-24l0-112c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 35.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1L16 432c0 17.7 14.3 32 32 32s32-14.3 32-32l0-35.1 17.6 17.5c0 0 0 0 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.8c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-.1-.1L125.6 352l34.4 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L48.4 288c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.6 1z"/>
                        </svg>
                        {refreshing ? 'Đang đồng bộ...' : 'Làm mới từ Drive'}
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            {refreshing && progress && (
                <div className="bg-white border rounded-lg p-4 mb-4 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">{progress.label}</p>
                        <p className="text-xs text-gray-400 font-medium">{progressPct}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-[var(--main_d)] h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }} />
                    </div>
                </div>
            )}

            {updated !== undefined && !refreshing && (
                <p className="text-xs text-green-600 mb-3 font-medium">Đã đồng bộ {updated} file từ Google Drive.</p>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div className="bg-white border rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Tổng dung lượng</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{summary ? formatBytes(summary.totalSize) : '0 B'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{summary ? summary.totalFiles.toLocaleString() : 0} file</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Hình ảnh</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{summary ? formatBytes(summary.imageSize) : '0 B'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{summary ? summary.imageFiles.toLocaleString() : 0} file</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Video</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{summary ? formatBytes(summary.videoSize) : '0 B'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{summary ? summary.videoFiles.toLocaleString() : 0} file</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Avatar + Book</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{summary ? formatBytes((summary.avatarSize || 0) + (summary.bookSize || 0)) : '0 B'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{summary ? ((summary.avatarFiles || 0) + (summary.bookFiles || 0)).toLocaleString() : 0} file</p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white border rounded-t-lg p-3 border-b-0 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <input
                            type="text"
                            placeholder="Tìm kiếm mã khóa học..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:border-[var(--main_d)]"
                        />
                        <svg className="absolute left-2.5 top-2.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={12} height={12} fill="currentColor">
                            <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/>
                        </svg>
                    </div>

                    <select
                        value={selectedArea}
                        onChange={e => setSelectedArea(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:border-[var(--main_d)] bg-white font-medium text-gray-700"
                    >
                        <option value="ALL">Tất cả cơ sở ({coursesList.length})</option>
                        {areasList.map(a => (
                            <option key={a._id} value={a._id}>{a.name}</option>
                        ))}
                        <option value="NONE">Chưa phân cơ sở</option>
                    </select>
                </div>

                <div className="text-xs text-gray-500 self-end sm:self-center">
                    Hiển thị <strong>{filteredCourses.length}</strong> / {coursesList.length} thư mục
                </div>
            </div>

            {/* Courses Table */}
            <div className="overflow-x-auto border rounded-b-lg bg-white">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-left">
                            <th className="px-3 py-2.5 border-b font-medium text-gray-600">Mã khóa học</th>
                            <th className="px-3 py-2.5 border-b font-medium text-gray-600">Cơ sở / Khu vực</th>
                            <th className="px-3 py-2.5 border-b font-medium text-gray-600">Hình ảnh</th>
                            <th className="px-3 py-2.5 border-b font-medium text-gray-600">Video</th>
                            <th className="px-3 py-2.5 border-b font-medium text-gray-600">Tổng</th>
                            <th className="px-3 py-2.5 border-b font-medium text-gray-600">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCourses.map((c, idx) => (
                            <tr key={c.driveFolderId || `${c.id || c.name}-${idx}`} className="hover:bg-blue-50/40 border-b transition-colors">
                                <td className="px-3 py-2 font-semibold text-gray-800">{c.name}</td>
                                <td className="px-3 py-2 text-gray-700">
                                    {c.area?.name || <span className="text-xs text-gray-400 italic">—</span>}
                                </td>
                                <td className="px-3 py-2">
                                    <span className="font-medium text-gray-700">{formatBytes(c.imageSize || 0)}</span>
                                    <span className="text-gray-400 ml-1 text-xs">({(c.imageFiles || 0).toLocaleString()} file)</span>
                                </td>
                                <td className="px-3 py-2">
                                    <span className="font-medium text-gray-700">{formatBytes(c.videoSize || 0)}</span>
                                    <span className="text-gray-400 ml-1 text-xs">({(c.videoFiles || 0).toLocaleString()} file)</span>
                                </td>
                                <td className="px-3 py-2">
                                    <span className="font-semibold text-gray-900">{formatBytes(c.totalSize || 0)}</span>
                                    <span className="text-gray-400 ml-1 text-xs">({(c.totalFiles || 0).toLocaleString()} file)</span>
                                </td>
                                <td className="px-3 py-2">
                                    {c.inMongo ? (
                                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={12} height={12} fill="currentColor">
                                                <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"/>
                                            </svg>
                                            Đã đồng bộ
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Chưa có dữ liệu</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredCourses.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-3 py-8 text-center text-gray-400 italic">
                                    Không tìm thấy thư mục phù hợp với bộ lọc.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Schedule Modal */}
            <ScheduleModal
                open={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                onSaved={loadData}
            />
        </div>
    );
}
