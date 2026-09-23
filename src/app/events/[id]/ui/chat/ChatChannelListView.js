'use client';
import React from 'react';
import {
    IconChatBubble,
    IconSearch,
    IconClose,
    IconRadio,
} from '@/app/events/ui/icons';
import { EventStatusBadge } from '@/app/events/ui/common';
import { formatChatTime } from './chatUtils';

export default function ChatChannelListView({
    sortedEvents = [],
    channelSearchQuery = '',
    setChannelSearchQuery,
    channelFilterTab = 'all',
    setChannelFilterTab,
    unreadChannelsCount = 0,
    animatedChannelsCount = 0,
    onSelectEvent,
    onClose,
}) {
    return (
        <div className="flex flex-col h-full bg-[var(--bg-primary)] select-none">
            {/* Header */}
            <div className="p-3 sm:p-3.5 bg-blue-600 text-white flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-8 h-8 rounded-[5px] bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                        <IconRadio className="w-4 h-4 text-white animate-pulse" />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-blue-700" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h4 className="text-sm font-bold text-white truncate m-0 leading-tight">
                            Điều Phối Sự Kiện
                        </h4>
                        <span className="text-[10px] text-blue-100 font-medium">
                            Kênh chat nội bộ theo từng sự kiện
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 text-white/90">
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-[5px] hover:bg-white/20 text-white flex items-center justify-center cursor-pointer border-none bg-transparent transition-colors"
                        title="Đóng chat"
                    >
                        <IconClose className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Search Box */}
            <div className="p-2.5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
                <div className="relative">
                    <IconSearch className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <input
                        type="text"
                        value={channelSearchQuery}
                        onChange={e => setChannelSearchQuery(e.target.value)}
                        placeholder="Tìm sự kiện theo tên, mã hoặc địa điểm..."
                        className="w-full pl-8.5 pr-8 py-1.5 text-xs rounded-[5px] border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-[var(--text-secondary)]/70 transition-all"
                    />
                    {channelSearchQuery && (
                        <button
                            type="button"
                            onClick={() => setChannelSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-none bg-transparent cursor-pointer text-xs"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Tabs: Tất cả | Chưa đọc | Đã hoàn thành */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/30 shrink-0">
                <button
                    type="button"
                    onClick={() => setChannelFilterTab('all')}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                        channelFilterTab === 'all'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
                    }`}
                >
                    Tất cả
                </button>
                <button
                    type="button"
                    onClick={() => setChannelFilterTab('unread')}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                        channelFilterTab === 'unread'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
                    }`}
                >
                    <span>Chưa đọc</span>
                    {unreadChannelsCount > 0 && (
                        <span 
                            key={animatedChannelsCount}
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold leading-none transition-all transform animate-in zoom-in-75 duration-150 ${
                                channelFilterTab === 'unread' ? 'bg-white text-blue-600' : 'bg-rose-500 text-white'
                            }`}
                        >
                            {animatedChannelsCount}
                        </span>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => setChannelFilterTab('completed')}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                        channelFilterTab === 'completed'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
                    }`}
                >
                    Đã hoàn thành
                </button>
            </div>

            {/* Events List Body */}
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 divide-y divide-[var(--border-color)]/50">
                {sortedEvents.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center justify-center text-[var(--text-secondary)]">
                        <IconChatBubble className="w-8 h-8 opacity-30 mb-2" />
                        <p className="text-xs font-medium">
                            {channelFilterTab === 'unread'
                                ? 'Không có tin nhắn chưa đọc'
                                : channelFilterTab === 'completed'
                                ? 'Không có sự kiện đã hoàn thành'
                                : 'Không tìm thấy sự kiện nào'}
                        </p>
                    </div>
                ) : (
                    sortedEvents.map(evt => {
                        const evtId = String(evt._id || evt.id);
                        const lastMsg = evt.lastChatMessage;

                        return (
                            <button
                                key={evtId}
                                type="button"
                                onClick={() => onSelectEvent(evt)}
                                className="w-full text-left p-3 py-2.5 rounded-[5px] transition-all flex items-center justify-between gap-2.5 cursor-pointer bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border-color)] group"
                            >
                                {/* Left: Status, Title & Message preview */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <EventStatusBadge status={evt.status} size="sm" />
                                        {evt.isUnread && (
                                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 shadow-xs animate-pulse ml-auto sm:ml-0" title="Tin mới chưa đọc" />
                                        )}
                                    </div>
                                    
                                    <h5 className={`text-xs truncate m-0 group-hover:text-blue-600 transition-colors ${
                                        evt.isUnread ? 'font-black text-[var(--text-primary)]' : 'font-bold text-[var(--text-primary)]'
                                    }`}>
                                        {evt.title}
                                    </h5>

                                    {/* Last Message Preview */}
                                    <div className={`text-[11px] truncate mt-0.5 flex items-center gap-1 ${
                                        evt.isUnread ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'
                                    }`}>
                                        {lastMsg ? (
                                            <>
                                                {lastMsg.isUrgent && (
                                                    <span className="text-rose-600 font-bold shrink-0">[Quan trọng]</span>
                                                )}
                                                <span className="truncate">
                                                    <strong className="text-[var(--text-primary)] font-semibold">{lastMsg.senderName || 'Thành viên'}: </strong>
                                                    {lastMsg.content || (lastMsg.imageUrl ? '[Hình ảnh]' : '')}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="italic text-[var(--text-secondary)]/80">Chưa có tin nhắn nào</span>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Timestamp */}
                                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                    <span className={`text-[10px] select-none ${evt.isUnread ? 'text-rose-600 font-bold' : 'text-[var(--text-secondary)]'}`}>
                                        {evt.latestMessageTime ? formatChatTime(evt.latestMessageTime) : ''}
                                    </span>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
