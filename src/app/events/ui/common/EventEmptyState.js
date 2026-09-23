'use client';
import React from 'react';

/**
 * Reusable empty state view for event tabs and tables
 */
export default function EventEmptyState({
    icon: IconComponent,
    title = 'Chưa có dữ liệu',
    description = '',
    actionLabel = '',
    onAction = null,
    className = '',
}) {
    return (
        <div className={`text-center py-12 px-4 rounded-2xl border border-dashed border-[var(--border-color)] bg-gray-50/50 dark:bg-gray-900/20 flex flex-col items-center justify-center ${className}`}>
            {IconComponent && (
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 shadow-2xs">
                    <IconComponent className="w-6 h-6" />
                </div>
            )}
            <h4 className="text-sm font-bold text-[var(--text-primary)] m-0">
                {title}
            </h4>
            {description && (
                <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-md mx-auto leading-relaxed">
                    {description}
                </p>
            )}
            {actionLabel && onAction && (
                <button
                    type="button"
                    onClick={onAction}
                    className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold border-none cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
                >
                    <span>{actionLabel}</span>
                </button>
            )}
        </div>
    );
}
