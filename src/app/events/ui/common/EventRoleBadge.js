'use client';
import React from 'react';

const ROLE_STYLES = {
    'Admin': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 font-bold',
    'Quản lý': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 font-bold',
    'Trưởng ban tổ chức': 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 font-bold',
    'Thư ký': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-bold',
    'Thành viên': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 font-medium',
    'Tình nguyện viên': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-medium',
    'default': 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 font-medium',
};

export function getEventRoleStyle(role = '') {
    if (!role) return ROLE_STYLES.default;
    if (ROLE_STYLES[role]) return ROLE_STYLES[role];
    const r = role.toLowerCase();
    if (r.includes('admin')) return ROLE_STYLES.Admin;
    if (r.includes('trưởng ban') || r.includes('ban tổ chức')) return ROLE_STYLES['Trưởng ban tổ chức'];
    if (r.includes('quản lý') || r.includes('manager')) return ROLE_STYLES['Quản lý'];
    if (r.includes('thư ký')) return ROLE_STYLES['Thư ký'];
    if (r.includes('tình nguyện') || r.includes('tnv')) return ROLE_STYLES['Tình nguyện viên'];
    if (r.includes('thành viên') || r.includes('member')) return ROLE_STYLES['Thành viên'];
    return ROLE_STYLES.default;
}

export default function EventRoleBadge({ role = 'Thành viên', className = '', size = 'md' }) {
    const styleClass = getEventRoleStyle(role);
    const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';

    return (
        <span className={`inline-flex items-center rounded-md border ${sizeClass} ${styleClass} ${className}`}>
            {role || 'Thành viên'}
        </span>
    );
}

