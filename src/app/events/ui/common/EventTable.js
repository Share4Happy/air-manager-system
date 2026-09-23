'use client';
import React from 'react';

/**
 * EventTable - Generic reusable data table for Event views
 * 
 * @param {Array} columns - Column configs: { key, header, align, width, headerClassName, cellClassName, render }
 * @param {Array} data - Array of row objects
 * @param {Function} keyExtractor - Function to extract unique row key
 * @param {Object|React.ReactNode} emptyState - Configuration or component to show when data is empty
 * @param {string|Function} rowClassName - Class names for <tr>
 * @param {string} minWidth - Minimum width for responsive horizontal scroll
 * @param {string} containerClassName - Custom container wrapper classes
 * @param {Function} onRowClick - Optional callback on row click
 */
export default function EventTable({
    title,
    titleIcon: TitleIcon,
    subtitle,
    headerRight,
    columns = [],
    data = [],
    keyExtractor = (row, idx) => row?.id || row?._id || idx,
    emptyState = null,
    rowClassName,
    minWidth = 'min-w-[750px]',
    containerClassName = '',
    tableClassName = '',
    maxHeight,
    stickyHeader = true,
    footer,
    onRowClick,
}) {
    const hasHeaderBar = Boolean(title || subtitle || headerRight || TitleIcon);

    const renderHeaderBar = () => {
        if (!hasHeaderBar) return null;
        return (
            <div className="px-5 py-3.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-transparent dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-transparent border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                    {TitleIcon && (
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <TitleIcon className="w-4 h-4" />
                        </div>
                    )}
                    <div>
                        {title && (
                            <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] uppercase tracking-wide flex items-center gap-2">
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
                {headerRight && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                        {headerRight}
                    </div>
                )}
            </div>
        );
    };

    const getAlignClass = (align) => {
        if (align === 'center') return 'text-center';
        if (align === 'right') return 'text-right';
        return 'text-left';
    };

    const renderEmptyState = () => {
        if (emptyState && React.isValidElement(emptyState)) {
            return emptyState;
        }

        if (emptyState && typeof emptyState === 'object') {
            const { icon: EmptyIcon, title: emptyTitle, description, action } = emptyState;
            return (
                <div className="p-12 sm:p-14 text-center flex flex-col items-center justify-center gap-3.5">
                    {EmptyIcon && (
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <EmptyIcon className="w-7 h-7" />
                        </div>
                    )}
                    {emptyTitle && (
                        <h4 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                            {emptyTitle}
                        </h4>
                    )}
                    {description && (
                        <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-md">
                            {description}
                        </p>
                    )}
                    {action && <div className="mt-2">{action}</div>}
                </div>
            );
        }

        return (
            <div className="p-10 text-center text-sm sm:text-base text-[var(--text-secondary)]">
                Chưa có dữ liệu hiển thị
            </div>
        );
    };

    return (
        <div className={`w-full bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xs flex flex-col ${containerClassName}`}>
            {renderHeaderBar()}
            <div className={`w-full overflow-x-auto scrollbar-thin ${maxHeight ? `overflow-y-auto ${maxHeight}` : ''}`}>
                <table className={`w-full text-sm sm:text-base text-left border-collapse ${minWidth} ${tableClassName}`}>
                    <thead className={`bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-[var(--text-secondary)] select-none ${stickyHeader ? 'sticky top-0 z-10 shadow-2xs' : ''}`}>
                        <tr>
                            {columns.map((col, cIdx) => (
                                <th
                                    key={col.key || cIdx}
                                    className={`py-3.5 px-4 font-bold text-xs sm:text-sm whitespace-nowrap bg-[var(--bg-secondary)] ${getAlignClass(col.align)} ${col.width || ''} ${col.headerClassName || ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {(!data || data.length === 0) ? (
                            <tr>
                                <td colSpan={columns.length || 1} className="p-0 border-none">
                                    {renderEmptyState()}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rIdx) => {
                                const customRowClass = typeof rowClassName === 'function' ? rowClassName(row, rIdx) : (rowClassName || '');
                                return (
                                    <tr
                                        key={keyExtractor(row, rIdx)}
                                        onClick={() => onRowClick?.(row, rIdx)}
                                        className={`hover:bg-[var(--bg-secondary)]/40 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${customRowClass}`}
                                    >
                                        {columns.map((col, cIdx) => {
                                            const val = col.key ? row[col.key] : undefined;
                                            const customCellClass = typeof col.cellClassName === 'function' ? col.cellClassName(val, row, rIdx) : (col.cellClassName || '');
                                            return (
                                                <td
                                                    key={col.key || cIdx}
                                                    className={`py-3.5 px-4 ${getAlignClass(col.align)} ${col.width || ''} ${customCellClass}`}
                                                >
                                                    {col.render ? col.render(val, row, rIdx) : (val ?? '-')}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    {footer && (
                        <tfoot className="border-t-2 border-[var(--border-color)] bg-[var(--bg-secondary)]/40 font-bold text-sm sm:text-base">
                            {footer}
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}
