'use client';

import React, { useState, useRef } from 'react';
import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';
import { Svg_Pen } from '@/components/(icon)/svg';
import { driveThumbnailUrl, drivePreviewUrl } from '@/function';
import { uploadDirectToDrive } from './upload';

export default function Lightbox({ mediaItem, media, folderId, onClose, onUpdateSuccess, onReplaceSuccess }) {
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({
        open: false,
        status: false,
        mes: ''
    });
    const fileInputRef = useRef(null);

    const activeItem = mediaItem || media;
    const handleSuccess = onUpdateSuccess || onReplaceSuccess;

    if (!activeItem) return null;

    let fileUrl = '';
    if (activeItem.type === 'image') {
        fileUrl = driveThumbnailUrl(activeItem.id, 1200);
    } else if (activeItem.type === 'video') {
        fileUrl = drivePreviewUrl(activeItem.id);
    }

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        if (!file) return;

        if (activeItem.type === 'image' && !file.type.startsWith('image/')) {
            setNotification({
                open: true,
                status: false,
                mes: 'Loại file không hợp lệ. Vui lòng chọn một file HÌNH ẢNH để thay thế.'
            });
            return;
        }
        if (activeItem.type === 'video' && !file.type.startsWith('video/')) {
            setNotification({
                open: true,
                status: false,
                mes: 'Loại file không hợp lệ. Vui lòng chọn một file VIDEO để thay thế.'
            });
            return;
        }

        setIsLoading(true);

        try {
            const fileType = activeItem.type;
            const res = await uploadDirectToDrive(file, folderId, {
                fileType,
                oldImageId: activeItem.id,
                timeoutMs: fileType === 'video' ? 600000 : 120000
            });

            if (res.result.status !== 2) {
                throw new Error(res.result.mes || 'Có lỗi xảy ra khi cập nhật.');
            }

            if (handleSuccess) {
                await handleSuccess();
            }

            onClose();

        } catch (err) {
            console.error('Lỗi cập nhật media:', err);
            setNotification({
                open: true,
                status: false,
                mes: err.message || 'Lỗi cập nhật file.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);

        try {
            const response = await fetch(`/api/updateimage?id=${activeItem.id}`, {
                method: 'DELETE',
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.mes || 'Xóa file thất bại.');
            }

            if (handleSuccess) {
                await handleSuccess();
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
                        accept={activeItem.type === 'image' ? 'image/*' : 'video/*'}
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
                    {activeItem.type === 'image' ? (
                        <img
                            src={fileUrl}
                            alt="Ảnh phóng to"
                            onError={(e) => {
                                if (!e.currentTarget.dataset.retried) {
                                    e.currentTarget.dataset.retried = '1';
                                    e.currentTarget.src = `https://lh3.googleusercontent.com/d/${activeItem.id}`;
                                }
                            }}
                        />
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
