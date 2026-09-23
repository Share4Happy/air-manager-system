/**
 * Permissions for Event Roadmap Tasks:
 * 1. canManageRoadmapTasks:
 *    - Admin / Quản lý / Manager (from user system role or event member role)
 *    - Thư ký (from event member role)
 *    - Trưởng ban tổ chức / Ban tổ chức / Điều phối viên
 *    - Event lead / creator
 * 2. canEditTaskProofLink:
 *    - Anyone with canManageRoadmapTasks = true
 *    - The assigned user (Assignee) of that specific task
 * 3. Status changes (progress):
 *    - No restriction (everyone can update task status)
 */

export function canManageRoadmapTasks(currentUser, members = [], event = {}) {
    if (!currentUser) return false;

    // Check system roles
    const userRole = Array.isArray(currentUser.role) ? currentUser.role : [currentUser.role || ''];
    const isAdminOrManager = userRole.some(r => {
        const lr = (r || '').toLowerCase();
        return lr === 'admin' || lr === 'academic' || lr.includes('học vụ') || lr.includes('quản lý') || lr.includes('manager');
    });
    if (isAdminOrManager) return true;

    // Check matching member in this event
    const currentUserId = String(currentUser._id || currentUser.id || '');
    const userEmail = (currentUser.email || '').toLowerCase().trim();
    const userPhone = (currentUser.phone || '').toString().replace(/[\s\.\-\(\)\+]/g, '');

    const memberMatch = (members || []).find(m => {
        if (m.userId && String(m.userId) === currentUserId) return true;
        if (String(m.id || m._id) === currentUserId) return true;
        if (userEmail && m.email && m.email.toLowerCase().trim() === userEmail) return true;
        if (userPhone && m.phone && m.phone.replace(/[\s\.\-\(\)\+]/g, '') === userPhone) return true;
        return false;
    });

    if (memberMatch) {
        const mRole = (memberMatch.role || '').toLowerCase();
        if (
            mRole.includes('thư ký') ||
            mRole.includes('admin') ||
            mRole.includes('quản lý') ||
            mRole.includes('ban tổ chức') ||
            mRole.includes('trưởng ban') ||
            mRole.includes('điều phối')
        ) {
            return true;
        }
    }

    // Check event lead or creator
    if (event?.lead && String(event.lead._id || event.lead) === currentUserId) return true;
    if (event?.createdBy && String(event.createdBy._id || event.createdBy) === currentUserId) return true;

    return false;
}

export function canEditTaskProofLink(currentUser, members = [], task, event = {}) {
    if (!currentUser || !task) return false;
    if (canManageRoadmapTasks(currentUser, members, event)) return true;

    const currentUserId = String(currentUser._id || currentUser.id || '');
    const userEmail = (currentUser.email || '').toLowerCase().trim();
    const userPhone = (currentUser.phone || '').toString().replace(/[\s\.\-\(\)\+]/g, '');

    const assigneeId = String(task.assignee?._id || task.assignee?.id || task.assignee || '');
    if (assigneeId && assigneeId === currentUserId) return true;

    const memberMatch = (members || []).find(m => {
        if (m.userId && String(m.userId) === currentUserId) return true;
        if (String(m.id || m._id) === currentUserId) return true;
        if (userEmail && m.email && m.email.toLowerCase().trim() === userEmail) return true;
        if (userPhone && m.phone && m.phone.replace(/[\s\.\-\(\)\+]/g, '') === userPhone) return true;
        return false;
    });

    if (memberMatch && String(memberMatch.id || memberMatch._id) === assigneeId) {
        return true;
    }

    return false;
}
