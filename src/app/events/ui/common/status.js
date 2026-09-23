'use client';
import React from 'react';

export const statusConfigMap = {
    planning: {
        value: 'planning',
        label: 'Đang chuẩn bị',
        color: '#3b82f6',
        bg: '#eff6ff',
        textColor: '#1d4ed8',
        borderColor: '#bfdbfe',
        barColor: '#3b82f6',
        dotColor: 'bg-blue-500',
    },
    upcoming: {
        value: 'upcoming',
        label: 'Sắp diễn ra',
        color: '#6366f1',
        bg: '#eef2ff',
        textColor: '#4338ca',
        borderColor: '#c7d2fe',
        barColor: '#6366f1',
        dotColor: 'bg-indigo-500',
    },
    happening: {
        value: 'happening',
        label: 'Đang diễn ra',
        color: '#f59e0b',
        bg: '#fffbeb',
        textColor: '#b45309',
        borderColor: '#fde68a',
        barColor: '#f59e0b',
        dotColor: 'bg-amber-500 animate-pulse',
    },
    completed: {
        value: 'completed',
        label: 'Đã hoàn thành',
        color: '#10b981',
        bg: '#ecfdf5',
        textColor: '#047857',
        borderColor: '#a7f3d0',
        barColor: '#10b981',
        dotColor: 'bg-emerald-500',
    },
    cancelled: {
        value: 'cancelled',
        label: 'Đã hủy',
        color: '#ef4444',
        bg: '#fef2f2',
        textColor: '#b91c1c',
        borderColor: '#fecaca',
        barColor: '#ef4444',
        dotColor: 'bg-rose-500',
    },
};

export const eventStatusOptions = [
    { value: 'planning', label: 'Đang chuẩn bị', dotColor: 'bg-blue-500' },
    { value: 'upcoming', label: 'Sắp diễn ra', dotColor: 'bg-indigo-500' },
    { value: 'happening', label: 'Đang diễn ra', dotColor: 'bg-amber-500' },
    { value: 'completed', label: 'Đã hoàn thành', dotColor: 'bg-emerald-500' },
    { value: 'cancelled', label: 'Đã hủy', dotColor: 'bg-rose-500' },
];

export function EventStatusBadge({ status = 'planning', className = '', size = 'md' }) {
    const config = statusConfigMap[status] || statusConfigMap.planning;
    const isHappening = status === 'happening';
    const sizeClasses = size === 'sm'
        ? 'text-[10px] px-2 py-0.5'
        : 'text-xs px-2.5 py-0.5';

    return (
        <span
            className={`font-semibold rounded-full shrink-0 border inline-flex items-center gap-1 leading-none ${sizeClasses} ${className}`}
            style={{
                backgroundColor: config.bg,
                color: config.textColor,
                borderColor: config.borderColor,
            }}
        >
            {isHappening && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
            )}
            <span>{config.label}</span>
        </span>
    );
}

export function EventStatusDropdown({
    status = 'planning',
    onChange,
    disabled = false,
    className = '',
    size = 'md',
}) {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef(null);

    const currentConfig = statusConfigMap[status] || statusConfigMap.planning;

    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const sizeClasses = size === 'sm'
        ? 'text-xs py-1.5 px-3'
        : 'text-xs sm:text-sm py-2 px-3.5';

    return (
        <div className={`relative inline-block ${className}`} ref={dropdownRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(prev => !prev)}
                className={`font-semibold rounded-xl border inline-flex items-center gap-2 cursor-pointer transition-all duration-150 shadow-2xs select-none ${sizeClasses} hover:opacity-90 active:scale-95`}
                style={{
                    backgroundColor: currentConfig.bg,
                    color: currentConfig.textColor,
                    borderColor: currentConfig.borderColor,
                }}
            >
                <span className={`w-2 h-2 rounded-full shrink-0 ${currentConfig.dotColor}`} />
                <span>{currentConfig.label}</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-2xl py-1.5 z-[100] flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-2 duration-150"
                    onClick={(e) => e.stopPropagation()}
                >
                    {eventStatusOptions.map(opt => {
                        const optConfig = statusConfigMap[opt.value] || statusConfigMap.planning;
                        const isSelected = status === opt.value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange?.(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-xs sm:text-sm font-semibold flex items-center justify-between text-left transition-colors cursor-pointer border-none bg-transparent ${
                                    isSelected
                                        ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: optConfig.color }}
                                    />
                                    <span style={{ color: isSelected ? optConfig.color : undefined }}>
                                        {opt.label}
                                    </span>
                                </div>
                                {isSelected && (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="w-4 h-4 text-blue-600 dark:text-blue-400"
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export const AVAILABLE_EVENT_TAGS = [
    {
        id: 'community',
        name: 'Phục vụ cộng đồng',
        label: 'Phục vụ cộng đồng',
        color: '#059669',
        bg: '#ecfdf5',
        textColor: '#047857',
        borderColor: '#a7f3d0',
    },
];

export const TAG_COLOR_PALETTES = [
    { label: 'Xanh ngọc', color: '#059669', bg: '#ecfdf5', textColor: '#047857', borderColor: '#a7f3d0' },
    { label: 'Xanh dương', color: '#2563eb', bg: '#eff6ff', textColor: '#1d4ed8', borderColor: '#bfdbfe' },
    { label: 'Tím', color: '#7c3aed', bg: '#f5f3ff', textColor: '#6d28d9', borderColor: '#ddd6fe' },
    { label: 'Hồng', color: '#db2777', bg: '#fdf2f8', textColor: '#be185d', borderColor: '#fbcfe8' },
    { label: 'Vàng cam', color: '#d97706', bg: '#fffbeb', textColor: '#b45309', borderColor: '#fde68a' },
    { label: 'Đỏ', color: '#e11d48', bg: '#fff1f2', textColor: '#be123c', borderColor: '#fecdd3' },
    { label: 'Xanh cyan', color: '#0891b2', bg: '#ecfeff', textColor: '#0e7490', borderColor: '#a5f3fc' },
    { label: 'Xám đen', color: '#475569', bg: '#f8fafc', textColor: '#334155', borderColor: '#cbd5e1' },
];

export const EVENT_TAG_CONFIG = {
    'Phục vụ cộng đồng': {
        bg: '#ecfdf5',
        textColor: '#047857',
        borderColor: '#a7f3d0',
        color: '#059669',
    },
};

export function getTagStyle(tagName = '', customConfig = null) {
    if (customConfig && customConfig.bg) {
        return customConfig;
    }
    if (EVENT_TAG_CONFIG[tagName]) {
        return EVENT_TAG_CONFIG[tagName];
    }
    if (!tagName) return TAG_COLOR_PALETTES[0];

    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
        hash = (hash << 5) - hash + tagName.charCodeAt(i);
        hash |= 0;
    }
    const idx = Math.abs(hash) % TAG_COLOR_PALETTES.length;
    return TAG_COLOR_PALETTES[idx];
}

export function EventTagBadge({ tag = '', styleConfig = null, className = '', size = 'md', showIcon = true }) {
    if (!tag) return null;
    const config = getTagStyle(tag, styleConfig);

    const sizeClasses = size === 'sm'
        ? 'text-[10px] px-2 py-0.5'
        : 'text-xs px-2.5 py-0.5';

    return (
        <span
            className={`font-semibold rounded-full shrink-0 border inline-flex items-center gap-1 leading-none ${sizeClasses} ${className}`}
            style={{
                backgroundColor: config.bg,
                color: config.textColor,
                borderColor: config.borderColor,
            }}
        >
            {showIcon && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0">
                    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                    <path d="M7 7h.01" />
                </svg>
            )}
            <span>{tag}</span>
        </span>
    );
}

export const EVENT_TYPE_OPTIONS = [
    { value: 'competition', label: 'Cuộc thi', color: '#f59e0b' },
    { value: 'workshop', label: 'Workshop', color: '#3b82f6' },
    { value: 'showcase', label: 'Showcase', color: '#8b5cf6' },
    { value: 'festival', label: 'Festival', color: '#ec4899' },
    { value: 'camp', label: 'Camp', color: '#10b981' },
    { value: 'talkshow', label: 'Talkshow', color: '#06b6d4' },
    { value: 'exhibition', label: 'Exhibition', color: '#f97316' },
    { value: 'ceremony', label: 'Ceremony', color: '#eab308' },
    { value: 'internal', label: 'Nội bộ', color: '#64748b' },
    { value: 'other', label: 'Khác', color: '#6b7280' },
];

export const eventTypeConfigMap = EVENT_TYPE_OPTIONS.reduce((acc, curr) => {
    acc[curr.value] = curr;
    return acc;
}, {});

export const TASK_STATUS_CONFIG = {
    pending: {
        label: 'Chưa làm',
        bg: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
        badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        dot: 'bg-gray-400',
        next: 'in_progress',
        color: '#6b7280',
    },
    in_progress: {
        label: 'Đang làm',
        bg: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
        badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
        dot: 'bg-blue-500',
        next: 'completed',
        color: '#3b82f6',
    },
    completed: {
        label: 'Hoàn thành',
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        next: 'pending',
        color: '#10b981',
    },
    overdue: {
        label: 'Trễ hạn',
        bg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        dot: 'bg-amber-500',
        next: 'in_progress',
        color: '#f59e0b',
    },
    blocked: {
        label: 'Vướng mắc',
        bg: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        dot: 'bg-rose-500',
        next: 'in_progress',
        color: '#ef4444',
    },
};

export const TASK_PRIORITY_CONFIG = {
    urgent: {
        label: 'Khẩn cấp',
        color: 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-400',
        dot: 'bg-rose-500',
        textColor: 'text-rose-600 dark:text-rose-400',
    },
    high: {
        label: 'Cao',
        color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-400',
        dot: 'bg-amber-500',
        textColor: 'text-amber-600 dark:text-amber-400',
    },
    medium: {
        label: 'Trung bình',
        color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-400',
        dot: 'bg-blue-500',
        textColor: 'text-blue-600 dark:text-blue-400',
    },
    low: {
        label: 'Thấp',
        color: 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300',
        dot: 'bg-slate-400',
        textColor: 'text-[var(--text-secondary)]',
    },
};

export const PHASE_COLOR_PALETTE = [
    {
        name: 'blue',
        badge: 'bg-blue-600 text-white',
        cardBorder: 'border-blue-200',
        activeHoldingBorder: 'border-blue-500 ring-2 ring-blue-400/20',
        headerBg: 'bg-gradient-to-r from-blue-50/90 via-blue-50/40 to-transparent',
        treeLine: 'bg-blue-300',
        hoverBorder: 'hover:border-blue-300',
        holdingBadge: 'bg-blue-100 text-blue-800 border-blue-200',
        text: 'text-blue-900',
        border: 'border-l-4 border-l-blue-600',
        bg: 'bg-blue-100/80 dark:bg-blue-950/50',
        bar: 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700',
    },
    {
        name: 'indigo',
        badge: 'bg-indigo-600 text-white',
        cardBorder: 'border-indigo-200',
        activeHoldingBorder: 'border-indigo-500 ring-2 ring-indigo-400/20',
        headerBg: 'bg-gradient-to-r from-indigo-50/90 via-indigo-50/40 to-transparent',
        treeLine: 'bg-indigo-300',
        hoverBorder: 'hover:border-indigo-300',
        holdingBadge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        text: 'text-indigo-900',
        border: 'border-l-4 border-l-indigo-600',
        bg: 'bg-indigo-100/80 dark:bg-indigo-950/50',
        bar: 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700',
    },
    {
        name: 'purple',
        badge: 'bg-purple-600 text-white',
        cardBorder: 'border-purple-200',
        activeHoldingBorder: 'border-purple-500 ring-2 ring-purple-400/20',
        headerBg: 'bg-gradient-to-r from-purple-50/90 via-purple-50/40 to-transparent',
        treeLine: 'bg-purple-300',
        hoverBorder: 'hover:border-purple-300',
        holdingBadge: 'bg-purple-100 text-purple-800 border-purple-200',
        text: 'text-purple-900',
        border: 'border-l-4 border-l-purple-600',
        bg: 'bg-purple-100/80 dark:bg-purple-950/50',
        bar: 'bg-purple-600 dark:bg-purple-500 hover:bg-purple-700',
    },
    {
        name: 'emerald',
        badge: 'bg-emerald-600 text-white',
        cardBorder: 'border-emerald-200',
        activeHoldingBorder: 'border-emerald-500 ring-2 ring-emerald-400/20',
        headerBg: 'bg-gradient-to-r from-emerald-50/90 via-emerald-50/40 to-transparent',
        treeLine: 'bg-emerald-300',
        hoverBorder: 'hover:border-emerald-300',
        holdingBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        text: 'text-emerald-900',
        border: 'border-l-4 border-l-emerald-600',
        bg: 'bg-emerald-100/80 dark:bg-emerald-950/50',
        bar: 'bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700',
    },
    {
        name: 'amber',
        badge: 'bg-amber-600 text-white',
        cardBorder: 'border-amber-200',
        activeHoldingBorder: 'border-amber-500 ring-2 ring-amber-400/20',
        headerBg: 'bg-gradient-to-r from-amber-50/90 via-amber-50/40 to-transparent',
        treeLine: 'bg-amber-300',
        hoverBorder: 'hover:border-amber-300',
        holdingBadge: 'bg-amber-100 text-amber-800 border-amber-200',
        text: 'text-amber-900',
        border: 'border-l-4 border-l-amber-600',
        bg: 'bg-amber-100/80 dark:bg-amber-950/50',
        bar: 'bg-amber-600 dark:bg-amber-500 hover:bg-amber-700',
    },
    {
        name: 'rose',
        badge: 'bg-rose-600 text-white',
        cardBorder: 'border-rose-200',
        activeHoldingBorder: 'border-rose-500 ring-2 ring-rose-400/20',
        headerBg: 'bg-gradient-to-r from-rose-50/90 via-rose-50/40 to-transparent',
        treeLine: 'bg-rose-300',
        hoverBorder: 'hover:border-rose-300',
        holdingBadge: 'bg-rose-100 text-rose-800 border-rose-200',
        text: 'text-rose-900',
        border: 'border-l-4 border-l-rose-600',
        bg: 'bg-rose-100/80 dark:bg-rose-950/50',
        bar: 'bg-rose-600 dark:bg-rose-500 hover:bg-rose-700',
    },
];


