'use client';
import React, { useState } from 'react';
import {
    IconLayers,
    IconEdit,
    IconCheck,
    IconFileText,
} from '@/app/events/ui/icons';

export default function EventBlankTabView({
    event = {},
    onUpdateCustomTabContent,
    readOnly = false,
}) {
    const customTab = event.customTabContent || {};
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(customTab.title || 'Tab Trống / Ghi chú Mở rộng');
    const [content, setContent] = useState(customTab.content || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e) => {
        e?.preventDefault();
        setIsSaving(true);
        try {
            const updated = {
                title: title.trim() || 'Tab Trống / Ghi chú Mở rộng',
                content: content,
                updatedAt: new Date(),
            };
            onUpdateCustomTabContent?.(updated);
            setIsEditing(false);
        } catch (err) {
            console.error('Error saving blank tab content:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="bg-[var(--bg-primary)] p-4 sm:p-5 rounded-2xl border border-[var(--border-color)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
                        <IconLayers className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                            {customTab.title || 'Tab Trống / Ghi chú Mở rộng'}
                        </h2>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                            Không gian mở để bổ sung tài liệu, kịch bản phụ, checklist hoặc ghi chú tự do cho sự kiện
                        </p>
                    </div>
                </div>

                {!readOnly && (
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors bg-transparent cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 border-none cursor-pointer shadow-xs transition-all disabled:opacity-50"
                                >
                                    <IconCheck className="w-3.5 h-3.5" />
                                    <span>{isSaving ? 'Đang lưu...' : 'Lưu nội dung'}</span>
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                            >
                                <IconEdit className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Chỉnh sửa Tab</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Content Body */}
            <div className="bg-[var(--bg-primary)] p-5 sm:p-6 rounded-2xl border border-[var(--border-color)] shadow-xs min-h-[350px] flex flex-col">
                {isEditing ? (
                    <form onSubmit={handleSave} className="flex flex-col gap-4 flex-1">
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                                Tiêu đề Tab:
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Nhập tên tiêu đề cho Tab này..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex-1 flex flex-col">
                            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                                Nội dung chi tiết:
                            </label>
                            <textarea
                                rows={12}
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="Nhập ghi chú, checklist phân công, liên kết bổ sung, biên bản họp hoặc thông tin mở rộng..."
                                className="w-full flex-1 p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed font-sans"
                            />
                        </div>
                    </form>
                ) : (
                    <div className="flex-1 flex flex-col">
                        {content && content.trim() ? (
                            <div className="text-sm sm:text-base text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                                {content}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-16 gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center">
                                    <IconFileText className="w-7 h-7" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[var(--text-primary)]">Tab này hiện đang trống</h4>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm">
                                        Bạn có thể bấm "Chỉnh sửa Tab" để đổi tên tiêu đề và thêm ghi chú, liên kết hoặc nội dung cần thiết.
                                    </p>
                                </div>
                                {!readOnly && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold border-none cursor-pointer shadow-xs flex items-center gap-1.5"
                                    >
                                        <IconEdit className="w-3.5 h-3.5" />
                                        <span>Soạn nội dung cho Tab</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
