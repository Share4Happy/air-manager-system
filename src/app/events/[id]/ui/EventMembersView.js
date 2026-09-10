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

export const ROLE_GROUPS = [
    {
        group: 'Ban Điều hành & Chuyên môn',
        roles: [
            'Ban tổ chức',
            'Trưởng ban tổ chức',
            'Trọng tài / Giám khảo',
            'Cố vấn / Mentor',
            'Hướng dẫn viên / Giảng viên STEM',
            'Trưởng trạm / Phụ trách trạm',
        ],
    },
    {
        group: 'Hỗ trợ & Vận hành',
        roles: [
            'Tình nguyện viên (TNV)',
            'Kỹ thuật & Robot',
            'Hậu cần & CSVC',
            'Truyền thông & Quay chụp',
            'MC / Dẫn chương trình',
            'Check-in & Đón tiếp',
            'Y tế & An ninh',
        ],
    },
    {
        group: 'Người tham gia & Khách mời',
        roles: [
            'Thí sinh / Học sinh',
            'Khách mời / Đại biểu (VIP)',
            'Phụ huynh học sinh',
        ],
    },
];

export const ALL_PRESET_ROLES = ROLE_GROUPS.flatMap((g) => g.roles);

export default function EventMembersView({
    event,
    members = [],
    roadmap = [],
    users = [],
    onUpdateMembers,
    onUpdateRoadmap,
    readOnly = false,
}) {
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [selectedCheckInStatus, setSelectedCheckInStatus] = useState('all');

    // Add/Edit manual member modal state
    const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [isCustomRole, setIsCustomRole] = useState(false);
    const [customRoleInput, setCustomRoleInput] = useState('');
    const [memberFormData, setMemberFormData] = useState({
        name: '',
        role: 'Trọng tài / Giám khảo',
        organization: '',
        phone: '',
        email: '',
        notes: '',
    });

    const handleOpenAdd = () => {
        if (readOnly) return;
        setEditingMember(null);
        setIsCustomRole(false);
        setCustomRoleInput('');
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
        if (readOnly) return;
        setEditingMember(member);
        const role = member.role || 'Trọng tài / Giám khảo';
        const isStandard = ALL_PRESET_ROLES.includes(role);
        setIsCustomRole(!isStandard && Boolean(role));
        setCustomRoleInput(!isStandard ? role : '');
        setMemberFormData({
            name: member.name || '',
            role: role,
            organization: member.organization || '',
            phone: member.phone || '',
            email: member.email || '',
            notes: member.notes || '',
        });
        setIsMemberFormOpen(true);
    };

    const handleSaveMember = (e) => {
        e.preventDefault();
        if (readOnly || !onUpdateMembers) return;
        if (!memberFormData.name.trim()) return;

        const finalRole = (isCustomRole ? customRoleInput.trim() : memberFormData.role) || 'Thành viên';
        const dataToSave = {
            ...memberFormData,
            role: finalRole,
        };

        let updatedMembers;
        if (editingMember) {
            updatedMembers = members.map((m) =>
                m.id === editingMember.id ? { ...m, ...dataToSave } : m
            );
        } else {
            const newMember = {
                id: `mem-${Date.now()}`,
                ...dataToSave,
                isExternal: memberFormData.userId ? false : true,
                checkInStatus: false,
            };
            updatedMembers = [...members, newMember];
        }

        onUpdateMembers(updatedMembers);
        setIsMemberFormOpen(false);
    };

    const handleDeleteMember = (memberId) => {
        if (readOnly || !onUpdateMembers) return;
        if (!confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi sự kiện?')) return;
        const updatedMembers = members.filter((m) => m.id !== memberId);
        onUpdateMembers(updatedMembers);
    };

    const handleToggleCheckIn = (memberId) => {
        if (readOnly || !onUpdateMembers) return;
        const updatedMembers = members.map((m) => {
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
        onUpdateMembers(updatedMembers);
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
        if (r.includes('ban tổ chức') || r.includes('btc') || r.includes('điều phối') || r.includes('trưởng ban')) return 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900';
        if (r.includes('hướng dẫn') || r.includes('giảng viên') || r.includes('trưởng trạm')) return 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900';
        if (r.includes('kỹ thuật') || r.includes('robot')) return 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900';
        if (r.includes('hậu cần') || r.includes('csvc')) return 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900';
        if (r.includes('truyền thông') || r.includes('quay chụp') || r.includes('mc')) return 'bg-pink-50 text-pink-800 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-900';
        if (r.includes('cố vấn') || r.includes('mentor') || r.includes('chuyên gia')) return 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900';
        if (r.includes('check-in') || r.includes('đón tiếp')) return 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900';
        if (r.includes('y tế') || r.includes('an ninh')) return 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900';
        if (r.includes('phụ huynh')) return 'bg-lime-50 text-lime-800 border-lime-200 dark:bg-lime-950/40 dark:text-lime-300 dark:border-lime-900';
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
                <div className="flex flex-col">
                    <span className="font-bold text-base sm:text-lg text-[var(--text-primary)] block">
                        {mem.name}
                    </span>
                    {mem.notes && (
                        <span className="text-xs sm:text-sm text-[var(--text-secondary)] block italic mt-0.5">
                            {mem.notes}
                        </span>
                    )}
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
                    {readOnly ? (
                        <div
                            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border flex items-center justify-center gap-1.5 mx-auto ${
                                mem.checkInStatus
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)]'
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
                        </div>
                    ) : (
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
                    )}
                    {mem.checkInTime && (
                        <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 block mt-1 font-medium text-center">
                            {new Date(mem.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
            ),
        },
        ...(!readOnly ? [{
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
        }] : []),
    ];

    return (
        <div className="w-full flex flex-col gap-6">
            {/* Unified Header & Filter Toolbar */}
            <EventToolbar
                primaryActions={
                    readOnly ? (
                        <button
                            type="button"
                            onClick={handleExportExcel}
                            className="px-3.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <IconDownload className="w-3.5 h-3.5" />
                            <span>Xuất Excel</span>
                        </button>
                    ) : (
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
                    )
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
                                    setIsCustomRole(false);
                                    setCustomRoleInput('');
                                    const uRole = Array.isArray(u.role) ? u.role[0] : u.role || 'Ban tổ chức';
                                    const matchedRole = ALL_PRESET_ROLES.find(r => r.toLowerCase().includes(uRole.toLowerCase())) || 'Ban tổ chức';
                                    setMemberFormData((prev) => ({
                                        ...prev,
                                        name: u.name || '',
                                        phone: u.phone || prev.phone || '',
                                        email: u.email || prev.email || '',
                                        role: matchedRole,
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
                            Vai trò trong sự kiện <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={isCustomRole ? '__custom__' : (memberFormData.role || 'Trọng tài / Giám khảo')}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '__custom__') {
                                    setIsCustomRole(true);
                                    setCustomRoleInput('');
                                } else {
                                    setIsCustomRole(false);
                                    setMemberFormData({ ...memberFormData, role: val });
                                }
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
                        >
                            {ROLE_GROUPS.map((grp) => (
                                <optgroup key={grp.group} label={grp.group}>
                                    {grp.roles.map((r) => (
                                        <option key={r} value={r}>
                                            {r}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                            <option value="__custom__">-- Vai trò khác (Tự nhập) --</option>
                        </select>

                        {isCustomRole && (
                            <input
                                type="text"
                                autoFocus
                                required
                                value={customRoleInput}
                                onChange={(e) => {
                                    setCustomRoleInput(e.target.value);
                                    setMemberFormData({ ...memberFormData, role: e.target.value });
                                }}
                                placeholder="Nhập tên vai trò tùy chỉnh..."
                                className="w-full mt-2 px-3.5 py-2 rounded-xl border border-blue-400 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        )}
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
