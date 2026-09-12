'use client';

import React from 'react';

/**
 * Standard Responsive Toolbar Component
 *
 * @param {string} search - Current search string
 * @param {function} onSearchChange - Callback when search text changes
 * @param {string} searchPlaceholder - Placeholder for search input (default: "Tìm kiếm...")
 * @param {boolean} showFilters - Mobile filter accordion open state
 * @param {function} onToggleFilters - Callback to toggle mobile filter accordion
 * @param {boolean} hasActiveFilters - Whether any filter is currently active (highlights funnel icon)
 * @param {boolean} hasFilters - Whether the toolbar has filters (controls showing funnel button)
 * @param {React.ReactNode} mobileActions - Action buttons shown in mobile row before funnel (e.g. Add, Reload, Import)
 * @param {React.ReactNode} desktopActions - Inline filters and action buttons shown on desktop
 * @param {React.ReactNode} mobileFilters - Collapsible filter controls shown when funnel is opened on mobile
 * @param {React.ReactNode} children - Optional extra elements (such as tab switchers)
 * @param {string} className - Optional extra class names for container
 */
export default function Toolbar({
    search,
    onSearchChange,
    searchPlaceholder = 'Tìm kiếm...',
    showFilters = false,
    onToggleFilters,
    hasActiveFilters = false,
    hasFilters = true,
    mobileActions,
    desktopActions,
    mobileFilters,
    children,
    className = '',
}) {
    return (
        <div className={`flex flex-col gap-2 p-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)] mt-2 ${className}`}>
            {/* Main Toolbar Row */}
            <div className="flex items-center gap-2 md:gap-3 w-full">
                {/* Search Input */}
                {onSearchChange !== undefined && (
                    <input
                        className="px-2.5 py-2 border border-gray-200 rounded-lg bg-white text-sm outline-none resize-none text-[var(--text-primary)] flex-1 min-w-0"
                        placeholder={searchPlaceholder}
                        value={search ?? ''}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                )}

                {/* Mobile Action Buttons */}
                {mobileActions && (
                    <div className="md:hidden flex items-center gap-1.5 shrink-0">
                        {mobileActions}
                    </div>
                )}

                {/* Mobile Funnel Button (always far right on mobile) */}
                {hasFilters && onToggleFilters && (
                    <button
                        type="button"
                        className={`md:hidden flex items-center justify-center w-8 h-8 rounded-full border cursor-pointer transition-colors shrink-0 ${
                            showFilters || hasActiveFilters
                                ? 'bg-blue-50 border-blue-300 text-blue-600'
                                : 'border-[var(--border-color)] bg-white text-[var(--text-secondary)]'
                        }`}
                        onClick={onToggleFilters}
                        title="Bộ lọc"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={14} height={14} fill="currentColor">
                            <path d="M3.9 54.9C10.5 40.9 24.5 32 40 32l432 0c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9 320 448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6l0-79.1L9 97.5C-.7 85.4-2.8 68.8 3.9 54.9z"/>
                        </svg>
                    </button>
                )}

                {/* Desktop Inline Controls */}
                {desktopActions && (
                    <div className="hidden md:flex items-center gap-2 md:gap-3 shrink-0">
                        {desktopActions}
                    </div>
                )}
            </div>

            {/* Extra content (e.g. Tab buttons row) */}
            {children}

            {/* Mobile Collapsible Filters */}
            {mobileFilters && (
                <div className={`${showFilters ? 'flex' : 'hidden'} md:hidden flex-col gap-2 pt-2 border-t border-[var(--border-color)]`}>
                    {mobileFilters}
                </div>
            )}
        </div>
    );
}
