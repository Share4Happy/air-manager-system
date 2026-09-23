/**
 * Centralized formatting utilities for Event Manager System
 */

/**
 * Format currency in VND with separator
 * @param {number|string} amount
 * @returns {string} e.g. "1.500.000 đ"
 */
export function formatVND(amount) {
    const num = Number(amount) || 0;
    return `${new Intl.NumberFormat('vi-VN').format(num)} đ`;
}

/**
 * Format date into Vietnamese localized format
 * @param {string|Date} date
 * @param {object} options
 * @returns {string}
 */
export function formatEventDate(date, options = { day: '2-digit', month: '2-digit', year: 'numeric' }) {
    if (!date) return 'Chưa thiết lập';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Ngày không hợp lệ';
        return d.toLocaleDateString('vi-VN', options);
    } catch {
        return 'Ngày không hợp lệ';
    }
}

/**
 * Format date and time
 * @param {string|Date} date
 * @returns {string} e.g. "14:30 25/12/2025"
 */
export function formatEventDateTime(date) {
    if (!date) return 'Chưa thiết lập';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Thời gian không hợp lệ';
        return d.toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch {
        return 'Thời gian không hợp lệ';
    }
}

/**
 * Calculate completion percentage safely
 * @param {number} completed
 * @param {number} total
 * @returns {number} 0 to 100
 */
export function calculateProgress(completed = 0, total = 0) {
    if (!total || total <= 0) return 0;
    return Math.round((Math.max(0, completed) / total) * 100);
}

/**
 * Normalize and clean phone numbers
 * @param {string} phone
 * @returns {string}
 */
export function normalizePhoneNumber(phone = '') {
    return String(phone || '').replace(/[\s\.\-\(\)\+]/g, '').trim();
}

/**
 * Truncate long strings with ellipsis
 * @param {string} text
 * @param {number} maxLen
 * @returns {string}
 */
export function truncateText(text = '', maxLen = 100) {
    if (!text) return '';
    return text.length > maxLen ? `${text.slice(0, maxLen)}...` : text;
}

/**
 * Resolve person / assignee information from members and users lists
 * @param {string|object} assigneeId
 * @param {Array} members
 * @param {Array} users
 * @returns {object|null}
 */
export function resolveAssigneeInfo(assigneeId, members = [], users = []) {
    if (!assigneeId) return null;
    const idStr = typeof assigneeId === 'object' ? String(assigneeId?._id || assigneeId?.id) : String(assigneeId);

    const m = (members || []).find(m => String(m.id || m._id) === idStr || String(m.userId) === idStr);
    if (m) {
        const u = (users || []).find(u => String(u._id) === idStr || String(u._id) === String(m.userId));
        return {
            id: m.id || m._id,
            name: m.name || (u ? u.name : 'Thành viên'),
            role: m.role || (u ? (Array.isArray(u.role) ? u.role.join(', ') : u.role) : 'Thành viên'),
            organization: m.organization || (u ? 'AI Robotic' : 'Ban tổ chức'),
            phone: m.phone || (u ? u.phone : '') || '',
            email: m.email || (u ? u.email : '') || '',
            avatar: u?.avatar || u?.avt,
            type: u || !m.isExternal ? 'user' : 'member',
            badgeColor: u || !m.isExternal ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800',
        };
    }

    const u = (users || []).find(u => String(u._id || u.id) === idStr);
    if (u) {
        return {
            id: u._id,
            name: u.name || u.username || 'Nhân sự',
            role: Array.isArray(u.role) ? u.role.join(', ') : u.role || 'Nhân sự',
            organization: 'AI Robotic',
            phone: u.phone || '',
            email: u.email || '',
            avatar: u.avatar || u.avt,
            type: 'user',
            badgeColor: 'bg-blue-100 text-blue-800',
        };
    }

    return {
        id: idStr,
        name: typeof assigneeId === 'object' ? assigneeId?.name || 'Thành viên' : 'Chưa xác định',
        role: 'Thành viên',
        organization: '',
        phone: '',
        email: '',
        type: 'unknown',
        badgeColor: 'bg-gray-100 text-gray-800',
    };
}

/**
 * Build unified list of all assignees for select/dropdown menus
 * @param {Array} members
 * @param {Array} users
 * @returns {Array}
 */
export function buildEventAssigneesList(members = [], users = []) {
    const list = [];
    const seen = new Set();

    (members || []).forEach((m) => {
        const id = String(m.id || m._id);
        if (!seen.has(id)) {
            seen.add(id);
            list.push({
                id: id,
                name: m.name,
                role: m.role || 'Thành viên',
                organization: m.organization || 'Ban tổ chức',
                phone: m.phone || '',
                type: 'member',
                isExternal: m.isExternal,
            });
        }
    });

    (users || []).forEach((u) => {
        const id = String(u._id || u.id);
        if (!seen.has(id)) {
            seen.add(id);
            list.push({
                id: id,
                name: u.name,
                role: Array.isArray(u.role) ? u.role.join(', ') : u.role || 'Nhân sự',
                organization: 'AI Robotic',
                phone: u.phone || '',
                type: 'user',
            });
        }
    });

    return list;
}

