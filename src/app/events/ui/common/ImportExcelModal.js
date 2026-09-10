'use client';
import React, { useState, useRef } from 'react';
import {
    IconUpload,
    IconDownload,
    IconLightbulb,
} from '@/app/events/ui/icons';
import EventModal from './EventModal';

export default function ImportExcelModal({
    isOpen,
    onClose,
    title = 'Import dữ liệu từ Excel',
    subtitle = 'Nhập file Excel/CSV để nạp nhanh danh sách dữ liệu',
    icon: IconComponent = IconUpload,
    templateUrl,
    templateButtonText = 'Tải file mẫu .xlsx',
    templateHint = 'Chưa có file mẫu? Tải file mẫu chuẩn để điền thông tin nhanh nhất.',
    uploadUrl,
    fieldName,
    radioName = 'importMode',
    appendLabel = 'Thêm vào danh sách hiện có',
    replaceLabel = 'Thay thế toàn bộ danh sách',
    onImportSuccess,
}) {
    const [importMode, setImportMode] = useState('append'); // 'append' or 'replace'
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setError('');
        }
    };

    const handleDownloadTemplate = () => {
        if (templateUrl) {
            window.open(templateUrl, '_blank');
        }
    };

    const handleExecuteImport = async (e) => {
        e?.preventDefault?.();
        setError('');
        if (!selectedFile) {
            setError('Vui lòng chọn file Excel hoặc CSV');
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('mode', importMode);

            const res = await fetch(uploadUrl, {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (res.ok && data.success) {
                const result = fieldName ? (data[fieldName] || []) : data;
                onImportSuccess?.(result);
                onClose();
            } else {
                setError(data.message || 'Lỗi khi xử lý import file');
            }
        } catch (err) {
            console.error('Import error:', err);
            setError('Đã có lỗi xảy ra trong quá trình xử lý file');
        } finally {
            setLoading(false);
        }
    };

    const modalTitle = (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                <IconComponent className="w-5 h-5 text-white" />
            </div>
            <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                    {title}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                    {subtitle}
                </p>
            </div>
        </div>
    );

    return (
        <EventModal
            isOpen={isOpen}
            onClose={onClose}
            title={modalTitle}
            maxWidth="max-w-2xl"
            onSubmit={handleExecuteImport}
            submitLabel="Xác nhận Import"
            loading={loading}
            submitDisabled={!selectedFile}
        >
            <div className="flex flex-col gap-4">
                {error && (
                    <div className="p-3 text-xs sm:text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
                        {error}
                    </div>
                )}

                {/* Drag & Drop File Zone */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[var(--border-color)] hover:border-blue-500 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-gray-50/50 dark:bg-gray-900/20 transition-all"
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 shadow-xs">
                        <IconUpload className="w-6 h-6" />
                    </div>
                    {selectedFile ? (
                        <div>
                            <p className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400">{selectedFile.name}</p>
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                                {(selectedFile.size / 1024).toFixed(1)} KB • Bấm để chọn file khác
                            </p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                                Nhấn để chọn file Excel hoặc kéo thả vào đây
                            </p>
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
                                Hỗ trợ định dạng: .xlsx, .xls, .csv (Tối đa 5MB)
                            </p>
                        </div>
                    )}
                </div>

                {/* Download template guidance */}
                {templateUrl && (
                    <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs sm:text-sm gap-3">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                            <IconLightbulb className="w-4 h-4 shrink-0 text-amber-500" />
                            <span>{templateHint}</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            className="px-3.5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors border-none cursor-pointer whitespace-nowrap shadow-xs flex items-center gap-1.5 shrink-0 text-xs sm:text-sm"
                        >
                            <IconDownload className="w-3.5 h-3.5" />
                            <span>{templateButtonText}</span>
                        </button>
                    </div>
                )}

                {/* Mode selector (Append vs Replace) */}
                <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm">
                    <span className="font-bold text-[var(--text-primary)]">Tùy chọn nhập:</span>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="radio"
                                name={radioName}
                                value="append"
                                checked={importMode === 'append'}
                                onChange={() => setImportMode('append')}
                                className="accent-blue-600"
                            />
                            <span className="text-[var(--text-primary)] font-medium">{appendLabel}</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="radio"
                                name={radioName}
                                value="replace"
                                checked={importMode === 'replace'}
                                onChange={() => setImportMode('replace')}
                                className="accent-blue-600"
                            />
                            <span className="text-rose-600 font-semibold">{replaceLabel}</span>
                        </label>
                    </div>
                </div>
            </div>
        </EventModal>
    );
}
