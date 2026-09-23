'use client';
import React, { useState } from 'react';
import {
    IconChatBubble,
    IconSend,
} from '@/app/events/ui/icons';
import { EventModal } from '@/app/events/ui/common';

export default function TaskCommentsModal({
    isOpen = false,
    onClose,
    task = null,
    onAddComment,
    readOnly = false,
}) {
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !task) return null;

    const comments = task.comments || [];

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!commentText.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAddComment?.(task.id, commentText.trim());
            setCommentText('');
        } catch (err) {
            console.error('Error adding comment:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <EventModal
            isOpen={isOpen}
            onClose={onClose}
            title="Thảo luận & Ghi chú nhiệm vụ"
            subtitle={`Nhiệm vụ: ${task.name}`}
            icon={IconChatBubble}
            maxWidth="max-w-lg"
            hideFooter={true}
        >
            <div className="flex flex-col gap-3 min-h-[300px] -mx-4 -my-4 sm:-mx-5 sm:-my-5 p-4 sm:p-5">
                {/* Comments List */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-3 max-h-[360px] pr-1">
                    {comments.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-[var(--text-secondary)]">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center mb-2.5 opacity-60">
                                <IconChatBubble className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-bold text-[var(--text-primary)]">Chưa có trao đổi nào</p>
                            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 max-w-xs">
                                Để lại nhận xét, phản hồi tiến độ hoặc lưu ý quan trọng cho nhiệm vụ này.
                            </p>
                        </div>
                    ) : (
                        comments.map((c, idx) => (
                            <div
                                key={c.id || idx}
                                className="p-3.5 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] flex flex-col gap-1.5"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                            {(c.author || 'T').charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-xs font-bold text-[var(--text-primary)]">
                                            {c.author || 'Thành viên'}
                                        </span>
                                        {c.authorRole && (
                                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-medium">
                                                {c.authorRole}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                                        {c.createdAt ? new Date(c.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'Vừa xong'}
                                    </span>
                                </div>
                                <p className="text-xs text-[var(--text-primary)] leading-relaxed pl-8 whitespace-pre-wrap">
                                    {c.content}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {/* Comment Input Box */}
                {!readOnly && (
                    <form onSubmit={handleSend} className="pt-3 border-t border-[var(--border-color)] flex items-center gap-2 mt-auto">
                        <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Nhập nội dung thảo luận hoặc phản hồi..."
                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        />
                        <button
                            type="submit"
                            disabled={!commentText.trim() || isSubmitting}
                            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 border-none cursor-pointer shadow-xs disabled:opacity-40 transition-all shrink-0"
                        >
                            <IconSend className="w-3.5 h-3.5" />
                            <span>{isSubmitting ? 'Đang gửi...' : 'Gửi'}</span>
                        </button>
                    </form>
                )}
            </div>
        </EventModal>
    );
}
