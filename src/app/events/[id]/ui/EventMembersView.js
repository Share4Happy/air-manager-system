'use client';
import React, { useState } from 'react';
import ImportMembersModal from './ImportMembersModal';
import {
    IconUsers,
    IconUpload,
    IconDownload,
    IconPlus,
    IconCheck,
    IconEdit,
    IconTrash,
    IconUser,
} from '@/app/events/ui/icons';
import EventToolbar from '@/app/events/ui/common/EventToolbar';
import EventTable from '@/app/events/ui/common/EventTable';
import ActionMenu from '@/app/events/ui/common/ActionMenu';
import EventModal from '@/app/events/ui/common/EventModal';

export default function EventMembersView({
    event,
    members = [],
    roadmap = [],
    users = [],
    onUpdateMembers,
    onUpdateRoadmap,
}) {
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [selectedCheckInStatus, setSelectedCheckInStatus] = useState('all');

    // Add/Edit manual member modal state
    const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [memberFormData, setMemberFormData] = useState({
        name: '',
        role: 'Trọng tài / Giám khảo',
        organization: '',
        phone: '',
        email: '',
        notes: '',
    });

    const handleOpenAdd = () => {
        setEditingMember(null);
        setMemberFormData({
            name: '',
            role: 'Trọng tài / Giám khảo',
            organization: '',
            phone: '',
            email: '',
            notes: '',
        });
        setIsMemberFormOpen(true);
    };

    const handleOpenEdit = (member) => {
        setEditingMember(member);
        setMemberFormData({
            name: member.name || '',
            role: member.role || 'Thành viên',
            organization: member.organization || '',
            phone: member.phone || '',
            email: member.email || '',
            notes: member.notes || '',
        });
        setIsMemberFormOpen(true);
    };

    const handleSaveMember = (e) => {
        e.preventDefault();
        if (!memberFormData.name.trim()) return;

        let updatedList;
        if (editingMember) {
            updatedList = members.map((m) =>
                m.id === editingMember.id
                    ? { ...m, ...memberFormData, name: memberFormData.name.trim() }
                    : m
            );
        } else {
            const newMem = {
                id: `mem-${Date.now()}`,
                name: memberFormData.name.trim(),
                role: memberFormData.role.trim() || 'Thành viên',
                organization: memberFormData.organization.trim(),
                phone: memberFormData.phone.trim(),
                email: memberFormData.email.trim(),
                notes: memberFormData.notes.trim(),
                checkInStatus: false,
                isExternal: true,
                order: members.length + 1,
            };
            updatedList = [...members, newMem];
        }

        onUpdateMembers(updatedList);
        setIsMemberFormOpen(false);
    };

    const handleDeleteMember = (memberId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi sự kiện?')) return;
        const updatedList = members.filter((m) => m.id !== memberId);
        onUpdateMembers(updatedList);
    };

    const handleToggleCheckIn = (memberId) => {
        const updatedList = members.map((m) => {
            if (m.id === memberId) {
                const nextStatus = !m.checkInStatus;
                return {
                    ...m,
                    checkInStatus: nextStatus,
                    checkInTime: nextStatus ? new Date() : null,
                };
            }
            return m;
        });
        onUpdateMembers(updatedList);
    };

    const handleExportExcel = () => {
        window.open(`/api/events/${event._id}/members/export`, '_blank');
    };

    // Filter members
    const filteredMembers = members.filter((m) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
            !query ||
            (m.name && m.name.toLowerCase().includes(query)) ||
            (m.phone && m.phone.toLowerCase().includes(query)) ||
            (m.email && m.email.toLowerCase().includes(query)) ||
            (m.role && m.role.toLowerCase().includes(query)) ||
            (m.organization && m.organization.toLowerCase().includes(query));

        const matchesRole = selectedRole === 'all' || m.role === selectedRole;

        const matchesCheckIn =
            selectedCheckInStatus === 'all' ||
            (selectedCheckInStatus === 'checked' && m.checkInStatus) ||
            (selectedCheckInStatus === 'unchecked' && !m.checkInStatus);

        return matchesQuery && matchesRole && matchesCheckIn;
    });

    const checkedInCount = members.filter((m) => m.checkInStatus).length;

    // Unique roles for filter dropdown
    const roleCounts = members.reduce((acc, m) => {
        const r = m.role || 'Chưa phân vai trò';
        acc[r] = (acc[r] || 0) + 1;
        return acc;
    }, {});

    // Role colors mapping
    const getRoleBadgeStyle = (role = '') => {
        const r = role.toLowerCase();
        if (r.includes('trọng tài') || r.includes('giám khảo')) return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900';
        if (r.includes('tình nguyện') || r.includes('tnv')) return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900';
        if (r.includes('thí sinh') || r.includes('học sinh') || r.includes('đội thi')) return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900';
        if (r.includes('khách mời') || r.includes('đại biểu') || r.includes('vip')) return 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900';
        if (r.includes('ban tổ chức') || r.includes('btc') || r.includes('điều phối')) return 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900';
        if (r.includes('cố vấn') || r.includes('mentor') || r.includes('chuyên gia')) return 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900';
        return 'bg-gray-50 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    };

    // Table Columns Configuration
    const columns = [
        {
            key: 'stt',
            header: 'STT',
            align: 'center',
            width: 'w-14',
            render: (val, mem, idx) => (
                <span className="text-[var(--text-secondary)] font-semibold text-sm sm:text-base">
                    {idx + 1}
                </span>
            ),
        },
        {
            key: 'name',
            header: 'Thành viên / Họ tên',
            render: (val, mem) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-xs shrink-0">
                        {mem.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                        <span className="font-bold text-base sm:text-lg text-[var(--text-primary)] block">
                            {mem.name}
                        </span>
                        {mem.notes && (
                            <span className="text-xs sm:text-sm text-[var(--text-secondary)] block italic mt-0.5">
                                {mem.notes}
                            </span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'role',
            header: 'Vai trò',
            render: (val, mem) => (
                <span className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border ${getRoleBadgeStyle(mem.role)}`}>
                    {mem.role || 'Thành viên'}
                </span>
            ),
        },
        {
            key: 'phone',
            header: 'Số điện thoại',
            render: (val, mem) => (
                <span className="text-[var(--text-secondary)] font-mono text-sm sm:text-base">
                    {mem.phone || '-'}
                </span>
            ),
        },
        {
            key: 'email',
            header: 'Email',
            render: (val, mem) => (
                <span className="text-[var(--text-secondary)] text-sm sm:text-base">
                    {mem.email || '-'}
                </span>
            ),
        },
        {
            key: 'checkInStatus',
            header: 'Điểm danh (D-Day)',
            align: 'center',
            render: (val, mem) => (
                <div>
                    <button
                        type="button"
                        onClick={() => handleToggleCheckIn(mem.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border cursor-pointer flex items-center justify-center gap-1.5 mx-auto ${
                            mem.checkInStatus
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)]'
                        }`}
                    >
                        {mem.checkInStatus ? (
                            <>
                                <IconCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Đã Check-in</span>
                            </>
                        ) : (
                            <>
                                <span className="w-2 h-2 rounded-full bg-gray-400" />
                                <span>Chưa điểm danh</span>
                            </>
                        )}
                    </button>
                    {mem.checkInTime && (
                        <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 block mt-1 font-medium text-center">
                            {new Date(mem.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'actions',
            header: 'Thao tác',
            align: 'right',
            render: (val, mem) => (
                <ActionMenu
                    items={[
                        {
                            label: 'Sửa thông tin',
                            icon: IconEdit,
                            onClick: () => handleOpenEdit(mem),
                        },
                        { divider: true },
                        {
                            label: 'Xóa thành viên',
                            icon: IconTrash,
                            danger: true,
                            onClick: () => handleDeleteMember(mem.id),
                        },
                    ]}
                />
            ),
        },
    ];

    return (
        <div className="w-full flex flex-col gap-6">
            {/* Unified Header & Filter Toolbar */}
            <EventToolbar
                primaryActions={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsImportModalOpen(true)}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all border-none cursor-pointer shadow-xs flex items-center gap-1.5"
                        >
                            <IconUpload className="w-3.5 h-3.5" />
                            <span>Import Excel</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleExportExcel}
                            className="px-3.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <IconDownload className="w-3.5 h-3.5" />
                            <span>Xuất Excel</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleOpenAdd}
                            className="px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <IconPlus className="w-3.5 h-3.5" />
                            <span>Thêm người</span>
                        </button>
                    </>
                }
                search={{
                    value: searchQuery,
                    onChange: (e) => setSearchQuery(e.target.value),
                    placeholder: 'Tìm theo tên, số điện thoại, email...',
                    onClear: () => setSearchQuery(''),
                }}
                filters={
                    <>
                        {/* Role Filter */}
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="all">Tất cả vai trò ({members.length})</option>
                            {Object.keys(roleCounts).map((role) => (
                                <option key={role} value={role}>
                                    {role} ({roleCounts[role]})
                                </option>
                            ))}
                        </select>

                        {/* Check-in filter */}
                        <select
                            value={selectedCheckInStatus}
                            onChange={(e) => setSelectedCheckInStatus(e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="checked">Đã Check-in ({checkedInCount})</option>
                            <option value="unchecked">Chưa Check-in ({members.length - checkedInCount})</option>
                        </select>
                    </>
                }
            />

            {/* Reusable Data Table */}
            <EventTable
                columns={columns}
                data={filteredMembers}
                minWidth="min-w-[780px]"
                emptyState={{
                    icon: IconUsers,
                    title: members.length === 0 ? 'Chưa có thành viên nào trong sự kiện' : 'Không tìm thấy kết quả phù hợp',
                    description:
                        members.length === 0
                            ? 'Bạn có thể tải lên file Excel để thêm nhanh trọng tài, tình nguyện viên, thí sinh...'
                            : 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc.',
                    action:
                        members.length === 0 ? (
                            <button
                                type="button"
                                onClick={() => setIsImportModalOpen(true)}
                                className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm sm:text-base font-semibold border-none cursor-pointer shadow-xs flex items-center gap-2"
                            >
                                <IconUpload className="w-4 h-4" />
                                Import Danh sách từ Excel
                            </button>
                        ) : null,
                }}
            />

            {/* Import Modal */}
            <ImportMembersModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                eventId={event?._id}
                onImportSuccess={(newMembers) => onUpdateMembers?.(newMembers)}
            />

            {/* Add / Edit Member Modal */}
            <EventModal
                isOpen={isMemberFormOpen}
                onClose={() => setIsMemberFormOpen(false)}
                title={editingMember ? 'Chỉnh sửa Thông tin Thành viên' : 'Thêm Thành viên Mới'}
                icon={IconUser}
                maxWidth="max-w-lg"
                onSubmit={handleSaveMember}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsMemberFormOpen(false)}
                            className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] bg-transparent cursor-pointer text-sm sm:text-base font-semibold hover:bg-[var(--bg-secondary)] transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold border-none cursor-pointer shadow-xs text-sm sm:text-base"
                        >
                            Lưu thông tin
                        </button>
                    </>
                }
            >
                {users.length > 0 && !editingMember && (
                    <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                        <label className="block text-blue-950 dark:text-blue-200 font-semibold mb-1 text-xs sm:text-sm">
                            Chọn nhanh nhân sự từ hệ thống (tùy chọn):
                        </label>
                        <select
                            onChange={(e) => {
                                const selectedUserId = e.target.value;
                                if (!selectedUserId) return;
                                const u = users.find((user) => String(user._id) === selectedUserId);
                                if (u) {
                                    setMemberFormData((prev) => ({
                                        ...prev,
                                        name: u.name || '',
                                        phone: u.phone || prev.phone || '',
                                        email: u.email || prev.email || '',
                                        role: Array.isArray(u.role) ? u.role[0] : u.role || 'Ban tổ chức',
                                        organization: 'AI Robotic',
                                        userId: u._id,
                                        isExternal: false,
                                    }));
                                }
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="">-- Chọn nhân sự để tự động điền thông tin --</option>
                            {users.map((u) => (
                                <option key={u._id} value={u._id}>
                                    {u.name} ({Array.isArray(u.role) ? u.role.join(', ') : u.role || 'Nhân sự'}) {u.email ? `- ${u.email}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-[var(--text-primary)] font-semibold mb-1.5 text-sm sm:text-base">
                        Họ và tên <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={memberFormData.name}
                        onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
                        placeholder="Ví dụ: Nguyễn Văn An"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                    <div>
                        <label className="block text-[var(--text-primary)] font-semibold mb-1.5 text-sm sm:text-base">
                            Vai trò trong sự kiện
                        </label>
                        <input
                            type="text"
                            list="roles-list"
                            value={memberFormData.role}
                            onChange={(e) => setMemberFormData({ ...memberFormData, role: e.target.value })}
                            placeholder="Trọng tài, Tình nguyện viên..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <datalist id="roles-list">
                            <option value="Trọng tài / Giám khảo" />
                            <option value="Tình nguyện viên" />
                            <option value="Thí sinh / Học sinh" />
                            <option value="Khách mời / Đại biểu" />
                            <option value="Ban tổ chức" />
                            <option value="Cố vấn / Mentor" />
                            <option value="Hậu cần" />
                            <option value="Phụ huynh" />
                        </datalist>
                    </div>

                    <div>
                        <label className="block text-[var(--text-primary)] font-semibold mb-1.5 text-sm sm:text-base">
                            Đơn vị / Trường học
                        </label>
                        <input
                            type="text"
                            value={memberFormData.organization}
                            onChange={(e) => setMemberFormData({ ...memberFormData, organization: e.target.value })}
                            placeholder="Đại học Bách Khoa, THCS Lê Lợi..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                    <div>
                        <label className="block text-[var(--text-primary)] font-semibold mb-1.5 text-sm sm:text-base">
                            Số điện thoại
                        </label>
                        <input
                            type="text"
                            value={memberFormData.phone}
                            onChange={(e) => setMemberFormData({ ...memberFormData, phone: e.target.value })}
                            placeholder="0901234567"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-[var(--text-primary)] font-semibold mb-1.5 text-sm sm:text-base">
                            Email
                        </label>
                        <input
                            type="email"
                            value={memberFormData.email}
                            onChange={(e) => setMemberFormData({ ...memberFormData, email: e.target.value })}
                            placeholder="example@gmail.com"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[var(--text-primary)] font-semibold mb-1.5 text-sm sm:text-base">
                        Ghi chú / Nhiệm vụ cụ thể
                    </label>
                    <textarea
                        rows={2}
                        value={memberFormData.notes}
                        onChange={(e) => setMemberFormData({ ...memberFormData, notes: e.target.value })}
                        placeholder="Nhiệm vụ cụ thể, đội thi, lưu ý..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm sm:text-base resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </EventModal>
        </div>
    );
}
