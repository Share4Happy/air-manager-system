'use client';
import { useState, useEffect, useCallback } from 'react';
import Noti from '@/components/(features)/(noti)/noti';

export default function MigrationTab() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [logs, setLogs] = useState([]);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
    const [cleanupText, setCleanupText] = useState('');
    const [noti, setNoti] = useState({ open: false, status: false, message: '' });

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/migration/lms');
            const json = await res.json();
            if (json.success) {
                setStats(json.data);
            }
        } catch (err) {
            console.error('Fetch migration stats error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleRunMigration = async (mode) => {
        setRunning(true);
        if (mode === 'execute') setShowConfirm(false);
        if (mode === 'cleanup') {
            setShowCleanupConfirm(false);
            setCleanupText('');
        }
        try {
            const res = await fetch('/api/migration/lms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode })
            });
            const json = await res.json();
            if (json.success) {
                setLogs(json.data.logs || []);
                if (json.data.stats) {
                    setStats(json.data.stats);
                }
                if (mode === 'cleanup') {
                    setNoti({
                        open: true,
                        status: true,
                        message: 'Đã dọn dẹp dữ liệu nhúng cũ thành công! Hệ thống hiện đã chuyển sang mô hình LMS độc lập.'
                    });
                } else {
                    const isDry = json.data.dryRun;
                    setNoti({
                        open: true,
                        status: true,
                        message: isDry
                            ? `Kiểm tra thử (Dry-Run) hoàn tất! Dự kiến: ${json.data.totalSessionsGenerated} buổi học, ${json.data.totalAttendancesGenerated} lượt điểm danh.`
                            : `Chuyển đổi CSDL thành công! Đã đồng bộ ${json.data.totalSessionsGenerated} buổi học và ${json.data.totalAttendancesGenerated} lượt điểm danh.`
                    });
                }
            } else {
                setNoti({
                    open: true,
                    status: false,
                    message: json.error || 'Có lỗi xảy ra trong quá trình chuyển đổi.'
                });
            }
        } catch (err) {
            setNoti({ open: true, status: false, message: 'Lỗi kết nối máy chủ.' });
        } finally {
            setRunning(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12 text-sm text-[var(--text-secondary)]">
                Đang tải dữ liệu đối soát CSDL...
            </div>
        );
    }

    const isCleaned = stats?.status === 'CLEANED_LMS';
    const isSynced = stats?.status === 'SYNCED' || isCleaned;

    return (
        <div className="flex flex-col gap-6 max-w-5xl pb-10">
            {/* Header info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-900">
                <h3 className="font-semibold text-base flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Công cụ Di chuyển Dữ liệu sang Chuẩn LMS (Phương án 2)
                </h3>
                <p className="text-sm mt-1 text-blue-800 leading-relaxed">
                    Công cụ này tách mảng nhúng sâu (<code>Detail</code> và <code>Student.Learn</code>) trong bảng <code>Course</code> thành 2 Collection độc lập: <strong><code>Session</code> (Buổi học)</strong> và <strong><code>Attendance</code> (Điểm danh)</strong>. 
                    Giúp triệt tiêu hoàn toàn tình trạng ghi đè dữ liệu và tăng tốc độ điểm danh lên $O(1)$.
                </p>
            </div>

            {/* Status overview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold">Khóa học hiện có</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{stats?.coursesCount ?? 0} <span className="text-xs font-normal text-gray-500">lớp chính quy</span></p>
                    <p className="text-xs text-gray-500 mt-0.5">+ {stats?.trialCoursesCount ?? 0} lớp học thử</p>
                </div>

                <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold">Buổi học (Sessions)</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold text-blue-600">{stats?.newSchema?.sessionsCount ?? 0}</span>
                        <span className="text-xs text-gray-500">
                            {isCleaned ? 'buổi trong LMS' : `/ ${stats?.oldSchema?.totalSessions ?? 0} buổi`}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {isCleaned ? '✓ Thuần CSDL mới (LMS)' : stats?.newSchema?.sessionsCount === stats?.oldSchema?.totalSessions && stats?.oldSchema?.totalSessions > 0 ? '✓ Đã đồng bộ 100%' : 'Chưa đồng bộ đầy đủ'}
                    </p>
                </div>

                <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold">Bản ghi điểm danh</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold text-emerald-600">{stats?.newSchema?.attendancesCount ?? 0}</span>
                        <span className="text-xs text-gray-500">
                            {isCleaned ? 'lượt trong LMS' : `/ ${stats?.oldSchema?.totalAttendances ?? 0} lượt`}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {isCleaned ? '✓ Thuần CSDL mới (LMS)' : stats?.newSchema?.attendancesCount === stats?.oldSchema?.totalAttendances && stats?.oldSchema?.totalAttendances > 0 ? '✓ Đã đồng bộ 100%' : 'Chưa đồng bộ đầy đủ'}
                    </p>
                </div>

                <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm flex flex-col justify-between">
                    <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold">Trạng thái CSDL</p>
                    <div className="mt-1">
                        {isCleaned ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> ĐÃ DỌN DẸP (THUẦN LMS)
                            </span>
                        ) : isSynced ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span> ĐÃ ĐỒNG BỘ CHUẨN
                            </span>
                        ) : stats?.newSchema?.sessionsCount > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span> ĐỒNG BỘ MỘT PHẦN
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                <span className="w-2 h-2 rounded-full bg-gray-400"></span> CHƯA CHUYỂN ĐỔI
                            </span>
                        )}
                    </div>
                    <button onClick={fetchStats} className="text-xs text-blue-600 hover:underline self-start mt-2 cursor-pointer bg-transparent border-none p-0">
                        ↻ Làm mới số liệu
                    </button>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">1. Thao tác di chuyển dữ liệu (Migration Controls)</h4>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => handleRunMigration('dry-run')}
                        disabled={running}
                        className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-all flex items-center gap-2 cursor-pointer border border-gray-300 disabled:opacity-50"
                    >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        {running ? 'Đang xử lý...' : 'Chạy thử kiểm tra (Dry Run)'}
                    </button>

                    <button
                        onClick={() => setShowConfirm(true)}
                        disabled={running}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all flex items-center gap-2 cursor-pointer border-none shadow-sm disabled:opacity-50"
                    >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {running ? 'Đang chuyển đổi...' : isSynced ? 'Chạy lại đồng bộ CSDL' : 'Bắt đầu chuyển đổi dữ liệu (Execute)'}
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    * Ghi chú: Thao tác sử dụng cơ chế <code>upsert</code> an toàn (idempotent), có thể chạy nhiều lần mà không tạo bản ghi trùng lặp.
                </p>
            </div>

            {/* Danger Zone: Cleanup Legacy Embedded Fields */}
            <div className="bg-red-50/60 border border-red-200 rounded-xl p-5 shadow-sm">
                <h4 className="text-sm font-semibold text-red-800 flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    2. Dọn dẹp CSDL Cũ (Xóa mảng Detail & Student.Learn nhúng sâu)
                </h4>
                <p className="text-xs text-red-700 leading-relaxed mb-4">
                    Sau khi bạn đã sao lưu (Backup) CSDL và xác nhận chuyển đổi thành công sang <strong>Session</strong> và <strong>Attendance</strong>, bạn có thể xóa sạch mảng nhúng <code>Detail</code> và <code>Student.Learn</code> trong bảng <code>Course</code> để giải phóng hoàn toàn dung lượng CSDL.
                </p>
                <button
                    onClick={() => setShowCleanupConfirm(true)}
                    disabled={running || isCleaned}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm transition-all flex items-center gap-2 cursor-pointer border-none shadow-sm disabled:opacity-50"
                >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {isCleaned ? '✓ Đã dọn dẹp dữ liệu cũ' : 'Xóa mảng dữ liệu nhúng cũ ($unset Detail & Learn)'}
                </button>
            </div>

            {/* Live Log Terminal Console */}
            {logs.length > 0 && (
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 shadow-md">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
                        <span className="text-xs font-mono text-gray-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Nhật ký thực thi (Migration Log)
                        </span>
                        <button
                            onClick={() => setLogs([])}
                            className="text-xs text-gray-500 hover:text-gray-300 bg-transparent border-none cursor-pointer"
                        >
                            Xóa log
                        </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto font-mono text-xs text-gray-300 space-y-1">
                        {logs.map((log, idx) => (
                            <div key={idx} className={log.includes('[DRY-RUN]') ? 'text-amber-400' : log.includes('Hoàn tất') || log.includes('thành công') ? 'text-emerald-400 font-bold' : ''}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Confirm Modal for Migration */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận chuyển đổi CSDL</h3>
                        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                            Hệ thống sẽ quét toàn bộ dữ liệu khóa học và trích xuất sang các collection <strong>Session</strong> và <strong>Attendance</strong>.
                            Dữ liệu cũ vẫn được giữ nguyên để đảm bảo an toàn 100%. Bạn có chắc chắn muốn tiến hành?
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium cursor-pointer border-none"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={() => handleRunMigration('execute')}
                                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium cursor-pointer border-none shadow-sm"
                            >
                                Xác nhận chuyển đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Modal for Cleanup */}
            {showCleanupConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 border-2 border-red-500">
                        <h3 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
                            ⚠️ Cảnh báo: Xóa mảng nhúng CSDL cũ
                        </h3>
                        <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                            Thao tác này sẽ xóa vĩnh viễn trường <code>Detail</code> và <code>Student.Learn</code> trong bảng <code>Course</code> để tối ưu dung lượng và chuyển hệ thống sang chạy 100% trên bảng mới.
                        </p>
                        <p className="text-xs text-red-600 font-semibold mb-3">
                            * Hãy chắc chắn bạn đã sao lưu (Backup) CSDL trước khi thực hiện!
                        </p>
                        <div className="mb-4">
                            <label className="text-xs text-gray-600 block mb-1">
                                Nhập <strong>XAC NHAN</strong> vào ô bên dưới để mở khóa nút xóa:
                            </label>
                            <input
                                type="text"
                                value={cleanupText}
                                onChange={(e) => setCleanupText(e.target.value)}
                                placeholder="XAC NHAN"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-red-500"
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => { setShowCleanupConfirm(false); setCleanupText(''); }}
                                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium cursor-pointer border-none"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={() => handleRunMigration('cleanup')}
                                disabled={cleanupText.trim().toUpperCase() !== 'XAC NHAN'}
                                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium cursor-pointer border-none shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Xác nhận xóa vĩnh viễn
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            <Noti
                open={noti.open}
                onClose={() => setNoti(p => ({ ...p, open: false }))}
                status={noti.status}
                mes={noti.message}
                button={
                    <button onClick={() => setNoti(p => ({ ...p, open: false }))} className="px-3 py-2 bg-[var(--main_b)] rounded text-white text-sm font-medium cursor-pointer border-none mt-2">
                        Đóng
                    </button>
                }
            />
        </div>
    );
}
