'use client';
import React, { useEffect } from 'react';
import { IconClose } from '@/app/events/ui/icons';

/**
 * EventModal - Generic modal dialog wrapper with backdrop, header, body and footer
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div
                className={`w-full ${maxWidth} bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex items-center justify-between gap-3 bg-[var(--bg-secondary)]/50 shrink-0">
                    <div className="flex items-center gap-3">
                        {Icon && (
                            typeof Icon === 'function' ? (
                                <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-900 shrink-0">
                                    <Icon className="w-5 h-5" />
                                </span>
                            ) : (
                                Icon
                            )
                        )}
                        <div>
                            <h3 className="font-bold text-base sm:text-lg text-[var(--text-primary)]">
                                {title}
                            </h3>
                            {subtitle && (
                                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border-none bg-transparent cursor-pointer transition-colors shrink-0"
                    >
                        <IconClose className="w-4 h-4" />
                    </button>
                </div>

                {/* Form or Div Body */}
                <ContentWrapper {...wrapperProps} className="flex flex-col flex-1 overflow-hidden">
                    {/* Scrollable Body Content */}
                    <div className={`p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 text-sm sm:text-base flex-1 ${bodyClassName}`}>
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className="p-4 sm:p-5 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50 flex items-center justify-end gap-3 shrink-0">
                            {footer}
                        </div>
                    )}
                </ContentWrapper>
            </div>
        </div>
    );
}
