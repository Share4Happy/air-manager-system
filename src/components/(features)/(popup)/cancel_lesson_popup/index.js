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

    const lessonName = lessonData?.LessonDetails?.Name || lessonData?.Topic || 'Buổi học';
    const lessonDate = lessonData?.Day ? formatDate(lessonData.Day) : '—';
    const teacherName = lessonData?.Teacher?.name || courseData?.TeacherHR?.name || 'Chưa phân công';
    const isAlreadyCancelled = lessonData?.Type === 'Báo nghỉ';

    const handleConfirm = async () => {
        if (!reason.trim()) {
            if (showNoti) showNoti(false, 'Vui lòng nhập hoặc chọn lý do báo nghỉ.');
            return;
        }

        setSubmitting(true);
        try {
            const formattedNote = `[${cancelType === 'teacher' ? 'Báo nghỉ Giáo viên' : 'Báo nghỉ Lớp'}] ${reason.trim()}`;
            const res = await fetch('/api/course/ucalendarcourse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: courseId || courseData?._id,
                    detailId: lessonId || lessonData?._id,
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

                {/* Chọn loại báo nghỉ */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Loại báo nghỉ:</label>
                    <div className="grid grid-cols-2 gap-3">
                        <label
                            onClick={() => setCancelType('class')}
                            className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                                cancelType === 'class'
                                    ? 'border-red-500 bg-red-50/60 shadow-sm'
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <input
                                    type="radio"
                                    name="cancelType"
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
                            onClick={() => setCancelType('teacher')}
                            className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                                cancelType === 'teacher'
                                    ? 'border-amber-500 bg-amber-50/60 shadow-sm'
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <input
                                    type="radio"
                                    name="cancelType"
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
                                onClick={() => setReason(r)}
                                className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                                    reason === r
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none text-gray-700 transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
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
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={submitting || !reason.trim()}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium border-none cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                        {submitting ? (
                            <span>Đang xử lý...</span>
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
