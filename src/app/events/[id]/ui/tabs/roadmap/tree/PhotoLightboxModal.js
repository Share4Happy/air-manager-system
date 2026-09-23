'use client';
import React from 'react';

export default function PhotoLightboxModal({ photo, onClose }) {
    if (!photo) return null;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs cursor-pointer animate-in fade-in duration-150"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="max-w-3xl max-h-[85vh] flex flex-col items-center gap-3 bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)] shadow-2xl"
            >
                <img
                    src={photo.src}
                    alt={photo.caption || 'Xem ảnh'}
                    className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain"
                />
                {photo.caption && (
                    <p className="text-sm font-semibold text-[var(--text-primary)] text-center">
                        {photo.caption}
                    </p>
                )}
                <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm font-semibold border border-[var(--border-color)] cursor-pointer transition-colors"
                >
                    Đóng
                </button>
            </div>
        </div>
    );
}
