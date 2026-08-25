'use client';

import React from 'react';
import Link from 'next/link';
import CenterPopup from '@/components/(features)/(popup)/popup_center';

// Helper kiểm tra chuỗi có phải là ObjectId 24 ký tự hex của MongoDB không
const isMongoObjectId = (str) => typeof str === 'string' && /^[0-9a-fA-F]{24}$/.test(str);

export default function CompletedCoursesModal({ open, onClose, student, completedCourses = [] }) {
    if (!open) return null;

    return (
        <CenterPopup
            open={open}
            onClose={onClose}
            title=""
            size="md"
        >
            <div className="p-5 flex flex-col gap-4">
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-[var(--green)] flex items-center justify-center font-bold text-lg shrink-0">
                            🎓
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-bold text-[var(--text-primary)] m-0">
                                    Khóa học đã hoàn thành
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--green)] text-white">
                                    {completedCourses.length} khóa
                                </span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                Học sinh: <strong className="text-[var(--text-primary)]">{student?.Name}</strong> ({student?.ID})
                            </p>
                        </div>
                    </div>

                    <Link
                        href={`/${student?._id}/courses`}
                        className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium transition-colors flex items-center gap-1.5 w-fit"
                    >
                        <span>Lịch sử học tập</span>
                        <span>→</span>
                    </Link>
                </div>

                {/* Danh sách khóa học */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {completedCourses.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-2 text-center text-[var(--text-secondary)]">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                                    <path d="M6 6h10" />
                                    <path d="M6 10h10" />
                                </svg>
                            </div>
                            <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">Chưa có khóa học nào hoàn thành</p>
                            <p className="text-xs text-[var(--text-secondary)]">Học sinh chưa hoàn tất hoặc chưa có dữ liệu khóa học đã kết thúc.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            {completedCourses.map((item, index) => {
                                const courseObj = (item.course && typeof item.course === 'object') ? item.course : (typeof item === 'object' && item.ID ? item : null);
                                const rawId = typeof item.course === 'string' ? item.course : (item.course?._id || item._id);

                                // Chỉ hiển thị mã lớp (Mã hiển thị như 24FZ2007), không hiển thị ObjectId CSDL
                                const classCode = courseObj?.ID && !isMongoObjectId(courseObj.ID) ? courseObj.ID : null;
                                
                                const courseCodeForUrl = courseObj?.ID || (rawId ? String(rawId) : '');
                                const book = courseObj?.Book || {};
                                const courseName = book?.Name || courseObj?.Name || 'Khóa học Robotics';
                                const targetUrl = courseCodeForUrl ? `/course/${courseCodeForUrl}` : `/${student?._id}/courses`;

                                return (
                                    <div
                                        key={courseObj?._id || rawId || index}
                                        className="p-3.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-gray-400 transition-all flex flex-col gap-2.5"
                                    >
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-center gap-2">
                                                {classCode && (
                                                    <span className="text-xs font-mono font-bold text-[#1565c0] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                        {classCode}
                                                    </span>
                                                )}
                                                <h4 className="text-sm font-semibold text-[var(--text-primary)] m-0">
                                                    {courseName}
                                                </h4>
                                            </div>
                                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded bg-[var(--green)] text-white flex items-center gap-1 shrink-0">
                                                <span>✓</span> Đã hoàn thành
                                            </span>
                                        </div>

                                        <div className="pt-2 border-t border-gray-100 flex items-center justify-end">
                                            <Link
                                                href={targetUrl}
                                                target="_blank"
                                                className="text-xs text-[#1565c0] hover:underline font-medium flex items-center gap-1"
                                            >
                                                <span>Chi tiết lớp</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                    <polyline points="15 3 21 3 21 9" />
                                                    <line x1="10" y1="14" x2="21" y2="3" />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-3 border-t border-[var(--border-color)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs md:text-sm font-medium rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </CenterPopup>
    );
}
