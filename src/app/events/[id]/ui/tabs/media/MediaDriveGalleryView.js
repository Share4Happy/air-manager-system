'use client';
import React, { useState, useEffect } from 'react';
import {
    IconCamera,
    IconLink,
    IconCheck,
    IconExternalLink,
    IconFileText,
} from '@/app/events/ui/icons';

export default function MediaDriveGalleryView({ event = {}, onUpdateMedia, readOnly = false }) {
    const existingDriveUrl = event.media?.driveFolderUrl || event.driveFolderUrl || '';
    const existingNotes = event.media?.notes || '';

    const [driveUrl, setDriveUrl] = useState(existingDriveUrl);
    const [mediaNotes, setMediaNotes] = useState(existingNotes);
    const [savedSuccessDrive, setSavedSuccessDrive] = useState(false);
    const [savedSuccessNotes, setSavedSuccessNotes] = useState(false);
    const [copied, setCopied] = useState(false);
    const [driveError, setDriveError] = useState('');

    useEffect(() => {
        setDriveUrl(existingDriveUrl);
        setMediaNotes(existingNotes);
    }, [existingDriveUrl, existingNotes]);

    // Extract Folder ID from Google Drive URL if possible
    const extractDriveFolderId = (url = '') => {
        if (!url) return null;
        const match = url.match(/folders\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    };

    const folderId = extractDriveFolderId(driveUrl || existingDriveUrl);

    // Parse links from media notes for quick opening
    const extractLinksFromText = (text = '') => {
        if (!text) return [];
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = text.match(urlRegex) || [];
        return Array.from(new Set(matches));
    };

    const detectedLinks = extractLinksFromText(mediaNotes);

    // Save Drive URL
    const handleSaveDriveUrl = (e) => {
        e?.preventDefault?.();
        const trimmed = driveUrl.trim();
        if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
            setDriveError('Đường dẫn phải bắt đầu bằng http:// hoặc https://');
            return;
        }

        setDriveError('');
        const newMedia = {
            ...(event.media || {}),
            driveFolderUrl: trimmed,
        };

        onUpdateMedia?.(newMedia);
        setSavedSuccessDrive(true);
        setTimeout(() => setSavedSuccessDrive(false), 2500);
    };

    // Save Media Notes & Links
    const handleSaveNotes = (e) => {
        e?.preventDefault?.();
        const newMedia = {
            ...(event.media || {}),
            notes: mediaNotes,
        };

        onUpdateMedia?.(newMedia);
        setSavedSuccessNotes(true);
        setTimeout(() => setSavedSuccessNotes(false), 2500);
    };

    // Copy to clipboard
    const handleCopyDrive = () => {
        if (!driveUrl) return;
        navigator.clipboard.writeText(driveUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
            {/* 1. Google Drive Folder Section */}
            <div className="bg-[var(--bg-primary)] p-5 rounded-2xl border border-[var(--border-color)] shadow-xs flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3.5">
                    <div className="flex items-center gap-2.5">
                        <IconLink className="w-5 h-5 text-blue-600" />
                        <h4 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                            Đường dẫn Thư mục Google Drive (Album ảnh / Video)
                        </h4>
                    </div>

                    {driveUrl && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleCopyDrive}
                                className="px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-xs sm:text-sm font-semibold text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                <IconCheck className={copied ? 'w-3.5 h-3.5 text-emerald-600' : 'w-3.5 h-3.5'} />
                                <span>{copied ? 'Đã sao chép' : 'Sao chép link'}</span>
                            </button>

                            <a
                                href={driveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-1.5 transition-all text-decoration-none"
                            >
                                <span>Mở Google Drive</span>
                                <IconExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    )}
                </div>

                {!readOnly ? (
                    <form onSubmit={handleSaveDriveUrl} className="flex flex-col gap-3.5">
                        <div>
                            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                                Nhập link thư mục Drive chứa ảnh sự kiện:
                            </label>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                                <input
                                    type="url"
                                    value={driveUrl}
                                    onChange={(e) => setDriveUrl(e.target.value)}
                                    placeholder="https://drive.google.com/drive/folders/..."
                                    className="flex-1 px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all border-none cursor-pointer shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                                >
                                    <IconCheck className="w-3.5 h-3.5" />
                                    <span>Lưu link Drive</span>
                                </button>
                            </div>
                        </div>

                        {driveError && (
                            <p className="text-sm text-rose-600 font-medium">{driveError}</p>
                        )}

                        {savedSuccessDrive && (
                            <p className="text-sm sm:text-base text-emerald-600 font-semibold flex items-center gap-1.5">
                                <IconCheck className="w-4 h-4" />
                                <span>Đã lưu đường dẫn Google Drive thành công!</span>
                            </p>
                        )}
                    </form>
                ) : (
                    !driveUrl && (
                        <p className="text-sm text-[var(--text-secondary)] italic">
                            Chưa cập nhật liên kết thư mục Google Drive cho sự kiện này.
                        </p>
                    )
                )}

                {/* Embedded preview if valid folder ID exists */}
                {folderId && (
                    <div className="rounded-xl border border-[var(--border-color)] overflow-hidden mt-2">
                        <div className="p-3 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]">
                            <span className="text-sm sm:text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <IconCamera className="w-4 h-4 text-blue-600" />
                                <span>Xem trước ảnh trên Drive</span>
                            </span>
                            <a
                                href={driveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 text-decoration-none"
                            >
                                <span>Mở tab mới</span>
                                <IconExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                        <div className="w-full h-[480px] bg-[var(--bg-secondary)]">
                            <iframe
                                src={`https://drive.google.com/embeddedfolderview?id=${folderId}#grid`}
                                title="Google Drive Preview"
                                className="w-full h-full border-none"
                                allow="autoplay"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Simple Notes & Related Post Links Box (Ô Ghi chú & Link bài đăng đơn giản) */}
            <div className="bg-[var(--bg-primary)] p-5 rounded-2xl border border-[var(--border-color)] shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3.5">
                    <div className="flex items-center gap-2.5">
                        <IconFileText className="w-5 h-5 text-amber-500" />
                        <div>
                            <h4 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                                Ghi chú & Đường link bài đăng liên quan
                            </h4>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Dán các link bài đăng Fanpage, Zalo, Website, video và ghi chú dặn dò media vào ô bên dưới
                            </p>
                        </div>
                    </div>
                </div>

                {!readOnly ? (
                    <form onSubmit={handleSaveNotes} className="flex flex-col gap-3.5">
                        <textarea
                            rows={7}
                            value={mediaNotes}
                            onChange={(e) => setMediaNotes(e.target.value)}
                            placeholder={`Ví dụ:\n- Link bài viết Fanpage tổng kết: https://facebook.com/...\n- Link video TikTok sự kiện: https://tiktok.com/@...\n- Bài đăng nhóm Zalo phụ huynh: https://zalo.me/...\n- Dặn dò thợ chụp ảnh: Chú ý chụp ảnh trao giải và khoảnh khắc trải nghiệm lắp ráp robot của học sinh.`}
                            className="w-full p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed font-sans"
                        />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                            {savedSuccessNotes ? (
                                <span className="text-sm text-emerald-600 font-semibold flex items-center gap-1.5">
                                    <IconCheck className="w-4 h-4" />
                                    <span>Đã lưu ghi chú và link bài đăng thành công!</span>
                                </span>
                            ) : (
                                <span className="text-xs sm:text-sm text-[var(--text-secondary)]">
                                    * Hệ thống sẽ tự động phát hiện các liên kết web (http/https) có trong ghi chú để mở nhanh.
                                </span>
                            )}

                            <button
                                type="submit"
                                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm sm:text-base font-semibold transition-all border-none cursor-pointer shadow-xs flex items-center justify-center gap-2 self-end sm:self-auto"
                            >
                                <IconCheck className="w-4 h-4" />
                                <span>Lưu ghi chú</span>
                            </button>
                        </div>
                    </form>
                ) : (
                    mediaNotes ? (
                        <div className="p-4 rounded-xl bg-[var(--bg-secondary)] text-sm sm:text-base text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                            {mediaNotes}
                        </div>
                    ) : (
                        <p className="text-sm text-[var(--text-secondary)] italic">
                            Chưa có ghi chú hoặc liên kết truyền thông nào.
                        </p>
                    )
                )}

                {/* Quick Links Detected from Notes */}
                {detectedLinks.length > 0 && (
                    <div className="mt-2 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex flex-col gap-2.5">
                        <span className="text-sm sm:text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                            <IconLink className="w-4 h-4 text-blue-500" />
                            <span>Mở nhanh các liên kết bài đăng được tìm thấy ({detectedLinks.length}):</span>
                        </span>
                        <div className="flex flex-wrap gap-2.5">
                            {detectedLinks.map((link, idx) => (
                                <a
                                    key={idx}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-blue-300 text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-mono truncate max-w-md flex items-center gap-2 text-decoration-none shadow-2xs transition-colors"
                                    title={link}
                                >
                                    <IconExternalLink className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{link}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
