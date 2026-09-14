'use client';
import React, { useEffect } from 'react';
import { IconClose } from '@/app/events/ui/icons';

/**
 * EventModal - Unified modal dialog wrapper with backdrop, header, body and footer
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {Function} onClose - Close handler
 * @param {string|React.ReactNode} title - Modal title
 * @param {string|React.ReactNode} subtitle - Optional subtitle
 * @param {React.Component|React.ReactNode} icon - Optional icon
 * @param {string} maxWidth - Tailwind max-width class (default: 'max-w-lg')
 * @param {React.ReactNode} children - Modal content
 * @param {React.ReactNode} footer - Modal footer actions
 * @param {Function} onSubmit - Optional submit handler (wraps content in <form>)
 * @param {string} bodyClassName - Custom body styling
 */
export default function EventModal({
    isOpen,
    onClose,
    title,
    subtitle,
    icon: Icon,
    maxWidth = 'max-w-lg',
    children,
    footer,
    onSubmit,
    submitLabel = 'Lưu thông tin',
    cancelLabel = 'Hủy',
    loading = false,
    submitDisabled = false,
    hideFooter = false,
    bodyClassName = '',
}) {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const ContentWrapper = onSubmit ? 'form' : 'div';
    const wrapperProps = onSubmit ? { onSubmit } : {};

    const renderFooter = () => {
        if (hideFooter) return null;
        if (footer !== undefined) {
            return footer ? (
                <div className="px-5 py-3.5 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50 flex items-center justify-end gap-2.5 shrink-0">
                    {footer}
                </div>
            ) : null;
        }

        // Default footer when onSubmit or submitLabel is present
        return (
            <div className="px-5 py-3.5 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50 flex items-center justify-end gap-2.5 shrink-0">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors cursor-pointer disabled:opacity-50"
                >
                    {cancelLabel}
                </button>
                {onSubmit && (
                    <button
                        type="submit"
                        disabled={loading || submitDisabled}
                        className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 border-none cursor-pointer shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                        )}
                        <span>{submitLabel}</span>
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div
                className={`w-full ${maxWidth} bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between gap-3 bg-[var(--bg-secondary)]/40 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        {Icon && (
                            typeof Icon === 'function' ? (
                                <span className="w-9 h-9 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <Icon className="w-4.5 h-4.5" />
                                </span>
                            ) : (
                                Icon
                            )
                        )}
                        <div className="min-w-0">
                            <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] leading-snug truncate">
                                {title}
                            </h3>
                            {subtitle && (
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] cursor-pointer transition-colors shrink-0"
                    >
                        <IconClose className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Form or Div Body */}
                <ContentWrapper {...wrapperProps} className="flex flex-col flex-1 overflow-hidden">
                    {/* Scrollable Body Content */}
                    <div className={`p-4 sm:p-5 overflow-y-auto flex flex-col gap-3.5 text-xs sm:text-sm flex-1 ${bodyClassName}`}>
                        {children}
                    </div>

                    {/* Footer */}
                    {renderFooter()}
                </ContentWrapper>
            </div>
        </div>
    );
}
