'use client';
import React, { useState, useEffect, useRef } from 'react';
import { IconDotsVertical } from '@/app/events/ui/icons';

/**
 * ActionMenu - Self-contained dropdown action menu (3 dots)
 * 
 * @param {Array} items - Menu items: [{ label, icon: Icon, onClick, danger, divider, disabled }]
 * @param {'right'|'left'} align - Dropdown alignment
 * @param {string} buttonClassName - Custom trigger button classes
 * @param {React.Component} icon - Custom trigger icon
 * @param {string} title - Tooltip title
 */
export default function ActionMenu({
    items = [],
    align = 'right',
    buttonClassName,
    icon: CustomIcon,
    title = 'Thao tác',
}) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    const toggleOpen = (e) => {
        e.stopPropagation();
        setIsOpen((prev) => !prev);
    };

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isOpen]);

    const TriggerIcon = CustomIcon || IconDotsVertical;

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            <button
                type="button"
                onClick={toggleOpen}
                className={
                    buttonClassName ||
                    'w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border-color)] transition-colors cursor-pointer'
                }
                title={title}
            >
                <TriggerIcon className="w-4 h-4" />
            </button>

            {isOpen && (
                <div
                    className={`absolute z-30 mt-1 w-48 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-lg py-1 animate-in fade-in zoom-in-95 duration-150 ${
                        align === 'left' ? 'left-0' : 'right-0'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {items.map((item, idx) => {
                        if (item.divider) {
                            return <div key={idx} className="h-px bg-[var(--border-color)] my-1" />;
                        }

                        const Icon = item.icon;
                        const isDanger = item.danger;

                        return (
                            <button
                                key={idx}
                                type="button"
                                disabled={item.disabled}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                    item.onClick?.();
                                }}
                                className={`w-full px-3.5 py-2 text-left text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition-colors cursor-pointer border-none bg-transparent ${
                                    item.disabled
                                        ? 'opacity-40 cursor-not-allowed text-[var(--text-secondary)]'
                                        : isDanger
                                        ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                                }`}
                            >
                                {Icon && <Icon className={`w-4 h-4 shrink-0 ${isDanger ? 'text-rose-600' : 'text-[var(--text-secondary)]'}`} />}
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
