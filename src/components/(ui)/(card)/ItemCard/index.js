'use client';
import React from 'react';
import Link from 'next/link';

export default function ItemCard({
    href,
    onClick,
    borderBottomColor = 'var(--main_b)',
    avatar,
    avatarBg = 'var(--main_d)',
    topLabels,
    title,
    code,
    badge,
    subTitle,
    showDivider = true,
    infoRows = [],
    progress,
    topRightMenu,
    children,
    className = '',
    style = {},
}) {
    const headerTitle = title || code;

    const cardContent = (
        <div className="flex-1 flex flex-col justify-between">
            <div>
                {/* Header */}
                <div className="mb-2">
                    {topLabels && (
                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                            {topLabels}
                        </div>
                    )}

                    <div className="flex items-start">
                        {Boolean(avatar) && (
                            <div
                                className="w-11 h-11 rounded-md text-white flex items-center justify-center font-bold mr-3 shrink-0"
                                style={{ background: avatarBg }}
                            >
                                {avatar}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            {headerTitle && (
                                <div className="font-bold text-[var(--text-primary)] flex justify-between items-center text-base md:text-lg gap-2 pr-1 min-h-[44px] md:min-h-[48px]">
                                    <div className="flex-1 min-h-[44px] md:min-h-[48px] flex items-center">
                                        <span className="line-clamp-2 leading-snug">{headerTitle}</span>
                                    </div>
                                    {badge && (
                                        typeof badge === 'object' && badge.text ? (
                                            <span
                                                className="text-xs font-semibold text-white px-2.5 py-0.5 rounded-full shrink-0"
                                                style={{
                                                    background: badge.bg || badge.color || 'var(--main_b)',
                                                    borderRadius: 16,
                                                    padding: '3px 10px',
                                                    color: badge.textColor || 'white',
                                                    ...badge.style,
                                                }}
                                            >
                                                {badge.text}
                                            </span>
                                        ) : (
                                            badge
                                        )
                                    )}
                                </div>
                            )}
                            {subTitle && (
                                <p className="text-[var(--text-secondary)] text-sm font-medium mt-0.5 line-clamp-2 leading-snug">
                                    {subTitle}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Divider line between header/title and content */}
                {showDivider && (
                    <div className="border-t border-[var(--border-color)] my-2.5" />
                )}

                {/* Info rows */}
                <div className="flex flex-col gap-1">
                    {infoRows.map((row, idx) => (
                        <div key={idx} className={`flex gap-1.5 text-sm ${row.className || ''}`}>
                            <span className="font-semibold text-[var(--text-primary)] shrink-0">{row.label}</span>
                            <span className="text-[var(--text-secondary)] truncate">
                                {row.value ?? '-'}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Custom children / body slot */}
                {children}
            </div>

            {/* Progress footer */}
            {progress && (
                <div className="mt-3">
                    {React.isValidElement(progress) ? (
                        progress
                    ) : (
                        <div>
                            <div className="flex gap-1.5 mb-1.5 text-sm">
                                <span className="text-[var(--text-primary)] font-semibold">{progress.label || 'Tiến độ:'}</span>
                                <span className="text-[var(--text-secondary)] font-semibold">
                                    {progress.current ?? 0}/{progress.total ?? 0} {progress.unit || ''}
                                    {progress.percent !== undefined ? ` (${Math.round(progress.percent)}%)` : ''}
                                </span>
                            </div>

                            <div className="w-full h-2 rounded bg-[#e6e8f0] dark:bg-gray-800 overflow-hidden">
                                <div
                                    className="h-full rounded-l-[4px] transition-[width] duration-300"
                                    style={{
                                        width: `${Math.min(100, Math.max(0, progress.percent !== undefined ? progress.percent : (progress.total > 0 ? (progress.current / progress.total) * 100 : 0)))}%`,
                                        background: progress.barColor || '#3366ff',
                                    }}
                                    aria-label="progress"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div
            className={`bg-[var(--bg-primary)] rounded-lg p-3.5 md:p-4 w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.33%-11px)] xl:w-[calc(25%-12px)] border border-[var(--border-color)] transition-shadow duration-300 flex flex-col justify-between relative hover:cursor-pointer hover:shadow-[0_3px_8px_rgba(0,0,0,0.24)] ${className}`}
            style={{ borderBottom: `3px solid ${borderBottomColor}`, ...style }}
            onClick={onClick}
        >
            {topRightMenu && (
                <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                    {topRightMenu}
                </div>
            )}

            {href ? (
                <Link href={href} className="no-underline flex-1 flex flex-col justify-between text-inherit">
                    {cardContent}
                </Link>
            ) : (
                cardContent
            )}
        </div>
    );
}
