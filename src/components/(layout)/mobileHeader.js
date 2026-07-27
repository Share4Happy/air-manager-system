"use client";

import { useState } from 'react';

export default function MobileHeader({ children }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <div className="fixed top-0 left-0 right-0 h-12 bg-[var(--bg-primary)] border-b border-[var(--border-color)] flex items-center justify-between px-3 z-50 lg:hidden">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold" style={{ color: 'var(--main_d)' }}>AI<span style={{ color: '#000' }}> ROBOTIC</span></span>
                </div>
                <button
                    onClick={() => setOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded bg-transparent border-none cursor-pointer text-[var(--text-primary)] hover:bg-[var(--hover)]"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={20} height={20} fill="currentColor">
                        <path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/>
                    </svg>
                </button>
            </div>

            {open && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-[100] lg:hidden" onClick={() => setOpen(false)} />
                    <div className="fixed top-0 right-0 h-full w-[280px] bg-[var(--bg-primary)] shadow-xl z-[101] lg:hidden overflow-y-auto transition-transform duration-300">
                        <div className="flex justify-end p-2">
                            <button
                                onClick={() => setOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded bg-transparent border-none cursor-pointer text-[var(--text-primary)] hover:bg-[var(--hover)]"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width={16} height={16} fill="currentColor">
                                    <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/>
                                </svg>
                            </button>
                        </div>
                        {children}
                    </div>
                </>
            )}
        </>
    );
}
