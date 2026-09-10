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
    columns = [],
    data = [],
    keyExtractor = (row, idx) => row?.id || row?._id || idx,
    emptyState = null,
    rowClassName,
    minWidth = 'min-w-[750px]',
    containerClassName = '',
    tableClassName = '',
    footer,
    onRowClick,
}) {
    if (!data || data.length === 0) {
        if (emptyState && React.isValidElement(emptyState)) {
            return (
                <div className={`w-full bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xs ${containerClassName}`}>
                    {emptyState}
                </div>
            );
        }

        if (emptyState && typeof emptyState === 'object') {
            const { icon: EmptyIcon, title, description, action } = emptyState;
            return (
                <div className={`w-full bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xs ${containerClassName}`}>
                    <div className="p-16 text-center flex flex-col items-center justify-center gap-3.5">
                        {EmptyIcon && (
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <EmptyIcon className="w-7 h-7" />
                            </div>
                        )}
                        {title && (
                            <h4 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                                {title}
                            </h4>
                        )}
                        {description && (
                            <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-md">
                                {description}
                            </p>
                        )}
                        {action && <div className="mt-2">{action}</div>}
                    </div>
                </div>
            );
        }
    }

    const getAlignClass = (align) => {
        if (align === 'center') return 'text-center';
        if (align === 'right') return 'text-right';
        return 'text-left';
    };

    return (
        <div className={`w-full bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xs ${containerClassName}`}>
            <div className="w-full overflow-x-auto scrollbar-thin">
                <table className={`w-full text-sm sm:text-base text-left border-collapse ${minWidth} ${tableClassName}`}>
                    <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-[var(--text-secondary)] select-none">
                        <tr>
                            {columns.map((col, cIdx) => (
                                <th
                                    key={col.key || cIdx}
                                    className={`py-3.5 px-4 font-bold text-sm sm:text-base ${getAlignClass(col.align)} ${col.width || ''} ${col.headerClassName || ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {data.map((row, rIdx) => {
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
                        })}
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
