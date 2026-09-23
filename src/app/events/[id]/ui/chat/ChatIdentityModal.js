'use client';
import React from 'react';
import { IconClose, IconUsers, IconCheck } from '@/app/events/ui/icons';

export default function ChatIdentityModal({
    isOpen,
    onClose,
    members = [],
    filteredMembers = [],
    tempIdentityName,
    setTempIdentityName,
    tempIdentityRole,
    setTempIdentityRole,
    selectedMemberId,
    setSelectedMemberId,
    memberSearchQuery,
    setMemberSearchQuery,
    isMemberDropdownOpen,
    setIsMemberDropdownOpen,
    onSaveIdentity,
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-[var(--bg-primary)] p-5 sm:p-6 rounded-2xl border border-[var(--border-color)] shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-[5px] bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                            <IconUsers className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-[var(--text-primary)] m-0">
                                Thiết lập Tên Hiển Thị Chat
                            </h4>
                            <p className="text-xs text-[var(--text-secondary)] m-0">
                                Để Ban tổ chức và các trạm nhận biết bạn
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-[5px] hover:bg-[var(--bg-secondary)] border-none bg-transparent cursor-pointer text-[var(--text-secondary)]"
                    >
                        <IconClose className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={onSaveIdentity} className="flex flex-col gap-3.5">
                    {/* Member Searchable Combobox (if members exist in event) */}
                    {members && members.length > 0 && (
                        <div className="flex flex-col gap-1.5 relative">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                                    Tìm & Chọn từ Danh sách Nhân sự:
                                </label>
                                {selectedMemberId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedMemberId('');
                                            setMemberSearchQuery('');
                                            setTempIdentityName('');
                                            setTempIdentityRole('CTV Sự kiện');
                                        }}
                                        className="text-[11px] text-rose-600 hover:underline border-none bg-transparent cursor-pointer p-0 font-medium"
                                    >
                                        ✕ Bỏ chọn / Tự nhập
                                    </button>
                                )}
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    value={memberSearchQuery}
                                    onFocus={() => setIsMemberDropdownOpen(true)}
                                    onChange={e => {
                                        setMemberSearchQuery(e.target.value);
                                        setIsMemberDropdownOpen(true);
                                        if (selectedMemberId) {
                                            setSelectedMemberId('');
                                        }
                                    }}
                                    placeholder="Gõ tìm theo tên hoặc vai trò..."
                                    className="w-full px-3 py-2 text-xs rounded-[5px] border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {memberSearchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMemberSearchQuery('');
                                            setIsMemberDropdownOpen(true);
                                        }}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-none bg-transparent cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Floating Dropdown List */}
                            {isMemberDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-[1010]"
                                        onClick={() => setIsMemberDropdownOpen(false)}
                                    />
                                    <div className="absolute top-[100%] left-0 right-0 mt-1 z-[1020] max-h-48 overflow-y-auto bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[5px] shadow-xl p-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedMemberId('');
                                                setMemberSearchQuery('');
                                                setIsMemberDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-[5px] text-xs transition-colors flex items-center justify-between border-none cursor-pointer ${
                                                !selectedMemberId
                                                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 font-bold'
                                                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                                            }`}
                                        >
                                            <span>-- Tự nhập họ tên & vai trò khác --</span>
                                            {!selectedMemberId && <IconCheck className="w-3.5 h-3.5" />}
                                        </button>

                                        {filteredMembers.length === 0 ? (
                                            <div className="p-3 text-center text-xs text-[var(--text-secondary)]">
                                                Không tìm thấy nhân sự khớp với từ khóa
                                            </div>
                                        ) : (
                                            filteredMembers.map(m => {
                                                const mId = String(m.id || m._id);
                                                const isSelected = selectedMemberId === mId;
                                                return (
                                                    <button
                                                        key={mId}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedMemberId(mId);
                                                            setTempIdentityName(m.name || '');
                                                            setTempIdentityRole(m.role || 'Thành viên');
                                                            setMemberSearchQuery(m.name || '');
                                                            setIsMemberDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-2 rounded-[5px] text-xs transition-colors flex items-center justify-between border-none cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 font-bold'
                                                                : 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                                                        }`}
                                                    >
                                                        <div className="flex flex-col min-w-0 flex-1">
                                                            <span className="font-semibold text-xs truncate">
                                                                {m.name}
                                                            </span>
                                                            <span className="text-[10px] text-[var(--text-secondary)] truncate">
                                                                {m.role || 'Thành viên'}
                                                            </span>
                                                        </div>
                                                        {isSelected && <IconCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Name Input */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[var(--text-primary)]">
                                Họ và tên của bạn: *
                            </label>
                            {selectedMemberId && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                    (Đã khóa theo nhân sự đã chọn)
                                </span>
                            )}
                        </div>
                        <input
                            type="text"
                            required
                            disabled={Boolean(selectedMemberId)}
                            value={tempIdentityName}
                            onChange={e => setTempIdentityName(e.target.value)}
                            placeholder="Ví dụ: Nguyễn Văn A"
                            className={`w-full px-3.5 py-2.5 text-sm rounded-[5px] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                selectedMemberId
                                    ? 'bg-slate-100 dark:bg-slate-900/80 opacity-75 cursor-not-allowed'
                                    : 'bg-[var(--bg-secondary)]'
                            }`}
                        />
                    </div>

                    {/* Role / Station Input */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[var(--text-primary)]">
                                Vai trò / Vị trí trạm:
                            </label>
                            {selectedMemberId && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                    (Đã khóa theo nhân sự đã chọn)
                                </span>
                            )}
                        </div>
                        <input
                            type="text"
                            disabled={Boolean(selectedMemberId)}
                            value={tempIdentityRole}
                            onChange={e => setTempIdentityRole(e.target.value)}
                            placeholder="Ví dụ: Trọng tài Sân 1, CTV Trạm Lắp ráp, Đội Hậu cần..."
                            className={`w-full px-3.5 py-2.5 text-sm rounded-[5px] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                selectedMemberId
                                    ? 'bg-slate-100 dark:bg-slate-900/80 opacity-75 cursor-not-allowed'
                                    : 'bg-[var(--bg-secondary)]'
                            }`}
                        />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold rounded-[5px] border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-primary)] transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={!tempIdentityName.trim()}
                            className="px-5 py-2 text-xs font-semibold rounded-[5px] bg-blue-600 hover:bg-blue-700 text-white border-none cursor-pointer disabled:opacity-50 transition-colors"
                        >
                            Xác nhận & Vào Chat
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
