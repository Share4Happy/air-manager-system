'use client';
import React, { memo } from 'react';
import { formatDate, srcImage } from '@/function';
import {
    IconPin,
    IconDotsVertical,
    IconReplyFilled,
    IconPinFilled,
    IconTrashFilled,
    IconTree,
    IconCheck,
    IconClock,
    IconAlertTriangle,
} from '@/app/events/ui/icons';
import { getInitials, getAvatarBgColor, formatChatTime } from './chatUtils';

const ChatMessageItem = memo(function ChatMessageItem({
    msg,
    index,
    isMe,
    isSameSenderAsPrev,
    isSameSenderAsNext,
    showDateDivider,
    isHighlighted,
    activeMenuMessageId,
    setActiveMenuMessageId,
    onReply,
    onTogglePin,
    onDelete,
    onImageClick,
    onScrollToMessage,
    onTaskClick,
    isBtcUser,
    canDelete,
}) {
    const msgId = String(msg.id || msg._id || index);
    const isUrgent = Boolean(msg.isUrgent);
    const isPinned = Boolean(msg.isPinned);

    return (
        <React.Fragment key={msgId}>
            {showDateDivider && (
                <div className="flex items-center justify-center my-2.5">
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2.5 py-0.5 rounded-[5px] border border-[var(--border-color)] shadow-2xs">
                        {formatDate(msg.createdAt)}
                    </span>
                </div>
            )}

            <div
                id={`msg-${msgId}`}
                className={`group relative flex items-start gap-1 max-w-[88%] sm:max-w-[80%] transition-all ${
                    isSameSenderAsPrev ? 'mt-[2px]' : 'mt-3'
                } ${
                    isMe ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'
                } ${isHighlighted ? 'scale-[1.02] ring-2 ring-blue-500 rounded-[5px] p-1 bg-blue-500/10' : ''}`}
            >
                {/* Sender Avatar or Spacer for non-me */}
                {!isMe && (
                    !isSameSenderAsPrev ? (
                        <div
                            className={`w-7 h-7 rounded-[5px] text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs overflow-hidden ${
                                msg.senderAvatar ? 'bg-transparent' : getAvatarBgColor(msg.senderName)
                            }`}
                            title={`${msg.senderName} (${msg.senderRole || 'Thành viên'})`}
                        >
                            {msg.senderAvatar ? (
                                <img
                                    src={srcImage(msg.senderAvatar)}
                                    alt={msg.senderName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                getInitials(msg.senderName)
                            )}
                        </div>
                    ) : (
                        <div className="w-7 shrink-0" />
                    )
                )}

                {/* Message Content Bubble + Timestamp below */}
                <div className="flex flex-col min-w-0 max-w-full">
                    {/* Sender Name & Role */}
                    {!isMe && !isSameSenderAsPrev && (
                        <div className="flex items-center gap-1.5 mb-1 ml-1 text-[11px] leading-none">
                            <span className="font-bold text-[var(--text-primary)] truncate max-w-[140px]">
                                {msg.senderName}
                            </span>
                            {msg.senderRole && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-[5px] bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)] font-medium truncate max-w-[120px] border border-[var(--border-color)]">
                                    {msg.senderRole}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Bubble */}
                    <div
                        className={`relative p-2.5 sm:p-3 rounded-2xl text-xs leading-relaxed break-words [word-break:break-word] shadow-xs border w-fit max-w-full ${
                            isUrgent
                                ? isMe
                                    ? 'bg-rose-600 text-white border-rose-600 rounded-tr-xs'
                                    : 'bg-rose-600 text-white border-rose-600 rounded-tl-xs'
                                : isMe
                                ? 'bg-blue-600 text-white border-blue-600 rounded-tr-xs'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)] rounded-tl-xs'
                        }`}
                    >
                        {/* Reply Quote preview if replying to a message */}
                        {msg.replyTo && (
                            <div
                                onClick={() => onScrollToMessage(msg.replyTo.id || msg.replyTo._id)}
                                className={`mb-2 p-1.5 px-2 rounded-[5px] text-[11px] border-l-2 cursor-pointer transition-opacity hover:opacity-85 ${
                                    isUrgent || isMe
                                        ? 'bg-white/15 border-white/80 text-white/90'
                                        : 'bg-black/5 dark:bg-white/5 border-blue-500 text-[var(--text-secondary)]'
                                }`}
                            >
                                <div className="font-semibold text-[10px] truncate">
                                    {msg.replyTo.senderName}
                                </div>
                                <div className="line-clamp-1 italic text-[10px]">
                                    {msg.replyTo.content}
                                </div>
                            </div>
                        )}

                        {/* Tagged Roadmap Task Card (if any) */}
                        {msg.taggedTask && (
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onTaskClick?.(msg.taggedTask);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onTaskClick?.(msg.taggedTask);
                                    }
                                }}
                                className={`mb-2 p-2.5 rounded-xl border flex flex-col gap-1 select-none cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
                                    isUrgent
                                        ? 'bg-black/20 border-white/30 text-white shadow-2xs hover:bg-black/30'
                                        : isMe
                                        ? 'bg-black/15 border-white/30 text-white shadow-2xs hover:bg-black/25'
                                        : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-blue-400 shadow-2xs'
                                }`}
                                title="Bấm để làm nổi bật (highlight) trên sơ đồ cây"
                            >
                                <div className="flex items-center justify-between gap-1.5 text-[10px]">
                                    <div className="flex items-center gap-1 font-bold truncate">
                                        <IconTree className="w-3.5 h-3.5 shrink-0 opacity-90" />
                                        <span className="truncate">{msg.taggedTask.phaseName || 'Lộ trình'}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 flex items-center gap-1 ${
                                        isUrgent || isMe
                                            ? 'bg-white/20 text-white border border-white/40'
                                            : msg.taggedTask.status === 'completed'
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                            : msg.taggedTask.status === 'in_progress'
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                                            : msg.taggedTask.status === 'overdue'
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                            : msg.taggedTask.status === 'blocked'
                                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                                    }`}>
                                        {msg.taggedTask.status === 'completed' && <IconCheck className="w-2.5 h-2.5" />}
                                        {msg.taggedTask.status === 'overdue' && <IconClock className="w-2.5 h-2.5" />}
                                        {msg.taggedTask.status === 'blocked' && <IconAlertTriangle className="w-2.5 h-2.5" />}
                                        <span>
                                            {msg.taggedTask.status === 'completed'
                                                ? 'Hoàn thành'
                                                : msg.taggedTask.status === 'in_progress'
                                                ? 'Đang làm'
                                                : msg.taggedTask.status === 'overdue'
                                                ? 'Trễ hạn'
                                                : msg.taggedTask.status === 'blocked'
                                                ? 'Vướng mắc'
                                                : 'Chưa làm'}
                                        </span>
                                    </span>
                                </div>

                                <div className="font-bold text-xs line-clamp-2">
                                    {msg.taggedTask.name}
                                </div>

                                {msg.taggedTask.assigneeName && (
                                    <div className={`text-[10px] truncate ${isUrgent || isMe ? 'text-white/85' : 'text-[var(--text-secondary)]'}`}>
                                        Phụ trách: <strong className={isUrgent || isMe ? 'text-white font-semibold' : 'text-[var(--text-primary)] font-semibold'}>{msg.taggedTask.assigneeName}</strong>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Image Attachment (if any) */}
                        {msg.imageUrl && (
                            <div className="mb-2 max-w-sm rounded-[5px] overflow-hidden cursor-pointer" onClick={() => onImageClick(msg.imageUrl)}>
                                <img
                                    src={msg.imageUrl}
                                    alt="Đính kèm"
                                    className="max-h-48 rounded-[5px] object-cover hover:opacity-95 transition-opacity"
                                />
                            </div>
                        )}

                        {/* Main Text Content */}
                        {msg.content && (
                            <div className="whitespace-pre-wrap selection:bg-rose-800 selection:text-white">
                                {msg.content}
                            </div>
                        )}
                    </div>

                    {/* Timestamp & Status below bubble */}
                    {(!isSameSenderAsNext || isPinned) && (
                        <div
                            className={`flex items-center gap-1.5 mt-0.5 text-[10px] text-[var(--text-secondary)] select-none ${
                                isMe ? 'justify-end pr-1' : 'justify-start pl-1'
                            }`}
                        >
                            {isPinned && (
                                <span className="flex items-center gap-0.5 text-amber-500 font-semibold text-[9px]">
                                    <IconPin className="w-2.5 h-2.5 rotate-45" />
                                    <span>Ghim</span>
                                </span>
                            )}
                            {!isSameSenderAsNext && (
                                <span className="opacity-75">{formatChatTime(msg.createdAt)}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* 3-dots Action Menu on Hover & Popover */}
                <div className="relative chat-msg-menu self-center shrink-0">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuMessageId(prev => prev === msgId ? null : msgId);
                        }}
                        title="Tùy chọn tin nhắn"
                        className={`p-1 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-blue-600 transition-all cursor-pointer border border-transparent hover:border-[var(--border-color)] bg-[var(--bg-primary)]/90 shadow-2xs ${
                            activeMenuMessageId === msgId ? 'opacity-100 bg-[var(--bg-secondary)] text-blue-600' : 'opacity-0 group-hover:opacity-100'
                        }`}
                    >
                        <IconDotsVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* Popover Menu */}
                    {activeMenuMessageId === msgId && (
                        <div
                            className={`absolute z-30 ${
                                isMe ? 'right-0' : 'left-0'
                            } bottom-full mb-1 w-32 py-1 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] shadow-xl animate-in fade-in zoom-in-95 duration-100 flex flex-col`}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    onReply(msg);
                                    setActiveMenuMessageId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] hover:text-blue-600 flex items-center gap-2 border-none bg-transparent cursor-pointer transition-colors font-medium"
                            >
                                <IconReplyFilled className="w-3.5 h-3.5" />
                                <span>Trả lời</span>
                            </button>

                            {isBtcUser && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onTogglePin(msgId, msg.isPinned);
                                        setActiveMenuMessageId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] hover:text-blue-600 flex items-center gap-2 border-none bg-transparent cursor-pointer transition-colors font-medium"
                                >
                                    <IconPinFilled className="w-3.5 h-3.5" />
                                    <span>{msg.isPinned ? 'Bỏ ghim' : 'Ghim tin'}</span>
                                </button>
                            )}

                            {canDelete && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onDelete(msgId);
                                        setActiveMenuMessageId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] hover:text-blue-600 flex items-center gap-2 border-none bg-transparent cursor-pointer transition-colors font-medium"
                                >
                                    <IconTrashFilled className="w-3.5 h-3.5" />
                                    <span>Xóa tin nhắn</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </React.Fragment>
    );
});

export default ChatMessageItem;
