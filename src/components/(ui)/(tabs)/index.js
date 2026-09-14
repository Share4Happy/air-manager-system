'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Standard Reusable Scrollable Tabs Component (Natural Horizontal Scroll)
 *
 * @param {Array<{ id: string | number, label: string, icon?: React.ReactNode, count?: number | string, disabled?: boolean }>} tabs - List of tab objects
 * @param {string | number} activeTab - Currently active tab ID
 * @param {function} onTabChange - Callback invoked when tab is changed
 * @param {'pill' | 'segment' | 'underline'} variant - Visual variant (default: 'pill')
 * @param {'sm' | 'md'} size - Size of tabs (default: 'md' -> h-9)
 * @param {string} className - Extra CSS classes for outer container
 * @param {boolean} fullWidth - Whether to stretch container full width
 */
export default function Tabs({
    tabs = [],
    activeTab,
    onTabChange,
    variant = 'pill',
    size = 'md',
    className = '',
    fullWidth = false,
}) {
    const containerRef = useRef(null);
    const activeTabRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftState, setScrollLeftState] = useState(0);
    const [hasDragged, setHasDragged] = useState(false);
    const [showLeftGradient, setShowLeftGradient] = useState(false);
    const [showRightGradient, setShowRightGradient] = useState(false);

    // Auto-scroll active tab into view (centered)
    useEffect(() => {
        if (activeTabRef.current) {
            activeTabRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
            });
        }
    }, [activeTab]);

    // Check scroll boundaries to conditionally display edge gradient cues
    const checkScroll = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        const hasOverflow = el.scrollWidth > el.clientWidth + 2;
        setShowLeftGradient(hasOverflow && el.scrollLeft > 10);
        setShowRightGradient(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }, []);

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [checkScroll, tabs]);

    // Mouse drag-to-scroll handlers on desktop
    const handleMouseDown = (e) => {
        const el = containerRef.current;
        if (!el) return;
        setIsDragging(true);
        setHasDragged(false);
        setStartX(e.pageX - el.offsetLeft);
        setScrollLeftState(el.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const el = containerRef.current;
        if (!el) return;
        const x = e.pageX - el.offsetLeft;
        const walk = (x - startX) * 1.5;
        if (Math.abs(walk) > 4) {
            setHasDragged(true);
        }
        el.scrollLeft = scrollLeftState - walk;
        checkScroll();
    };

    const isSizeSm = size === 'sm';
    const heightClass = isSizeSm ? 'h-8 text-xs' : 'h-9 text-xs sm:text-sm';

    // Variant-specific styles
    let containerStyle = 'bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)] p-1';
    if (variant === 'segment') {
        containerStyle = 'bg-[var(--bg-secondary)] rounded-lg border border-gray-300 p-0.5';
    } else if (variant === 'underline') {
        containerStyle = 'border-b border-[var(--border-color)] bg-transparent p-0 gap-2';
    }

    return (
        <div className={`relative max-w-full ${fullWidth ? 'w-full' : 'w-full sm:w-fit'} shrink-0 ${className}`}>
            {/* Left fade indicator */}
            {showLeftGradient && (
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[var(--bg-primary)] to-transparent z-10 rounded-l-lg" />
            )}

            {/* Scrollable container */}
            <div
                ref={containerRef}
                onScroll={checkScroll}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                className={`flex items-center gap-1 ${containerStyle} overflow-x-auto scrollbar-none scroll-smooth shrink-0 overscroll-x-contain touch-pan-x select-none shadow-xs ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const isDisabled = tab.disabled;

                    let buttonClass = '';
                    if (variant === 'pill') {
                        buttonClass = `${heightClass} px-3.5 sm:px-4 rounded-md font-semibold transition-all cursor-pointer border-none whitespace-nowrap shrink-0 flex items-center gap-2 ${
                            isActive
                                ? 'bg-[var(--main_d)] text-white shadow-xs'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)] bg-transparent'
                        }`;
                    } else if (variant === 'segment') {
                        buttonClass = `${heightClass} px-3 rounded-md font-semibold transition-all cursor-pointer border-none whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                            isActive
                                ? 'bg-[var(--bg-primary)] text-[var(--main_d)] shadow-xs'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent'
                        }`;
                    } else if (variant === 'underline') {
                        buttonClass = `${heightClass} px-4 font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap shrink-0 flex items-center gap-2 bg-transparent ${
                            isActive
                                ? 'border-[var(--main_d)] text-[var(--main_d)] font-semibold'
                                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`;
                    }

                    if (isDisabled) {
                        buttonClass += ' opacity-40 cursor-not-allowed';
                    }

                    return (
                        <button
                            key={tab.id}
                            ref={isActive ? activeTabRef : null}
                            disabled={isDisabled}
                            onClick={() => {
                                if (!hasDragged && !isDisabled && onTabChange) {
                                    onTabChange(tab.id);
                                }
                            }}
                            className={buttonClass}
                        >
                            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span
                                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                        isActive
                                            ? variant === 'pill'
                                                ? 'bg-white/20 text-white'
                                                : 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Right fade indicator */}
            {showRightGradient && (
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[var(--bg-primary)] to-transparent z-10 rounded-r-lg" />
            )}
        </div>
    );
}
