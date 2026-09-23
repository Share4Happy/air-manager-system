'use client';
import React from 'react';
import { IconChevronDown } from '@/app/events/ui/icons';

export default function ScrollToBottomButton({
    visible = false,
    onClick,
    unreadCount = 0,
}) {
    if (!visible) return null;

    return (
        <div className="sticky bottom-2 flex justify-center z-20 pointer-events-none mt-auto">
            <button
                type="button"
                onClick={onClick}
                className="pointer-events-auto group px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xl border-2 border-white dark:border-slate-800 flex items-center gap-1.5 cursor-pointer transition-all duration-200 transform animate-in fade-in slide-in-from-bottom-2 hover:scale-105 active:scale-95"
                title="Cuộn xuống tin nhắn mới nhất"
            >
                <IconChevronDown className="w-4 h-4 animate-bounce shrink-0" />
                <span>Tin mới nhất</span>
                {unreadCount > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow-xs border border-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
}
