'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
    IconAlertTriangle,
    IconCheckCircle,
    IconInfo,
    IconClose,
    IconTrash,
    IconCheck,
} from '@/app/events/ui/icons';

const EventDialogContext = createContext(null);

export function useEventDialog() {
    const context = useContext(EventDialogContext);
    if (!context) {
        // Safe fallback if used outside provider
        return {
            confirm: async ({ message, title }) => window.confirm(`${title ? title + '\n\n' : ''}${message}`),
            alert: async ({ message, title }) => window.alert(`${title ? title + '\n\n' : ''}${message}`),
            prompt: async ({ message, defaultValue }) => window.prompt(message, defaultValue),
            toast: ({ message }) => console.log('[Toast]', message),
        };
    }
    return context;
}

export default function EventDialogProvider({ children }) {
    const [dialogState, setDialogState] = useState({
        isOpen: false,
        type: 'confirm', // 'confirm' | 'alert' | 'prompt'
        variant: 'primary', // 'primary' | 'danger' | 'warning' | 'success' | 'info'
        title: '',
        message: '',
        confirmText: 'Xác nhận',
        cancelText: 'Hủy',
        inputValue: '',
        inputPlaceholder: '',
        resolve: null,
    });

    const [toasts, setToasts] = useState([]);
    const inputRef = useRef(null);

    // Auto focus input when prompt opens
    useEffect(() => {
        if (dialogState.isOpen && dialogState.type === 'prompt') {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [dialogState.isOpen, dialogState.type]);

    const confirm = useCallback((options) => {
        const opts = typeof options === 'string' ? { message: options } : (options || {});
        return new Promise((resolve) => {
            setDialogState({
                isOpen: true,
                type: 'confirm',
                variant: opts.danger ? 'danger' : (opts.variant || 'primary'),
                title: opts.title || (opts.danger ? 'Xác nhận thao tác' : 'Xác nhận'),
                message: opts.message || 'Bạn có chắc chắn muốn thực hiện thao tác này?',
                confirmText: opts.confirmText || (opts.danger ? 'Xác nhận xóa' : 'Xác nhận'),
                cancelText: opts.cancelText || 'Hủy',
                inputValue: '',
                inputPlaceholder: '',
                resolve,
            });
        });
    }, []);

    const alert = useCallback((options) => {
        const opts = typeof options === 'string' ? { message: options } : (options || {});
        return new Promise((resolve) => {
            setDialogState({
                isOpen: true,
                type: 'alert',
                variant: opts.variant || (opts.type === 'danger' || opts.type === 'error' ? 'danger' : opts.type === 'success' ? 'success' : opts.type === 'warning' ? 'warning' : 'info'),
                title: opts.title || (opts.type === 'success' ? 'Thành công' : opts.type === 'danger' || opts.type === 'error' ? 'Thông báo lỗi' : 'Thông báo'),
                message: opts.message || '',
                confirmText: opts.confirmText || 'Đã hiểu',
                cancelText: '',
                inputValue: '',
                inputPlaceholder: '',
                resolve,
            });
        });
    }, []);

    const prompt = useCallback((options) => {
        const opts = typeof options === 'string' ? { message: options } : (options || {});
        return new Promise((resolve) => {
            setDialogState({
                isOpen: true,
                type: 'prompt',
                variant: opts.variant || 'primary',
                title: opts.title || 'Nhập thông tin',
                message: opts.message || '',
                confirmText: opts.confirmText || 'Lưu',
                cancelText: opts.cancelText || 'Hủy',
                inputValue: opts.defaultValue || '',
                inputPlaceholder: opts.placeholder || 'Nhập tại đây...',
                resolve,
            });
        });
    }, []);

    const toast = useCallback((options) => {
        const opts = typeof options === 'string' ? { message: options, type: 'info' } : (options || {});
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const newToast = {
            id,
            message: opts.message || '',
            type: opts.type || 'info', // 'info' | 'success' | 'warning' | 'error'
            duration: opts.duration || 3200,
        };

        setToasts((prev) => [...prev, newToast]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, newToast.duration);
    }, []);

    const handleConfirm = () => {
        if (dialogState.resolve) {
            if (dialogState.type === 'prompt') {
                dialogState.resolve(dialogState.inputValue.trim());
            } else {
                dialogState.resolve(true);
            }
        }
        setDialogState((prev) => ({ ...prev, isOpen: false }));
    };

    const handleCancel = () => {
        if (dialogState.resolve) {
            if (dialogState.type === 'prompt') {
                dialogState.resolve(null);
            } else {
                dialogState.resolve(false);
            }
        }
        setDialogState((prev) => ({ ...prev, isOpen: false }));
    };

    // Keyboard support: Escape closes, Enter submits
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!dialogState.isOpen) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
            } else if (e.key === 'Enter' && dialogState.type !== 'alert') {
                // If not in a multiline textarea
                if (e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    handleConfirm();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dialogState]);

    const renderVariantIcon = () => {
        switch (dialogState.variant) {
            case 'danger':
                return (
                    <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/60 shadow-xs">
                        <IconTrash className="w-5 h-5" />
                    </div>
                );
            case 'warning':
                return (
                    <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900/60 shadow-xs">
                        <IconAlertTriangle className="w-5 h-5" />
                    </div>
                );
            case 'success':
                return (
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
                        <IconCheckCircle className="w-5 h-5" />
                    </div>
                );
            default:
                return (
                    <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-900/60 shadow-xs">
                        <IconInfo className="w-5 h-5" />
                    </div>
                );
        }
    };

    return (
        <EventDialogContext.Provider value={{ confirm, alert, prompt, toast }}>
            {children}

            {/* Event-Scoped Dialog Modal */}
            {dialogState.isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-150"
                    >
                        {/* Header & Body */}
                        <div className="p-5 sm:p-6 flex flex-col gap-4">
                            <div className="flex items-start gap-3.5">
                                {renderVariantIcon()}
                                <div className="flex flex-col gap-1 min-w-0 flex-1 pt-0.5">
                                    <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-snug">
                                        {dialogState.title}
                                    </h3>
                                    {dialogState.message && (
                                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                                            {dialogState.message}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-[var(--bg-secondary)] border-none bg-transparent cursor-pointer transition-colors"
                                >
                                    <IconClose className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Prompt Input if type is 'prompt' */}
                            {dialogState.type === 'prompt' && (
                                <div className="mt-1">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={dialogState.inputValue}
                                        onChange={(e) => setDialogState({ ...dialogState, inputValue: e.target.value })}
                                        placeholder={dialogState.inputPlaceholder}
                                        className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs sm:text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Actions Footer */}
                        <div className="px-5 py-3.5 sm:px-6 sm:py-4 bg-[var(--bg-secondary)]/50 border-t border-[var(--border-color)] flex items-center justify-end gap-2.5">
                            {dialogState.type !== 'alert' && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                                >
                                    {dialogState.cancelText}
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handleConfirm}
                                className={`px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-semibold transition-all border-none cursor-pointer shadow-xs flex items-center gap-1.5 ${
                                    dialogState.variant === 'danger'
                                        ? 'bg-rose-600 hover:bg-rose-700'
                                        : dialogState.variant === 'warning'
                                        ? 'bg-amber-600 hover:bg-amber-700'
                                        : dialogState.variant === 'success'
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                {dialogState.variant === 'danger' ? (
                                    <IconTrash className="w-3.5 h-3.5" />
                                ) : (
                                    <IconCheck className="w-3.5 h-3.5" />
                                )}
                                <span>{dialogState.confirmText}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Toast Container */}
            {toasts.length > 0 && (
                <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                    {toasts.map((t) => (
                        <div
                            key={t.id}
                            className={`p-3.5 rounded-xl border shadow-xl flex items-center gap-2.5 pointer-events-auto transition-all animate-in slide-in-from-bottom-2 duration-200 ${
                                t.type === 'success'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                                    : t.type === 'error'
                                    ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                                    : t.type === 'warning'
                                    ? 'bg-amber-50 dark:bg-amber-950/90 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                                    : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]'
                            }`}
                        >
                            {t.type === 'success' && <IconCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
                            {t.type === 'error' && <IconAlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                            {t.type === 'warning' && <IconAlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
                            {t.type === 'info' && <IconInfo className="w-4 h-4 text-blue-600 shrink-0" />}
                            <span className="text-xs sm:text-sm font-medium leading-relaxed flex-1">
                                {t.message}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </EventDialogContext.Provider>
    );
}
