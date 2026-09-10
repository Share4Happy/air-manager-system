import React from 'react';

export const IconCpu = ({ className = 'w-5 h-5', ...props }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2" />
        <rect x="9" y="9" width="6" height="6" strokeWidth="2" />
        <path strokeLinecap="round" strokeWidth="2" d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </svg>
);

export const IconBox = ({ className = 'w-5 h-5', ...props }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);

export const IconLayers = ({ className = 'w-5 h-5', ...props }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <polygon points="12 2 2 7 12 12 22 7 12 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="2 17 12 22 22 17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="2 12 12 17 22 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const IconAlertTriangle = ({ className = 'w-5 h-5', ...props }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
);

export const IconDollar = ({ className = 'w-5 h-5', ...props }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <line x1="12" y1="1" x2="12" y2="23" strokeWidth="2" strokeLinecap="round" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
);

export const IconSearch = ({ className = 'w-5 h-5', ...props }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <circle cx="11" cy="11" r="8" strokeWidth="2" strokeLinecap="round" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const IconPlus = ({ className = 'w-5 h-5', ...props }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round" />
        <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const IconMinus = ({ className = 'w-5 h-5', ...props }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const IconArrowDownRight = ({ className = 'w-5 h-5', ...props }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <line x1="7" y1="7" x2="17" y2="17" strokeWidth="2" strokeLinecap="round" />
        <polyline points="17 7 17 17 7 17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const IconArrowUpRight = ({ className = 'w-5 h-5', ...props }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <line x1="7" y1="17" x2="17" y2="7" strokeWidth="2" strokeLinecap="round" />
        <polyline points="7 7 17 7 17 17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const IconPen = ({ className = 'w-5 h-5', ...props }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

export const IconTrash = ({ className = 'w-5 h-5', ...props }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <polyline points="3 6 5 6 21 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" strokeWidth="2" strokeLinecap="round" />
        <line x1="14" y1="11" x2="14" y2="17" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const IconHistory = ({ className = 'w-5 h-5', ...props }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <circle cx="12" cy="12" r="10" strokeWidth="2" strokeLinecap="round" />
        <polyline points="12 6 12 12 16 14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const IconGrid = ({ className = 'w-5 h-5', ...props }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />
    </svg>
);

export const IconList = ({ className = 'w-5 h-5', ...props }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <line x1="8" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="18" x2="21" y2="18" strokeWidth="2" strokeLinecap="round" />
        <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="3" strokeLinecap="round" />
        <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="3" strokeLinecap="round" />
        <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

export const IconClose = ({ className = 'w-5 h-5', ...props }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round" />
        <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const IconLocation = ({ className = 'w-5 h-5', ...props }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" strokeWidth="2" />
    </svg>
);

export const IconExternalLink = ({ className = 'w-5 h-5', ...props }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
        <polyline points="15 3 21 3 21 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="10" y1="14" x2="21" y2="3" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const IconDownload = ({ className = 'w-5 h-5', ...props }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" strokeLinecap="round" />
    </svg>
);
