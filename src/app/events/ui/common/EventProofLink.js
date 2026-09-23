'use client';
import React, { useState } from 'react';
import { useEventDialog } from './EventDialogProvider';
import {
    IconLink,
    IconExternalLink,
    IconCopy,
    IconCheck,
    IconEdit,
    IconTrash,
    IconClose,
} from '@/app/events/ui/icons';

/**
 * Reusable Proof/Drive Link component for Roadmap tasks, Budget items, Media, etc.
 */
export default function EventProofLink({
    link = '',
    onSaveLink,
    onRemoveLink,
    canEdit = true,
    permissionWarning = 'Bạn không có quyền chỉnh sửa link minh chứng này.',
    placeholder = 'Dán link minh chứng (Google Drive, Docs, Ảnh, Báo cáo...)',
    label = 'Minh chứng',
    compact = false,
    className = '',
}) {
    const dialog = useEventDialog();
    const [isInputOpen, setIsInputOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const handleOpenInput = () => {
        if (!canEdit) {
            dialog.alert(permissionWarning, { title: 'Không có quyền', type: 'warning' });
            return;
        }
        setInputValue(link || '');
        setIsInputOpen(true);
    };

    const handleSave = (e) => {
        e?.preventDefault();
        if (!canEdit) {
            dialog.alert(permissionWarning, { title: 'Không có quyền', type: 'warning' });
            return;
        }
        const trimmed = inputValue.trim();
        onSaveLink?.(trimmed);
        setIsInputOpen(false);
        dialog.toast('Đã lưu link minh chứng', 'success');
    };

    const handleRemove = async () => {
        if (!canEdit) {
            dialog.alert(permissionWarning, { title: 'Không có quyền', type: 'warning' });
            return;
        }
        const ok = await dialog.confirm('Bạn có muốn gỡ bỏ đường link minh chứng này?', {
            title: 'Gỡ link minh chứng',
            type: 'warning',
            confirmText: 'Gỡ link',
        });
        if (!ok) return;
        setInputValue('');
        if (onRemoveLink) {
            onRemoveLink();
        } else {
            onSaveLink?.('');
        }
        setIsInputOpen(false);
        dialog.toast('Đã gỡ link minh chứng', 'info');
    };

    const handleCopy = () => {
        if (!link) return;
        navigator.clipboard.writeText(link);
        setIsCopied(true);
        dialog.toast('Đã sao chép link minh chứng vào clipboard', 'success');
        setTimeout(() => setIsCopied(false), 2000);
    };

    const isDrive = link && /drive\.google\.com|docs\.google\.com/i.test(link);

    return (
        <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
            {isInputOpen ? (
                <form onSubmit={handleSave} className="flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-400 bg-gray-100 dark:bg-gray-800 shadow-xs">
                        <IconLink className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <input
                            type="text"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            placeholder={placeholder}
                            className="w-56 sm:w-72 text-xs bg-transparent border-none focus:outline-none text-[var(--text-primary)]"
                            autoFocus
                        />
                        {inputValue && (
                            <button
                                type="button"
                                onClick={() => setInputValue('')}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 border-none bg-transparent cursor-pointer p-0.5"
                                title="Xóa ô nhập"
                            >
                                <IconClose className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold border-none cursor-pointer shadow-xs transition-all"
                    >
                        Lưu
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsInputOpen(false)}
                        className="px-2.5 py-1.5 rounded-xl bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-[var(--text-secondary)] text-xs font-medium border-none cursor-pointer"
                    >
                        Hủy
                    </button>
                </form>
            ) : link ? (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs shadow-2xs group max-w-full">
                    {isDrive ? (
                        <svg className="w-3.5 h-3.5 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7.71 3.5L1.15 15l3.43 6 6.55-11.43L7.71 3.5zm3.43 6l4.28 7.5H2.57l3.43-6h5.14zm5.15-6l6.56 11.43-3.43 6-6.56-11.43 3.43-6z" />
                        </svg>
                    ) : (
                        <IconLink className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    )}
                    <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 truncate max-w-[140px] sm:max-w-[180px]"
                        title={link}
                    >
                        <span>{label}</span>
                        <IconExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
                    </a>

                    <button
                        type="button"
                        onClick={handleCopy}
                        className="p-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 border-none bg-transparent cursor-pointer rounded transition-colors"
                        title={isCopied ? 'Đã sao chép!' : 'Sao chép đường link'}
                    >
                        {isCopied ? <IconCheck className="w-3 h-3 text-emerald-600" /> : <IconCopy className="w-3 h-3" />}
                    </button>

                    {canEdit && (
                        <>
                            <button
                                type="button"
                                onClick={handleOpenInput}
                                className="p-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 border-none bg-transparent cursor-pointer rounded transition-colors"
                                title="Đổi link minh chứng"
                            >
                                <IconEdit className="w-3 h-3" />
                            </button>
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="p-1 text-rose-500 hover:text-rose-700 dark:text-rose-400 border-none bg-transparent cursor-pointer rounded transition-colors"
                                title="Gỡ link minh chứng"
                            >
                                <IconTrash className="w-3 h-3" />
                            </button>
                        </>
                    )}
                </div>
            ) : canEdit ? (
                <button
                    type="button"
                    onClick={handleOpenInput}
                    className={`inline-flex items-center gap-1 ${
                        compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
                    } rounded-lg text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-400 transition-all cursor-pointer`}
                    title="Gắn link Google Drive hoặc minh chứng"
                >
                    <IconLink className="w-3 h-3" />
                    <span>Gắn link</span>
                </button>
            ) : (
                <span className="text-xs text-gray-400 italic">Chưa có</span>
            )}
        </div>
    );
}
