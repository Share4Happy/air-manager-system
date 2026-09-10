'use client';
import React from 'react';
import { IconSearch, IconClose } from '@/app/events/ui/icons';

/**
 * EventToolbar - Compact, standardized functional toolbar matching Gantt Timeline standard
 */
export default function EventToolbar({
    icon: Icon,
    iconClassName = 'w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0',
    title,
    badge,
    leftContent,
    primaryActions,
    search,
    filters,
    secondaryActions,
    children,
    containerClassName = '',
}) {
    const hasSearch = Boolean(search);
    const hasLeftHeader = Boolean(Icon || title || badge || leftContent);
    const hasBottomRow = Boolean(filters || secondaryActions);

    return (
        <div className={`bg-[var(--bg-primary)] p-3 sm:p-3.5 rounded-2xl border border-[var(--border-color)] shadow-xs flex flex-col gap-2.5 ${containerClassName}`}>
            {/* Main Row: Left (Search or Title/LeftContent) + Right (Primary Actions) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {/* Left side */}
                {hasSearch ? (
                    <div className="flex items-center gap-2 flex-1 max-w-md bg-[var(--bg-secondary)] px-3 py-1.5 rounded-xl border border-[var(--border-color)]">
                        <IconSearch className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={search.value || ''}
                            onChange={search.onChange}
                            placeholder={search.placeholder || 'Tìm kiếm...'}
                            className="w-full bg-transparent border-none text-[var(--text-primary)] text-xs sm:text-sm focus:outline-none placeholder:text-[var(--text-secondary)]"
                        />
                        {search.value && (
                            <button
                                type="button"
                                onClick={search.onClear || (() => search.onChange?.({ target: { value: '' } }))}
                                className="text-xs text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer p-0.5"
                                title="Xóa tìm kiếm"
                            >
                                <IconClose className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                ) : hasLeftHeader ? (
                    <div className="flex items-center gap-2.5">
                        {Icon && (
                            typeof Icon === 'function' ? (
                                <span className={iconClassName}>
                                    <Icon className="w-4 h-4" />
                                </span>
                            ) : (
                                Icon
                            )
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                            {title && (
                                <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] m-0">
                                    {title}
                                </h3>
                            )}
                            {badge}
                            {leftContent}
                        </div>
                    </div>
                ) : (
                    <div />
                )}

                {/* Right side */}
                {primaryActions && (
                    <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                        {primaryActions}
                    </div>
                )}
            </div>

            {/* Bottom Row: Filters & Secondary Actions */}
            {hasBottomRow && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border-color)]">
                    {filters}
                    {secondaryActions}
                </div>
            )}

            {/* Extra children (e.g. summary cards) */}
            {children}
        </div>
    );
}
