'use client';
import React, { useState, useEffect } from 'react';
import {
    IconCheck,
    IconCheckCircle,
    IconSparkles,
    IconAlertCircle,
    IconLightbulb,
} from '@/app/events/ui/icons';

export default function RetrospectiveView({ event, onUpdateSummaryReport, onMarkCompleted, readOnly = false }) {
    const report = event.summaryReport || {};
    const [formData, setFormData] = useState({
        overview: report.overview || '',
        achievements: report.achievements || '',
        challenges: report.challenges || '',
        lessonsLearned: report.lessonsLearned || '',
        finalAttendeeCount: report.finalAttendeeCount || event.participantsCount || 0,
    });
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (event.summaryReport) {
            setFormData({
                overview: event.summaryReport.overview || '',
                achievements: event.summaryReport.achievements || '',
                challenges: event.summaryReport.challenges || '',
                lessonsLearned: event.summaryReport.lessonsLearned || '',
                finalAttendeeCount: event.summaryReport.finalAttendeeCount || event.participantsCount || 0,
            });
        }
    }, [event.summaryReport, event.participantsCount]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onUpdateSummaryReport?.({
                ...formData,
                completedAt: new Date(),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setLoading(false);
        }
    };

    const isCompleted = event.status === 'completed';

    return (
        <div className="flex flex-col gap-5">
            {!isCompleted && !readOnly && (
                <div className="flex items-center justify-end bg-[var(--bg-primary)] p-3 sm:p-3.5 rounded-2xl border border-[var(--border-color)] shadow-xs">
                    <button
                        type="button"
                        onClick={onMarkCompleted}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs border-none cursor-pointer flex items-center gap-1.5 transition-all whitespace-nowrap"
                    >
                        <IconCheck className="w-3.5 h-3.5" />
                        <span>Đánh dấu Sự kiện đã Hoàn thành</span>
                    </button>
                </div>
            )}

            <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] overflow-hidden p-5 sm:p-6 flex flex-col gap-6 shadow-sm">
                {!readOnly ? (
                    /* Editable Form */
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        {saved && (
                            <div className="p-3.5 text-sm sm:text-base text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center gap-2 font-medium">
                                <IconCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                                <span>Đã lưu báo cáo tổng kết thành công!</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2">
                                <span className="text-sm sm:text-base font-bold text-[var(--text-primary)] block mb-1.5">
                                    1. Đánh giá Tổng quan về Chương trình
                                </span>
                                <textarea
                                    rows={3}
                                    value={formData.overview}
                                    onChange={e => setFormData({ ...formData, overview: e.target.value })}
                                    placeholder="Tóm tắt không khí ngày diễn ra, phản hồi của phụ huynh, mức độ hoàn thành mục tiêu ban đầu..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            <div>
                                <span className="text-sm sm:text-base font-bold text-[var(--text-primary)] block mb-1.5">
                                    Số lượng tham dự thực tế
                                </span>
                                <input
                                    type="number"
                                    value={formData.finalAttendeeCount}
                                    onChange={e => setFormData({ ...formData, finalAttendeeCount: Number(e.target.value) || 0 })}
                                    placeholder="0"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 block">
                                    Học sinh / Thí sinh / Khách mời
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Achievements */}
                            <div>
                                <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1.5">
                                    <IconSparkles className="w-4 h-4 text-emerald-600" />
                                    <span>Điểm nổi bật & Thành tựu</span>
                                </span>
                                <textarea
                                    rows={4}
                                    value={formData.achievements}
                                    onChange={e => setFormData({ ...formData, achievements: e.target.value })}
                                    placeholder="Những khâu làm rất tốt, các đội thi xuất sắc, tỷ lệ chuyển đổi tuyển sinh cao..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                />
                            </div>

                            {/* Challenges */}
                            <div>
                                <span className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
                                    <IconAlertCircle className="w-4 h-4 text-amber-600" />
                                    <span>Khó khăn & Vấn đề phát sinh</span>
                                </span>
                                <textarea
                                    rows={4}
                                    value={formData.challenges}
                                    onChange={e => setFormData({ ...formData, challenges: e.target.value })}
                                    placeholder="Sự cố kỹ thuật, thời gian bị trễ, sa bàn bị lỗi, khâu đón tiếp quá tải..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                />
                            </div>

                            {/* Lessons Learned */}
                            <div>
                                <span className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-1.5">
                                    <IconLightbulb className="w-4 h-4 text-blue-600" />
                                    <span>Bài học kinh nghiệm cho mùa sau</span>
                                </span>
                                <textarea
                                    rows={4}
                                    value={formData.lessonsLearned}
                                    onChange={e => setFormData({ ...formData, lessonsLearned: e.target.value })}
                                    placeholder="Các cải tiến cần làm: chuẩn bị thêm pin dự phòng, test phần mềm sớm hơn 3 ngày..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>
                        </div>

                        <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-semibold shadow-md border-none cursor-pointer flex items-center gap-2 disabled:opacity-50 transition-all"
                            >
                                {loading ? 'Đang lưu...' : 'Lưu Đánh giá & Báo cáo'}
                            </button>
                        </div>
                    </form>
                ) : (
                    /* Read-Only Presentation */
                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex flex-col gap-2">
                                <span className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                    Đánh giá Tổng quan về Chương trình
                                </span>
                                <p className="text-sm sm:text-base text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                                    {formData.overview || 'Chưa có nội dung đánh giá tổng quan.'}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex flex-col justify-center gap-1">
                                <span className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300">
                                    Số lượng tham dự thực tế
                                </span>
                                <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                                    {formData.finalAttendeeCount}
                                </span>
                                <span className="text-xs text-[var(--text-secondary)]">
                                    Học sinh / Thí sinh / Khách mời
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Achievements */}
                            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex flex-col gap-2">
                                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                                    <IconSparkles className="w-4 h-4 text-emerald-600" />
                                    <span>Điểm nổi bật & Thành tựu</span>
                                </span>
                                <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                                    {formData.achievements || 'Chưa có ghi nhận.'}
                                </p>
                            </div>

                            {/* Challenges */}
                            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex flex-col gap-2">
                                <span className="text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                                    <IconAlertCircle className="w-4 h-4 text-amber-600" />
                                    <span>Khó khăn & Vấn đề phát sinh</span>
                                </span>
                                <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                                    {formData.challenges || 'Chưa có ghi nhận.'}
                                </p>
                            </div>

                            {/* Lessons Learned */}
                            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex flex-col gap-2">
                                <span className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                                    <IconLightbulb className="w-4 h-4 text-blue-600" />
                                    <span>Bài học kinh nghiệm cho mùa sau</span>
                                </span>
                                <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                                    {formData.lessonsLearned || 'Chưa có ghi nhận.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


