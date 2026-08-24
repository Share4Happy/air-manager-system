'use client';

import React, { useState, useRef } from 'react';
import { Re_lesson } from '@/data/course';
import Noti from '@/components/(features)/(noti)/noti';
import UploadManager from './upload-manager';
import MediaGallery from './gallery';
import Lightbox from './lightbox';
import { uploadDirectToDrive } from './upload';

export default function ImageUploader({ session, onUploadSuccess }) {
    const [isPopupOpen, setPopupOpen] = useState(false);
    const [isUploaderOpen, setUploaderOpen] = useState(false);
    const [mediaItems, setMediaItems] = useState(session?.DetailImage || []);
    const [lightboxMedia, setLightboxMedia] = useState(null);

    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [deleting, setDeleting] = useState(false);
    const [noti, setNoti] = useState({ open: false, status: false, mes: '' });

    // Quản lý tiến trình upload
    const [isUploading, setIsUploading] = useState(false);
    const [uploadQueue, setUploadQueue] = useState([]);

    const uploaderRef = useRef();
    const uploadUrlsRef = useRef([]);

    const handleUploadFinish = async () => {
        await Re_lesson(session._id);
        try {
            const res = await fetch(`/api/calendar/${session._id}?_=${Date.now()}`);
            const json = await res.json();
            if (json.success) {
                setMediaItems(json.data.session?.DetailImage || []);
            } else {
                setMediaItems(session?.DetailImage || []);
            }
        } catch {
            setMediaItems(session?.DetailImage || []);
        }
    };

    const updateQueueItem = (key, patch) => {
        setUploadQueue(prev => prev.map(item => (item.key === key ? { ...item, ...patch } : item)));
    };

    const runUploadLoop = async (jobs) => {
        let failedCount = 0;
        let lastError = '';

        for (const job of jobs) {
            try {
                const timeoutMs = job.type === 'video' ? 600000 : 120000;
                const { result } = await uploadDirectToDrive(job.file, session.Image, {
                    fileType: job.type,
                    onProgress: (percent) => updateQueueItem(job.key, { percent }),
                    timeoutMs
                });

                if (result.status !== 2) throw new Error(result.mes || 'Lỗi không xác định từ server');

                const uploaded = result.data?.[0];
                if (!uploaded?.id) throw new Error("API không trả về ID của file.");

                updateQueueItem(job.key, { status: 'success', driveId: uploaded.id, percent: 100 });
            } catch (err) {
                console.error(`Lỗi tải lên file ${job.file.name}:`, err);
                failedCount++;
                const userMsg = err.message?.includes('oauth2') || err.message?.includes('token')
                    ? 'Lỗi xác thực kết nối Google Drive (token/service account)'
                    : err.message || 'Lỗi không xác định';
                lastError = `Tệp "${job.file.name}": ${userMsg}`;
                updateQueueItem(job.key, { status: 'failed', error: userMsg });
            }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        await handleUploadFinish();
        uploadUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
        uploadUrlsRef.current = [];
        setUploadQueue([]);
        setIsUploading(false);
        onUploadSuccess?.();

        if (failedCount > 0) {
            setNoti({ open: true, status: false, mes: `Tải lên thất bại ${failedCount}/${jobs.length} file. ${lastError || ''}` });
        }
    };

    const handleStartUpload = (files) => {
        const jobs = files.map((file, index) => ({
            key: `upload-${Date.now()}-${index}`,
            file,
            type: file.type.startsWith('video') ? 'video' : 'image'
        }));
        const queue = jobs.map(job => ({
            key: job.key,
            type: job.type,
            previewUrl: URL.createObjectURL(job.file),
            status: 'uploading',
            percent: 0,
            driveId: ''
        }));
        uploadUrlsRef.current = queue.map(item => item.previewUrl);
        setUploadQueue(queue);
        setIsUploading(true);
        runUploadLoop(jobs);
    };

    const toggleSelectItem = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;
        setDeleting(true);
        let success = 0, fail = 0;
        for (const id of selectedIds) {
            try {
                const res = await fetch(`/api/updateimage?id=${id}`, { method: 'DELETE' });
                const json = await res.json();
                if (res.ok && json.status === 2) success++;
                else fail++;
            } catch {
                fail++;
            }
        }
        setDeleting(false);
        setSelectMode(false);
        setSelectedIds(new Set());
        if (success > 0) {
            setMediaItems(prev => prev.filter(item => !selectedIds.has(item.id)));
            setNoti({ open: true, status: true, mes: `Đã xóa ${success} file.${fail > 0 ? ` ${fail} file thất bại.` : ''}` });
            await handleUploadFinish();
        } else {
            setNoti({ open: true, status: false, mes: 'Xóa thất bại.' });
        }
    };

    const handleCloseModal = () => {
        if (isUploading) {
            const confirmClose = window.confirm(
                'Đang trong quá trình tải lên. Bạn có chắc chắn muốn đóng? Upload vẫn tiếp tục ngầm và thư viện sẽ cập nhật khi xong.'
            );
            if (!confirmClose) return;
        }
        setPopupOpen(false);
    };

    if (!session?.Image) return null;

    return (
        <>
            <Noti
                open={noti.open}
                onClose={() => setNoti({ ...noti, open: false })}
                status={noti.status}
                mes={noti.mes}
                button={
                    <button
                        onClick={() => setNoti({ ...noti, open: false })}
                        className="w-full p-3 border-none rounded-lg bg-[var(--main_d)] text-white text-base cursor-pointer font-medium mt-2"
                    >
                        Đã hiểu
                    </button>
                }
            />

            <div
                className="flex flex-col items-start gap-1 p-4 rounded border border-[var(--border-color)] no-underline cursor-pointer"
                onClick={() => setPopupOpen(true)}
            >
                <img src={'https://assets.minimals.cc/public/assets/icons/files/ic-img.svg'} alt="icon" loading="lazy" className="w-8 h-8" />
                <div className="mt-1 text-base text-[var(--text-primary)]">Hình ảnh & Video</div>
            </div>

            {isPopupOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center" onMouseDown={handleCloseModal}>
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="relative bg-[var(--bg-primary)] rounded-lg shadow-lg flex flex-col max-h-[90vh] w-[90%] max-w-[1100px]" onMouseDown={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
                            <h3 className="m-0 text-xl">{isUploaderOpen ? 'Tải lên file mới' : 'Thư viện hình ảnh & video'}</h3>
                            <button className="bg-transparent border-none text-2xl cursor-pointer" onClick={handleCloseModal}>&times;</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {isUploaderOpen ? (
                                <UploadManager
                                    ref={uploaderRef}
                                    onClose={() => setUploaderOpen(false)}
                                    onStartUpload={handleStartUpload}
                                />
                            ) : (
                                <MediaGallery
                                    session={session}
                                    mediaItems={mediaItems}
                                    uploadingItems={uploadQueue}
                                    onAdd={() => setUploaderOpen(true)}
                                    onMediaClick={selectMode ? undefined : setLightboxMedia}
                                    selectMode={selectMode}
                                    selectedIds={selectedIds}
                                    onToggleSelect={toggleSelectItem}
                                    onStartSelect={() => { setSelectMode(true); setSelectedIds(new Set()); }}
                                    onCancelSelect={() => { setSelectMode(false); setSelectedIds(new Set()); }}
                                    onDeleteSelected={handleDeleteSelected}
                                    deleting={deleting}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox xem chi tiết file */}
            <Lightbox
                mediaItem={lightboxMedia}
                folderId={session?.Image}
                onClose={() => setLightboxMedia(null)}
                onUpdateSuccess={handleUploadFinish}
            />
        </>
    );
}
