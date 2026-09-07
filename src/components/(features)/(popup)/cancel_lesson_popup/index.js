'use client';

import React, { useState } from 'react';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import { formatDate } from '@/function';

const COMMON_REASONS = [
    'Nghỉ lễ / Tết theo lịch',
    'Giáo viên bận việc đột xuất',
    'Thời tiết xấu / Bão',
    'Lớp có việc đột xuất',
    'Bảo trì cơ sở vật chất',
];

export default function CancelLessonPopup({
    open,
    onClose,
    courseId,
    lessonId,
    lessonData,
    courseData,
    onSuccess,
    showNoti,
}) {
    const [cancelType, setCancelType] = useState('class'); // 'class' | 'teacher'
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const lessonName = lessonData?.LessonDetails?.Name || (typeof lessonData?.Topic === 'object' ? lessonData?.Topic?.Name : lessonData?.Topic) || (typeof lessonData?.topic === 'object' ? lessonData?.topic?.Name : lessonData?.topic) || 'Buổi học';
    const rawLessonDay = lessonData?.Day || lessonData?.day || null;
    const lessonDate = rawLessonDay ? formatDate(rawLessonDay) : '—';
    const teacherName = lessonData?.Teacher?.name || courseData?.TeacherHR?.name || 'Chưa phân công';
    const isAlreadyCancelled = (lessonData?.Type === 'Báo nghỉ' || lessonData?.type === 'Báo nghỉ');

    const isPastLesson = React.useMemo(() => {
        if (!rawLessonDay) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lDate = new Date(rawLessonDay);
        lDate.setHours(0, 0, 0, 0);
        return lDate < today;
    }, [rawLessonDay]);

    const getDayVal = d => d?.day || d?.Day || null;
    const getTimeVal = d => d?.time || d?.Time || '08:00';

    const estimatedMakeup = React.useMemo(() => {
        if (!courseData?.Detail || courseData.Detail.length === 0) return null;
        const details = courseData.Detail.filter(d => getDayVal(d) && !isNaN(new Date(getDayVal(d)).getTime()));
        if (details.length === 0) return null;

        const sorted = [...details].sort((a, b) => new Date(getDayVal(a)) - new Date(getDayVal(b)));
        const lastDetail = sorted[sorted.length - 1];
        const lastDate = new Date(getDayVal(lastDetail));

        const dayOfWeekConfigs = new Map();
        for (const d of sorted) {
            const dObj = new Date(getDayVal(d));
            const dow = dObj.getDay();
            dayOfWeekConfigs.set(dow, {
                time: getTimeVal(d) || getTimeVal(lastDetail) || '08:00',
            });
        }

        const candidate = new Date(lastDate);
        candidate.setDate(candidate.getDate() + 1);

        const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

        for (let i = 0; i < 7; i++) {
            const dow = candidate.getDay();
            if (dayOfWeekConfigs.has(dow)) {
                const config = dayOfWeekConfigs.get(dow);
                return {
                    dateStr: `${dayNames[dow]}, ${formatDate(candidate)}`,
                    timeStr: config.time || '08:00',
                };
            }
            candidate.setDate(candidate.getDate() + 1);
        }

        const fallback = new Date(lastDate);
        fallback.setDate(fallback.getDate() + 7);
        return {
            dateStr: `${dayNames[fallback.getDay()]}, ${formatDate(fallback)}`,
            timeStr: getTimeVal(lastDetail) || '08:00',
        };
    }, [courseData?.Detail]);

    const handleConfirm = async () => {
        if (isPastLesson) {
            if (showNoti) showNoti(false, 'Không thể báo nghỉ vì buổi học này đã diễn ra trong quá khứ.');
            return;
        }
        if (isAlreadyCancelled) {
            if (showNoti) showNoti(false, 'Buổi học này đã được báo nghỉ trước đó.');
            return;
        }
        if (!reason.trim()) {
            if (showNoti) showNoti(false, 'Vui lòng nhập hoặc chọn lý do báo nghỉ.');
            return;
        }

        const targetLessonId = lessonId || lessonData?._id;
        const targetCourseId = courseId || courseData?._id || courseData?.ID;

        if (!targetLessonId) {
            if (showNoti) showNoti(false, 'Không xác định được buổi học cần báo nghỉ. Vui lòng thử lại.');
            return;
        }

        setSubmitting(true);
        try {
            const formattedNote = `[${cancelType === 'teacher' ? 'Báo nghỉ Giáo viên' : 'Báo nghỉ Lớp'}] ${reason.trim()}`;
            const res = await fetch('/api/course/ucalendarcourse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: targetCourseId,
                    detailId: targetLessonId,
                    type: 'Báo nghỉ',
                    data: {
                        Note: formattedNote,
                        CancelType: cancelType,
                    },
                }),
            });

            const json = await res.json();
            if (json.status === 2 || res.ok) {
                if (showNoti) showNoti(true, json.mes || 'Báo nghỉ buổi học thành công!');
                onClose();
                if (onSuccess) onSuccess();
            } else {
                if (showNoti) showNoti(false, json.mes || 'Báo nghỉ thất bại.');
            }
        } catch (error) {
            console.error('Error submitting cancel lesson:', error);
            if (showNoti) showNoti(false, error.message || 'Lỗi khi gửi yêu cầu báo nghỉ.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <CenterPopup
            open={open}
            onClose={onClose}
            title="Báo nghỉ buổi học"
            size="md"
        >
            <div className="p-5 flex flex-col gap-4">
                {/* Cảnh báo nếu buổi học đã diễn ra */}
                {isPastLesson && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2.5 text-amber-800 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16" fill="currentColor" className="shrink-0 mt-0.5 text-amber-600">
                            <path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480L40 480c-14.3 0-27.4-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24l0 112c0 13.3 10.7 24 24 24s24-10.7 24-24l0-112c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/>
                        </svg>
                        <div>
                            <p className="font-bold text-amber-900 text-xs">Không thể báo nghỉ buổi học đã diễn ra!</p>
                            <p className="mt-0.5 text-amber-700 leading-relaxed text-[11px]">
                                Buổi học này đã diễn ra vào ngày <strong>{lessonDate}</strong>. Hệ thống chỉ cho phép báo nghỉ đối với các buổi học chưa diễn ra hoặc diễn ra hôm nay.
                            </p>
                        </div>
                    </div>
                )}

                {/* Thông tin buổi học */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium">Khóa học / Lớp:</span>
                        <span className="font-semibold text-gray-800">{courseData?.ID || courseData?.Name || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium">Buổi học:</span>
                        <span className="font-medium text-gray-800">{lessonName} ({lessonDate})</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium">Giáo viên:</span>
                        <span className="text-gray-800">{teacherName}</span>
                    </div>
                    {isAlreadyCancelled && (
                        <div className="mt-1 px-2.5 py-1 bg-red-100 border border-red-200 rounded text-red-700 text-xs font-semibold text-center">
                            Buổi học này hiện đang ở trạng thái BÁO NGHỈ
                        </div>
                    )}
                </div>

                {/* Hộp thông tin cơ chế tự động dời bài học và tạo buổi bù */}
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg flex items-start gap-2.5 text-blue-900 text-xs leading-relaxed">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16" fill="#1d4ed8" className="shrink-0 mt-0.5">
                        <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h24c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-144c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z"/>
                    </svg>
                    <div className="flex flex-col gap-1 w-full">
                        <p className="font-semibold text-blue-950 text-xs">Cơ chế tự động dời bài học & tạo buổi bù:</p>
                        <ul className="list-disc pl-4 text-blue-800 text-[11px] space-y-0.5">
                            <li>Nội dung của buổi này sẽ được chuyển sang buổi học tiếp theo (các buổi sau tự động dời tịnh tiến).</li>
                            <li>Hệ thống sẽ <strong>tự động tạo 1 buổi bù ở cuối khóa</strong> để hoàn thành trọn vẹn giáo trình.</li>
                        </ul>
                        {estimatedMakeup && (
                            <div className="mt-1 text-blue-900 text-[11px] font-medium bg-blue-100/80 px-2 py-1.5 rounded border border-blue-200 flex items-center justify-between">
                                <span>🗓️ Buổi bù dự kiến:</span>
                                <strong>{estimatedMakeup.dateStr} ({estimatedMakeup.timeStr})</strong>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chọn loại báo nghỉ */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Loại báo nghỉ:</label>
                    <div className="grid grid-cols-2 gap-3">
                        <label
                            onClick={() => !isPastLesson && setCancelType('class')}
                            className={`flex flex-col p-3 rounded-lg border transition-all ${
                                isPastLesson ? 'opacity-60 cursor-not-allowed border-gray-200 bg-gray-50' : 'cursor-pointer'
                            } ${
                                cancelType === 'class' && !isPastLesson
                                    ? 'border-red-500 bg-red-50/60 shadow-sm'
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <input
                                    type="radio"
                                    name="cancelType"
                                    disabled={isPastLesson}
                                    checked={cancelType === 'class'}
                                    onChange={() => setCancelType('class')}
                                    className="accent-red-600"
                                />
                                <span className="font-semibold text-sm text-gray-800">Báo nghỉ lớp</span>
                            </div>
                            <p className="text-xs text-gray-500 pl-5">
                                Cả lớp nghỉ buổi này, có thể xếp lịch học bù sau.
                            </p>
                        </label>

                        <label
                            onClick={() => !isPastLesson && setCancelType('teacher')}
                            className={`flex flex-col p-3 rounded-lg border transition-all ${
                                isPastLesson ? 'opacity-60 cursor-not-allowed border-gray-200 bg-gray-50' : 'cursor-pointer'
                            } ${
                                cancelType === 'teacher' && !isPastLesson
                                    ? 'border-amber-500 bg-amber-50/60 shadow-sm'
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <input
                                    type="radio"
                                    name="cancelType"
                                    disabled={isPastLesson}
                                    checked={cancelType === 'teacher'}
                                    onChange={() => setCancelType('teacher')}
                                    className="accent-amber-600"
                                />
                                <span className="font-semibold text-sm text-gray-800">Báo nghỉ giáo viên</span>
                            </div>
                            <p className="text-xs text-gray-500 pl-5">
                                Giáo viên nghỉ dạy buổi này, cần phân công dạy thay.
                            </p>
                        </label>
                    </div>
                </div>

                {/* Gợi ý lý do nhanh */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-500">Gợi ý lý do nhanh:</label>
                    <div className="flex flex-wrap gap-1.5">
                        {COMMON_REASONS.map((r, i) => (
                            <button
                                key={i}
                                type="button"
                                disabled={isPastLesson}
                                onClick={() => setReason(r)}
                                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                    isPastLesson
                                        ? 'opacity-60 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-500'
                                        : 'cursor-pointer'
                                } ${
                                    reason === r && !isPastLesson
                                        ? 'bg-red-600 text-white border-red-600'
                                        : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Ô nhập lý do */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">
                        Lý do báo nghỉ <span className="text-red-500">*</span>:
                    </label>
                    <textarea
                        rows="3"
                        disabled={isPastLesson}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none text-gray-700 transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none ${
                            isPastLesson ? 'bg-gray-100 opacity-60 cursor-not-allowed' : ''
                        }`}
                        placeholder="Nhập chi tiết lý do báo nghỉ..."
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                    />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium border-none cursor-pointer transition-colors"
                    >
                        {isPastLesson ? 'Đóng' : 'Hủy'}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isPastLesson || isAlreadyCancelled || submitting || !reason.trim()}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                        {submitting ? (
                            <span>Đang xử lý...</span>
                        ) : isPastLesson ? (
                            <span>Không thể báo nghỉ (Đã diễn ra)</span>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="14" height="14" fill="white">
                                    <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"/>
                                </svg>
                                <span>Xác nhận báo nghỉ</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </CenterPopup>
    );
}
