'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/(ui)/(loading)/loading';
import { Re_lesson } from '@/data/course';
import Noti from '@/components/(features)/(noti)/noti';
import { Svg_Pen } from '@/components/(icon)/svg';
import Link from 'next/link';

function Lightbox({ mediaItem, onClose, onUpdateSuccess }) {
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({
        open: false,
        status: false,
        mes: ''
    });
    const fileInputRef = useRef(null);

    if (!mediaItem) return null;

    let fileUrl = '';
    if (mediaItem.type === 'image') {
        fileUrl = `https://drive.google.com/thumbnail?id=${mediaItem.id}&sz=w1200`;
    } else if (mediaItem.type === 'video') {
        fileUrl = `https://drive.google.com/file/d/${mediaItem.id}/preview`;
    }

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        if (!file) return;

        if (mediaItem.type === 'image' && !file.type.startsWith('image/')) {
            setNotification({
                open: true,
                status: false,
                mes: 'Loại file không hợp lệ. Vui lòng chọn một file HÌNH ẢNH để thay thế.'
            });
            return;
        }
        if (mediaItem.type === 'video' && !file.type.startsWith('video/')) {
            setNotification({
                open: true,
                status: false,
                mes: 'Loại file không hợp lệ. Vui lòng chọn một file VIDEO để thay thế.'
            });
            return;
        }

        setIsLoading(true);

        const formData = new FormData();
        formData.append('id', mediaItem.id);
        formData.append('newImage', file);

        try {
            const response = await fetch('/api/updateimage', {
                method: 'PUT',
                body: formData,
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.mes || 'Có lỗi xảy ra khi cập nhật.');
            }

            if (onUpdateSuccess) {
                await onUpdateSuccess();
            }

            onClose();

        } catch (err) {
            console.error('Lỗi cập nhật media:', err);
            setNotification({
                open: true,
                status: false,
                mes: err.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);

        try {
            const response = await fetch(`/api/updateimage?id=${mediaItem.id}`, {
                method: 'DELETE',
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.mes || 'Xóa file thất bại.');
            }

            if (onUpdateSuccess) {
                await onUpdateSuccess();
            }
            onClose();

        } catch (err) {
            console.error('Lỗi xóa media:', err);
            setNotification({
                open: true,
                status: false,
                mes: err.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const closeNotification = () => {
        setNotification({ open: false, status: false, mes: '' });
    };

    return (
        <>
            <Noti
                open={notification.open}
                onClose={closeNotification}
                status={notification.status}
                mes={notification.mes}
                button={
                    <button
                        onClick={closeNotification}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: 'var(--main_d, #007bff)',
                            color: 'white',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            fontWeight: '500',
                            marginTop: '8px'
                        }}
                    >
                        Đã hiểu
                    </button>
                }
            />
            <div className="fixed inset-0 bg-black/85 flex justify-center items-center z-[2000] cursor-pointer animate-[fadeIn_0.3s_ease]" onClick={onClose}>
                {isLoading && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center text-white z-10">
                        <Loading size={50} content={<p style={{ color: 'white' }}>Đang xử lý...</p>} />
                    </div>
                )}
                <div className="relative h-[80vh] w-auto max-w-[90vw] flex justify-center items-center cursor-default animate-[zoomIn_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept={mediaItem.type === 'image' ? 'image/*' : 'video/*'}
                        style={{ display: 'none' }}
                    />
                    <button className="absolute top-0 -right-[15px] w-[30px] h-[30px] bg-white text-[#333] border-none rounded font-light text-xl leading-[30px] text-center cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.3)] transition-transform duration-200 hover:-translate-y-0.5" onClick={onClose}>×</button>
                    <div className="absolute top-[32px] -right-[15px] w-[30px] h-[30px] bg-white text-[#333] border-none rounded font-light text-xl flex items-center justify-center text-center cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.3)] transition-transform duration-200 hover:-translate-y-0.5" onClick={triggerFileSelect}>
                        <Svg_Pen w={30} h={30} c={'var(--yellow)'} />
                    </div>
                    <button className="absolute top-[64px] -right-[15px] w-[30px] h-[30px] flex items-center justify-center border-2 border-white bg-[var(--red)] text-white rounded font-light text-xl text-center cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.3)] transition-transform duration-200 hover:-translate-y-0.5" onClick={handleDelete}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="16" height="16" fill='white'>
                            <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" />
                        </svg>
                    </button>
                    {mediaItem.type === 'image' ? (
                        <img src={fileUrl} alt="Ảnh phóng to" />
                    ) : (
                        <iframe
                            src={fileUrl}
                            width="640"
                            height="480"
                            allow="autoplay"
                            allowFullScreen
                            style={{ width: 'auto', height: '100%', aspectRatio: '16/9' }}
                        ></iframe>
                    )}
                </div>
            </div>
        </>
    );
}

function MediaGallery({ session, mediaItems = [], onAdd, onMediaClick, selectMode, selectedIds, onToggleSelect, onStartSelect, onCancelSelect, onDeleteSelected, deleting }) {
    const getDriveImageUrl = (id) => `https://drive.google.com/thumbnail?id=${id}&sz=w400`;

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <h4>Thư viện hình ảnh & video</h4>
                <div className="flex flex-wrap gap-2">
                    {!selectMode ? (
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <button onClick={onStartSelect}
                                className="w-full sm:w-auto px-3 py-2 bg-red-500 flex items-center justify-center gap-2 rounded text-white text-sm font-medium cursor-pointer border-none hover:bg-red-600">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                                Chọn nhiều
                            </button>
                            <div className="flex gap-2 w-full sm:flex-1">
                                <Link href={`https://drive.google.com/drive/folders/${session.Image}`} className='flex-1 px-3 py-2 bg-[var(--main_b)] flex items-center justify-center gap-2 rounded text-sm font-medium cursor-pointer border-none no-underline whitespace-nowrap hover:bg-[var(--main_d)]' target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>
                                    Đi tới Drive
                                </Link>
                                <button className={'flex-1 px-3 py-2 bg-[var(--main_b)] rounded text-sm font-medium whitespace-nowrap cursor-pointer border-none hover:bg-[var(--main_d)]'} onClick={onAdd} style={{ color: 'white' }}>
                                    + Thêm file
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <span className="text-sm text-[var(--text-primary)]">{selectedIds.size} đã chọn</span>
                            <button onClick={onCancelSelect}
                                className="flex-1 sm:flex-none px-3 py-2 bg-gray-300 rounded text-sm font-medium cursor-pointer border-none hover:bg-gray-400">
                                Hủy chọn
                            </button>
                            <button onClick={onDeleteSelected} disabled={selectedIds.size === 0 || deleting}
                                className="flex-1 sm:flex-none px-3 py-2 bg-red-600 rounded text-white text-sm font-medium cursor-pointer border-none hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                {deleting ? 'Đang xóa...' : `Xóa (${selectedIds.size})`}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {
                mediaItems.length === 0 ? (
                    <div className="flex-1 flex justify-center items-center p-12 text-center text-[#64748b] bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
                        <h5 style={{ fontStyle: 'italic' }}>Chưa có hình ảnh hoặc video nào.</h5>
                    </div>
                ) : (
                    <div className="flex-1 mr-[-16px] overflow-scroll [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-[#888] [&::-webkit-scrollbar-thumb]:rounded">
                        <div className="flex-1 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 overflow-y-auto pr-2">
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
                )
            }
        </div >
    );
}


//================================================================
// 2. COMPONENT TẢI FILE LÊN (POPUP 2) - ĐÃ CẬP NHẬT
//================================================================
const UploadManager = forwardRef(({
    session,
    onClose,
    onUploadFinish,
    onStartUpload,
    onProgressUpdate,
    onUploadComplete,
    isUploading // Nhận trạng thái isUploading từ cha
}, ref) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const uploadCancelled = useRef(false);

    useImperativeHandle(ref, () => ({
        requestClose: () => {
            if (isUploading && !uploadCancelled.current) {
                const confirmClose = window.confirm(
                    'Đang trong quá trình tải lên. Bạn có chắc chắn muốn hủy bỏ? Những file đã tải lên thành công sẽ được giữ lại.'
                );
                if (confirmClose) {
                    uploadCancelled.current = true;
                    onClose();
                }
            } else {
                onClose();
            }
        }
    }));

    useEffect(() => {
        const newPreviews = selectedFiles.map(file => ({
            url: URL.createObjectURL(file),
            type: file.type.startsWith('video') ? 'video' : 'image'
        }));
        setPreviews(newPreviews);
        return () => newPreviews.forEach(p => URL.revokeObjectURL(p.url));
    }, [selectedFiles]);

    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;
        const acceptedFiles = files.filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));
        setError(acceptedFiles.length !== files.length ? 'Một số tệp không được hỗ trợ và đã bị loại bỏ.' : '');
        setSelectedFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
    };

    const handleRemoveFile = (indexToRemove) => {
        setSelectedFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    };

    const handleSave = async () => {
        if (selectedFiles.length === 0) {
            setError('Vui lòng chọn ít nhất một file.');
            return;
        }

        // Đóng popup tải file và bắt đầu hiển thị progress ngoài màn hình chính
        onClose();
        onStartUpload(selectedFiles.length);
        uploadCancelled.current = false;

        let successCount = 0;
        let failedCount = 0;
        let fileIndex = 0;

        for (const file of selectedFiles) {
            if (uploadCancelled.current) {
                onProgressUpdate({ lastError: 'Quá trình tải lên đã bị hủy bởi người dùng.' });
                break;
            }

            fileIndex++;
            onProgressUpdate({ currentFile: `(${fileIndex}/${selectedFiles.length}) ${file.name}`, lastError: '' });

            try {
                const fileType = file.type.startsWith('video') ? 'video' : 'image';
                const formData = new FormData();
                formData.append('folderId', session.Image);
                formData.append('images', file);
                formData.append('fileType', fileType);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000);
                const response = await fetch('/api/updateimage', { method: 'POST', body: formData, signal: controller.signal });
                clearTimeout(timeoutId);
                const contentType = response.headers.get('content-type');
                const text = await response.text();
                if (!text) throw new Error(`Server trả về phản hồi rỗng (status: ${response.status}, contentType: ${contentType})`);
                let result;
                try {
                    result = JSON.parse(text);
                } catch {
                    throw new Error(`Server trả về dữ liệu không phải JSON (status: ${response.status}): ${text.slice(0, 200)}`);
                }
                if (!response.ok || result.status !== 2) throw new Error(result.mes || 'Lỗi không xác định từ server');

                const uploaded = result.data?.[0];
                if (uploaded?.id) {
                    successCount++;
                    onProgressUpdate({ success: successCount });
                } else {
                    throw new Error("API không trả về ID của file.");
                }

            } catch (err) {
                console.error(`Lỗi tải lên file ${file.name}:`, err);
                failedCount++;
                const userMsg = err.message?.includes('oauth2') || err.message?.includes('token')
                    ? 'Lỗi xác thực kết nối Google Drive (token/service account)'
                    : err.message || 'Lỗi không xác định';
                onProgressUpdate({ failed: failedCount, lastError: `Tệp "${file.name}": ${userMsg}` });
            }
        }

        await onUploadFinish(); // Refresh dữ liệu
        onUploadComplete(); // Báo cho cha biết đã hoàn tất để ẩn progress bar
    };

    // Component này chỉ hiển thị giao diện chọn file, không hiển thị progress nữa
    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="p-8 border-2 border-dashed border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-center cursor-pointer transition-[background-color,border-color] duration-200 hover:bg-[#f1f5f9] hover:border-[#94a3b8]" onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                <p className='text-sm font-semibold text-[var(--text-primary)]'>Nhấn để chọn hoặc kéo thả file</p>
                <p className='text-xs font-normal text-[var(--text-primary)]'>Hỗ trợ hình ảnh và video</p>
            </div>

            {error && <p className="text-[#dc2626] text-sm text-center m-0 font-bold">{error}</p>}

            {previews.length > 0 && (
                <>
                    <p className='text-xs font-medium text-[var(--text-primary)]'>Đã chọn: {previews.length} file</p>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3 max-h-[40vh] overflow-y-auto p-2 bg-[#f1f5f9] rounded-lg">
                        {previews.map((p, index) => (
                            <div key={index} className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#e2e8f0] group">
                                {p.type === 'image' ? (
                                    <img src={p.url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                ) : (
                                    <video src={p.url} muted className="w-full h-full object-cover" />
                                )}
                                <button className="absolute top-1 right-1 w-6 h-6 rounded-full border-none bg-black/60 text-white text-base font-bold flex items-center justify-center cursor-pointer leading-none p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={() => handleRemoveFile(index)}>×</button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[#e2e8f0]">
                <button className="px-3 py-2 bg-gray-200 rounded text-sm font-medium cursor-pointer border-none hover:bg-gray-300" onClick={onClose}>
                    Hủy
                </button>
                <button className={'px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5'} onClick={handleSave} style={{ background: 'var(--main_d)' }} disabled={selectedFiles.length === 0}>
                    Tải lên ({selectedFiles.length}) file
                </button>
            </div>
        </div>
    );
});


//================================================================
// 3. COMPONENT CHÍNH ĐIỀU KHIỂN - ĐÃ CẬP NHẬT
//================================================================
export default function ImageUploader({ session, courseId, Version, onUploadSuccess }) {


    const router = useRouter();
    const [isPopupOpen, setPopupOpen] = useState(false);
    const [isUploaderOpen, setUploaderOpen] = useState(false);
    const [mediaItems, setMediaItems] = useState(session?.DetailImage || []);
    const [lightboxMedia, setLightboxMedia] = useState(null);

    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [deleting, setDeleting] = useState(false);
    const [noti, setNoti] = useState({ open: false, status: false, mes: '' });

    // *** STATE MỚI ĐỂ QUẢN LÝ TIẾN TRÌNH UPLOAD Ở CẤP CAO NHẤT ***
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({
        total: 0, success: 0, failed: 0, currentFile: '', lastError: ''
    });

    const uploaderRef = useRef();

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

    // *** CÁC HÀM MỚI ĐỂ KIỂM SOÁT UI TIẾN TRÌNH ***
    const handleStartUpload = (totalFiles) => {
        setIsUploading(true);
        setUploadProgress({ total: totalFiles, success: 0, failed: 0, currentFile: '', lastError: '' });
    };

    const handleProgressUpdate = (update) => {
        setUploadProgress(prev => ({ ...prev, ...update }));
    };

    const handleUploadComplete = () => {
        setUploadProgress(prev => {
            if (prev.failed > 0) {
                setNoti({ open: true, status: false, mes: `Tải lên thất bại ${prev.failed}/${prev.total} file. ${prev.lastError || ''}` });
            }
            return prev;
        });
        setTimeout(() => {
            setIsUploading(false);
            onUploadSuccess?.();
        }, 3000);
    };

    const toggleSelectMode = () => {
        if (selectMode) {
            setSelectMode(false);
            setSelectedIds(new Set());
        } else {
            setSelectMode(true);
        }
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

    const renderUploadManager = () => (
        <UploadManager
            ref={uploaderRef}
            session={session}
            onClose={() => setUploaderOpen(false)}
            onUploadFinish={handleUploadFinish}
            // Truyền các hàm điều khiển xuống
            onStartUpload={handleStartUpload}
            onProgressUpdate={handleProgressUpdate}
            onUploadComplete={handleUploadComplete}
            isUploading={isUploading}
        />
    );

    const renderMediaGallery = () => (
        <MediaGallery
            session={session}
            mediaItems={mediaItems}
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
    );

    // *** LOGIC CHO GIAO DIỆN TIẾN TRÌNH TẢI LÊN ***
    const isComplete = isUploading && (uploadProgress.success + uploadProgress.failed === uploadProgress.total);
    const progressPercentage = uploadProgress.total > 0 ? ((uploadProgress.success + uploadProgress.failed) / uploadProgress.total) * 100 : 0;

    const renderFloatingProgress = () => {
        if (!isUploading) return null;

        return (
            <div className="flex flex-col p-3 fixed gap-2 top-5 right-5 min-w-[240px] z-[99999] bg-white rounded-lg shadow-[var(--boxshaw2)]">
                <div className="flex items-center justify-between gap-2">
                    <p className='text-sm font-semibold text-[var(--text-primary)] shrink-0'>{Math.round(progressPercentage)}%</p>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded bg-[var(--green)] shrink-0"></div>
                            <p className='text-xs text-[var(--text-primary)]'>{uploadProgress.success}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded bg-[var(--red)] shrink-0"></div>
                            <p className='text-xs text-[var(--text-primary)]'>{uploadProgress.failed}</p>
                        </div>
                        <p className='text-xs text-[var(--text-secondary)]'>/ {uploadProgress.total}</p>
                    </div>
                </div>
                <div className="w-full h-2 bg-[#e2e8f0] rounded overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#4ade80] to-[#22c55e] rounded transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
                </div>
                {uploadProgress.lastError && (
                    <p className="text-[#dc2626] text-xs italic">{uploadProgress.lastError}</p>
                )}
            </div>
        );
    };


    if (!session?.Image) return null;

    return (
        <>
            <Noti open={noti.open} onClose={() => setNoti({ ...noti, open: false })} status={noti.status} mes={noti.mes}
                button={<button onClick={() => setNoti({ ...noti, open: false })}
                    className="w-full p-3 border-none rounded-lg bg-[var(--main_d)] text-white text-base cursor-pointer font-medium mt-2">Đã hiểu</button>}
            />

            <div className="flex flex-col items-start gap-1 p-4 rounded border border-[var(--border-color)] no-underline cursor-pointer" onClick={() => setPopupOpen(true)}>
                <img src={'https://assets.minimals.cc/public/assets/icons/files/ic-img.svg'} alt="icon" loading="lazy" className="w-8 h-8" />
                <div className="mt-1 text-base text-[var(--text-primary)]">Hình ảnh & Video</div>
            </div>

            {isPopupOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center" onMouseDown={() => setPopupOpen(false)}>
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="relative bg-[var(--bg-primary)] rounded-lg shadow-lg flex flex-col max-h-[90vh] w-[90%] max-w-[1100px]" onMouseDown={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
                            <h3 className="m-0 text-xl">{isUploaderOpen ? 'Tải lên file mới' : 'Thư viện hình ảnh & video'}</h3>
                            <button className="bg-transparent border-none text-2xl cursor-pointer" onClick={() => setPopupOpen(false)}>&times;</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {isUploaderOpen ? renderUploadManager() : renderMediaGallery()}
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox xem chi tiết file */}
            <Lightbox
                mediaItem={lightboxMedia}
                onClose={() => setLightboxMedia(null)}
                onUpdateSuccess={handleUploadFinish}
            />

            {/* GIAO DIỆN TIẾN TRÌNH TẢI LÊN NỔI BÊN NGOÀI */}
            {renderFloatingProgress()}
        </>
    );
}
