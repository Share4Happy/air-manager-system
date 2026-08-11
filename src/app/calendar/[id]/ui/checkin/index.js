'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Noti from '@/components/(features)/(noti)/noti';
import { formatDate, driveThumbnailUrl } from '@/function';

function parseStartMinutes(timeStr = '') {
    const start = (timeStr || '').split('-')[0]?.trim();
    const [h, m] = (start || '').split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
}

function computeStatus(day, startTime) {
    const startMin = parseStartMinutes(startTime);
    if (!day || startMin == null) return 'dung-gio';
    const now = new Date();
    const start = new Date(day);
    start.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
    return now > start ? 'tre' : 'dung-gio';
}

function formatDateTime(d) {
    const date = new Date(d);
    return `${formatDate(date)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const statusLabel = (st) => (st === 'tre' ? 'Trễ' : 'Đúng giờ');
const statusColor = (st) => (st === 'tre' ? 'var(--red)' : 'var(--green)');

export default function CheckinPopup({ sessionId, buoi, day, startTime, checkin, onClose, onDone }) {
    const [selected, setSelected] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [facing, setFacing] = useState('environment');
    const [cameraErr, setCameraErr] = useState(null);
    const [noti, setNoti] = useState({ open: false, status: false, mes: '' });
    const urlRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const previewStatus = useMemo(() => computeStatus(day, startTime), [day, startTime]);

    useEffect(() => {
        return () => {
            if (urlRef.current) URL.revokeObjectURL(urlRef.current);
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (cameraActive && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [cameraActive]);

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setCameraActive(false);
    };

    const startCamera = async (mode) => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setNoti({ open: true, status: false, mes: 'Trình duyệt không hỗ trợ truy cập camera.' });
            return;
        }
        const desired = mode || facing;
        setCameraErr(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: desired, width: { ideal: 1280 } }
            });
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = stream;
            setFacing(desired);
            if (videoRef.current) videoRef.current.srcObject = stream;
            setCameraActive(true);
        } catch (err) {
            let mes = 'Không thể mở camera.';
            if (err?.name === 'NotAllowedError') mes = 'Bạn cần cho phép truy cập camera để chụp ảnh checkin.';
            else if (err?.name === 'NotFoundError' || err?.name === 'NotReadableError') mes = 'Không tìm thấy camera trên thiết bị.';
            setCameraErr(mes);
            setNoti({ open: true, status: false, mes });
        }
    };

    const flipCamera = () => startCamera(facing === 'environment' ? 'user' : 'environment');

    const capture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !video.videoWidth) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], 'camera.jpg', { type: 'image/jpeg' });
            if (urlRef.current) URL.revokeObjectURL(urlRef.current);
            const url = URL.createObjectURL(file);
            urlRef.current = url;
            setSelected({ file, url });
            stopCamera();
        }, 'image/jpeg', 0.9);
    };

    const notiBtn = (
        <button onClick={() => setNoti({ ...noti, open: false })}
            className="w-full p-3 border-none rounded-lg bg-[var(--main_d)] text-white text-base cursor-pointer font-medium mt-2">
            Đã hiểu
        </button>
    );

    const handleConfirm = async () => {
        if (!selected?.file || uploading) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('sessionId', sessionId);
        formData.append('image', selected.file);
        try {
            const res = await fetch('/api/checkin-photo', { method: 'POST', body: formData });
            const json = await res.json();
            if (res.ok && json.status === 2) {
                onDone?.(json.data?.status);
            } else if (json.code === 'ALREADY_CHECKED_IN') {
                onClose?.();
            } else {
                setNoti({ open: true, status: false, mes: json.mes || 'Checkin thất bại.' });
            }
        } catch {
            setNoti({ open: true, status: false, mes: 'Có lỗi xảy ra khi checkin.' });
        } finally {
            setUploading(false);
        }
    };

    if (checkin?.id) {
        return (
            <>
                <Noti open={noti.open} onClose={() => setNoti({ ...noti, open: false })} status={noti.status} mes={noti.mes} button={notiBtn} />
                <div className="p-4 w-full sm:min-w-[380px] flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <p className="text-base font-semibold text-[var(--text-primary)]">Đã checkin buổi {buoi || ''}</p>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: statusColor(checkin.status) }}>
                            {statusLabel(checkin.status)}
                        </span>
                    </div>
                    <div className="relative w-full aspect-video rounded-md overflow-hidden bg-[#e2e8f0]">
                        <img src={driveThumbnailUrl(checkin.id, 800)} alt="Ảnh checkin" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm text-[var(--text-primary)]">Thời gian checkin: {checkin.time ? formatDateTime(checkin.time) : '--'}</p>
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded text-sm font-medium cursor-pointer border-none hover:bg-gray-300">
                        Đóng
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <Noti open={noti.open} onClose={() => setNoti({ ...noti, open: false })} status={noti.status} mes={noti.mes} button={notiBtn} />
            <div className="p-4 w-full sm:min-w-[380px] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-[var(--text-primary)]">Checkin buổi {buoi || ''}</p>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: statusColor(previewStatus) }}>
                        {statusLabel(previewStatus)}
                    </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                    Ngày {day ? formatDate(new Date(day)) : '--'} – Bắt đầu {startTime?.split('-')[0]?.trim() || '--'}
                </p>

                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {cameraActive ? (
                    <div className="flex flex-col gap-3">
                        <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={capture}
                                className="flex-1 px-3 py-2.5 bg-[var(--green)] text-white text-sm font-medium rounded cursor-pointer border-none inline-flex items-center justify-center gap-2 hover:opacity-90">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/><path d="M9 2 7.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3.17L15 2H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/></svg>
                                Chụp
                            </button>
                            <button onClick={flipCamera}
                                className="flex-1 px-3 py-2.5 bg-[var(--main_b)] text-white text-sm font-medium rounded cursor-pointer border-none inline-flex items-center justify-center gap-2 hover:bg-[var(--main_d)]">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M16.5 6H15l-1.5-2h-3L9 6H7.5C6.67 6 6 6.67 6 7.5v9c0 .83.67 1.5 1.5 1.5h9c.83 0 1.5-.67 1.5-1.5v-9c0-.83-.67-1.5-1.5-1.5zM12 16.5c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm6.5-2.5c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5h-13c-.83 0-1.5-.67-1.5-1.5v-9c0-.83.67-1.5 1.5-1.5h13z"/></svg>
                                Đổi cam
                            </button>
                            <button onClick={stopCamera}
                                className="flex-1 px-3 py-2.5 bg-gray-200 text-gray-700 text-sm font-medium rounded cursor-pointer border-none inline-flex items-center justify-center gap-2 hover:bg-gray-300">
                                Hủy
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {cameraErr && (
                            <div className="text-xs text-[var(--red)] bg-[var(--red)]/10 border border-[var(--red)]/30 rounded-md px-3 py-2">
                                {cameraErr}
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            <button onClick={startCamera}
                                className="w-full px-3 py-2.5 bg-[var(--main_b)] text-white text-sm font-medium rounded cursor-pointer border-none inline-flex items-center justify-center gap-2 hover:bg-[var(--main_d)]">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/><path d="M9 2 7.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3.17L15 2H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/></svg>
                                Chụp ảnh
                            </button>
                        </div>

                        {selected ? (
                            <div className="relative w-full aspect-video rounded-md overflow-hidden bg-[#e2e8f0]">
                                <img src={selected.url} alt="Ảnh checkin đã chọn" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-full aspect-video rounded-md border-2 border-dashed border-[var(--border-color)] flex items-center justify-center text-xs text-[var(--text-secondary)]">
                                Chưa chọn ảnh
                            </div>
                        )}
                    </>
                )}

                {!cameraActive && (
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded text-sm font-medium cursor-pointer border-none hover:bg-gray-300">
                            Hủy
                        </button>
                        <button onClick={handleConfirm} disabled={!selected || uploading}
                            className="px-4 py-2 bg-[var(--green)] text-white text-sm font-medium rounded cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2">
                            {uploading && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {uploading ? 'Đang tải...' : 'Xác nhận checkin'}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
