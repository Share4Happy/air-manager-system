'use client';
import React from 'react';

export default function ChatImageLightbox({ imageUrl, onClose }) {
    if (!imageUrl) return null;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-[1001] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-150"
        >
            <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
                <img
                    src={imageUrl}
                    alt="Zoomed attachment"
                    className="max-h-[85vh] max-w-full rounded-[5px] shadow-2xl object-contain"
                />
                <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 px-4 py-1.5 rounded-[5px] bg-white/20 hover:bg-white/30 text-white text-xs font-semibold border border-white/40 cursor-pointer transition-colors"
                >
                    Đóng (Click ra ngoài để tắt)
                </button>
            </div>
        </div>
    );
}
