'use client';

import React from 'react';
import Link from 'next/link';
import { driveThumbnailUrl, driveFolderUrl } from '@/function';

export default function MediaGallery({
    session,
    mediaItems = [],
    uploadingItems = [],
    onAdd,
    onMediaClick,
    selectMode,
    selectedIds,
    onToggleSelect,
    onStartSelect,
    onCancelSelect,
    onDeleteSelected,
    deleting
}) {
    const getDriveImageUrl = (id) => driveThumbnailUrl(id, 400);
    const ringRadius = 16;
    const ringCircumference = 2 * Math.PI * ringRadius;

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <h4>Thư viện hình ảnh & video</h4>
                <div className="flex flex-wrap gap-2">
                    {!selectMode ? (
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <button
                                onClick={onStartSelect}
                                className="w-full sm:w-auto px-3 py-2 bg-red-500 flex items-center justify-center gap-2 rounded text-white text-sm font-medium cursor-pointer border-none hover:bg-red-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="white">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                </svg>
                                Chọn nhiều
                            </button>
                            <div className="flex gap-2 w-full sm:flex-1">
                                <Link
                                    href={driveFolderUrl(session.Image)}
                                    className='flex-1 px-3 py-2 bg-[var(--main_b)] flex items-center justify-center gap-2 rounded text-sm font-medium cursor-pointer border-none no-underline whitespace-nowrap hover:bg-[var(--main_d)]'
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'white' }}
                                >
                                    Đi tới Drive
                                </Link>
                                <button
                                    className={'flex-1 px-3 py-2 bg-[var(--main_b)] rounded text-sm font-medium whitespace-nowrap cursor-pointer border-none hover:bg-[var(--main_d)]'}
                                    onClick={onAdd}
                                    style={{ color: 'white' }}
                                >
                                    + Thêm file
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <span className="text-sm text-[var(--text-primary)]">{selectedIds.size} đã chọn</span>
                            <button
                                onClick={onCancelSelect}
                                className="flex-1 sm:flex-none px-3 py-2 bg-gray-300 rounded text-sm font-medium cursor-pointer border-none hover:bg-gray-400"
                            >
                                Hủy chọn
                            </button>
                            <button
                                onClick={onDeleteSelected}
                                disabled={selectedIds.size === 0 || deleting}
                                className="flex-1 sm:flex-none px-3 py-2 bg-red-600 rounded text-white text-sm font-medium cursor-pointer border-none hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deleting ? 'Đang xóa...' : `Xóa (${selectedIds.size})`}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {mediaItems.length === 0 && uploadingItems.length === 0 ? (
                <div className="flex-1 flex justify-center items-center p-12 text-center text-[#64748b] bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
                    <h5 style={{ fontStyle: 'italic' }}>Chưa có hình ảnh hoặc video nào.</h5>
                </div>
            ) : (
                <div className="flex-1 mr-[-16px] overflow-scroll [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-[#888] [&::-webkit-scrollbar-thumb]:rounded">
                    <div className="flex-1 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 overflow-y-auto pr-2">
                        {uploadingItems.map(item => (
                            <div key={item.key} className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#e2e8f0]">
                                {item.status === 'success' ? (
                                    <img src={getDriveImageUrl(item.driveId)} alt="Đã tải lên" className="absolute inset-0 w-full h-full object-cover" />
                                ) : item.type === 'video' ? (
                                    <video src={item.previewUrl} muted className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                    <img src={item.previewUrl} alt="Đang tải lên" className="absolute inset-0 w-full h-full object-cover" />
                                )}

                                {item.status === 'uploading' && (
                                    <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center gap-1">
                                        <svg viewBox="0 0 40 40" width="40" height="40" className="rotate-[-90deg]">
                                            <circle cx="20" cy="20" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
                                            <circle cx="20" cy="20" r={ringRadius} fill="none" stroke="#4ade80" strokeWidth="4" strokeLinecap="round"
                                                strokeDasharray={ringCircumference}
                                                strokeDashoffset={ringCircumference * (1 - Math.max(0, Math.min(100, item.percent)) / 100)} />
                                        </svg>
                                        {item.percent >= 100 && (
                                            <p className="text-white text-[10px] font-medium">Đang xử lý...</p>
                                        )}
                                    </div>
                                )}

                                {item.status === 'failed' && (
                                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                                        <div className="w-8 h-8 rounded-full bg-[var(--red)] flex items-center justify-center">
                                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                                        </div>
                                    </div>
                                )}

                                {item.status === 'success' && (
                                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--green)] flex items-center justify-center">
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                    </div>
                                )}
                            </div>
                        ))}
                        {mediaItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => selectMode ? onToggleSelect(item.id) : onMediaClick(item)}
                                className={`relative w-full aspect-square rounded-lg overflow-hidden bg-[#e2e8f0] transition-transform duration-200 ease-in-out border-none p-0 cursor-pointer group ${selectedIds.has(item.id) ? 'ring-2 ring-red-500' : ''}`}
                            >
                                <img src={getDriveImageUrl(item.id)} alt={`File từ Google Drive`} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                                {selectMode && (
                                    <div className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedIds.has(item.id) ? 'bg-red-500 border-red-500' : 'bg-white/80 border-gray-400'}`}>
                                        {selectedIds.has(item.id) && <svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                                    </div>
                                )}
                                {item.type === 'video' && !selectMode && (
                                    <div className="absolute inset-0 bg-black/30 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-white"><path d="M7 4V20L20 12L7 4Z"></path></svg>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
