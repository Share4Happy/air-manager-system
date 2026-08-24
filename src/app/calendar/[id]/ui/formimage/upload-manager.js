'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

const UploadManager = forwardRef(({ onClose, onStartUpload }, ref) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    useImperativeHandle(ref, () => ({
        requestClose: () => onClose()
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

    const handleSave = () => {
        if (selectedFiles.length === 0) {
            setError('Vui lòng chọn ít nhất một file.');
            return;
        }
        onStartUpload(selectedFiles);
        onClose();
    };

    return (
        <div className="flex flex-col gap-4 p-4">
            <div
                className="p-8 border-2 border-dashed border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-center cursor-pointer transition-[background-color,border-color] duration-200 hover:bg-[#f1f5f9] hover:border-[#94a3b8]"
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
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
                                <button
                                    className="absolute top-1 right-1 w-6 h-6 rounded-full border-none bg-black/60 text-white text-base font-bold flex items-center justify-center cursor-pointer leading-none p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    onClick={() => handleRemoveFile(index)}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[#e2e8f0]">
                <button
                    className="px-3 py-2 bg-gray-200 rounded text-sm font-medium cursor-pointer border-none hover:bg-gray-300"
                    onClick={onClose}
                >
                    Hủy
                </button>
                <button
                    className={'px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5'}
                    onClick={handleSave}
                    style={{ background: 'var(--main_d)' }}
                    disabled={selectedFiles.length === 0}
                >
                    Tải lên ({selectedFiles.length}) file
                </button>
            </div>
        </div>
    );
});

UploadManager.displayName = 'UploadManager';

export default UploadManager;
