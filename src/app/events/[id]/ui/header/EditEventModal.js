'use client';
import React, { useState, useEffect } from 'react';
import {
    IconEdit,
    IconTag,
    IconCheck,
    IconPlus,
    IconClose,
} from '@/app/events/ui/icons';
import { EventModal, AVAILABLE_EVENT_TAGS, EVENT_TYPE_OPTIONS } from '@/app/events/ui/common';

export default function EditEventModal({
    isOpen,
    onClose,
    editForm,
    setEditForm,
    onSubmit,
    systemTags = [],
    users = [],
}) {
    const [isAddingCustomTag, setIsAddingCustomTag] = useState(false);
    const [customTagInput, setCustomTagInput] = useState('');
    const [fetchedTags, setFetchedTags] = useState([]);
    const [fetchedUsers, setFetchedUsers] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setIsAddingCustomTag(false);
            setCustomTagInput('');
            setError('');

            if (!systemTags || systemTags.length === 0) {
                fetch('/api/events/tags', { cache: 'no-store' })
                    .then(r => r.json())
                    .then(d => {
                        if (d.success && Array.isArray(d.tags)) {
                            setFetchedTags(d.tags);
                        }
                    })
                    .catch(() => {});
            }

            if (!users || users.length === 0) {
                fetch('/api/events/users', { cache: 'no-store' })
                    .then(r => r.json())
                    .then(d => {
                        if (d.success && Array.isArray(d.users)) {
                            setFetchedUsers(d.users);
                        }
                    })
                    .catch(() => {});
            }
        }
    }, [isOpen, systemTags, users]);

    const rawSystemTags = (systemTags && systemTags.length > 0) ? systemTags : (fetchedTags.length > 0 ? fetchedTags : AVAILABLE_EVENT_TAGS);
    const allSystemTags = rawSystemTags.map((tag, idx) => {
        if (typeof tag === 'string') {
            return { _id: tag, name: tag };
        }
        return {
            ...tag,
            _id: tag._id || tag.id || tag.name || `tag-${idx}`,
            name: tag.name || tag.label || '',
        };
    });
    const allUsers = (users && users.length > 0) ? users : fetchedUsers;

    const handleAddCustomTag = async () => {
        const val = customTagInput.trim();
        if (val) {
            setEditForm(prev => {
                const curTags = prev.tags || [];
                if (curTags.includes(val)) return prev;
                return { ...prev, tags: [...curTags, val] };
            });

            // Register tag in system tag database in background if new
            try {
                fetch('/api/events/tags', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: val }),
                }).catch(() => {});
            } catch (e) {}
        }
        setCustomTagInput('');
        setIsAddingCustomTag(false);
    };

    const handleRemoveCustomTag = (tagToRemove) => {
        setEditForm(prev => ({
            ...prev,
            tags: (prev.tags || []).filter(t => t !== tagToRemove),
        }));
    };

    const handleFormSubmit = (e) => {
        e?.preventDefault?.();
        if (!editForm.title?.trim()) {
            setError('Vui lòng nhập tên sự kiện');
            return;
        }
        if (!editForm.startDate) {
            setError('Vui lòng chọn ngày bắt đầu');
            return;
        }
        if (!editForm.endDate) {
            setError('Vui lòng chọn ngày kết thúc');
            return;
        }
        if (editForm.endDate < editForm.startDate) {
            setError('Ngày kết thúc không được trước ngày bắt đầu');
            return;
        }

        setError('');
        onSubmit?.(e);
    };

    return (
        <EventModal
            isOpen={isOpen}
            onClose={onClose}
            title="Chỉnh sửa Thông tin Sự kiện"
            subtitle="Cập nhật tên, phân loại, trưởng ban tổ chức, thẻ sự kiện, thời gian và địa điểm"
            icon={IconEdit}
            maxWidth="max-w-3xl"
            onSubmit={handleFormSubmit}
            submitLabel="Lưu thay đổi"
            cancelLabel="Hủy bỏ"
        >
            <div className="flex flex-col gap-4">
                {error && (
                    <div className="p-3 text-xs sm:text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl font-medium">
                        {error}
                    </div>
                )}

                {/* Event Details Card - Reusing CreateEventModal structure without Template selection */}
                <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex flex-col gap-3">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                        Thông tin Sự kiện
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Title */}
                        <div className="sm:col-span-2">
                            <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
                                Tên sự kiện <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                rows={2}
                                required
                                value={editForm.title}
                                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                placeholder="Ví dụ: AI Robotic Championship 2026 - Giải đấu Sáng tạo Robot Mùa 1"
                                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y transition-all"
                            />
                        </div>

                        {/* Event Type */}
                        <div>
                            <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
                                Loại sự kiện
                            </label>
                            <select
                                value={editForm.type || 'competition'}
                                onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                            >
                                {EVENT_TYPE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Lead Coordinator */}
                        <div>
                            <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
                                Trưởng ban tổ chức (Lead)
                            </label>
                            <select
                                value={editForm.lead || ''}
                                onChange={e => setEditForm({ ...editForm, lead: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                            >
                                <option value="">-- Chọn nhân sự phụ trách chính --</option>
                                {allUsers.map(u => (
                                    <option key={u._id} value={u._id}>
                                        {u.name} ({Array.isArray(u.role) ? u.role.join(', ') : u.role || 'Nhân sự'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Event Tags */}
                        <div className="sm:col-span-2">
                            <label className="text-xs font-semibold text-[var(--text-primary)] mb-1.5 flex items-center gap-1.5">
                                <IconTag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Thẻ sự kiện (Tag)</span>
                            </label>
                            <div className="flex items-center gap-2 flex-wrap">
                                {allSystemTags.map((tag, idx) => {
                                    const tagName = tag.name;
                                    const tagKey = tag._id || tagName || `system-tag-${idx}`;
                                    const isSelected = editForm.tags?.includes(tagName);
                                    return (
                                        <button
                                            key={tagKey}
                                            type="button"
                                            onClick={() => {
                                                setEditForm(prev => {
                                                    const curTags = prev.tags || [];
                                                    const newTags = curTags.includes(tagName)
                                                        ? curTags.filter(t => t !== tagName)
                                                        : [...curTags, tagName];
                                                    return { ...prev, tags: newTags };
                                                });
                                            }}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                                isSelected
                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                                                    : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-emerald-500/50 hover:text-[var(--text-primary)]'
                                            }`}
                                        >
                                            <IconTag className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                                            <span>{tagName}</span>
                                            {isSelected && <IconCheck className="w-3.5 h-3.5 text-white" />}
                                        </button>
                                    );
                                })}

                                {/* Custom Tags */}
                                {(editForm.tags || [])
                                    .filter(t => !allSystemTags.some(at => at.name === t))
                                    .map((customTag, idx) => (
                                        <span
                                            key={`custom-tag-${customTag}-${idx}`}
                                            className="px-3 py-1.5 rounded-xl text-xs font-semibold border bg-emerald-600 text-white border-emerald-600 shadow-xs inline-flex items-center gap-1.5"
                                        >
                                            <IconTag className="w-3.5 h-3.5 text-white" />
                                            <span>{customTag}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCustomTag(customTag)}
                                                className="hover:bg-emerald-700 rounded-full p-0.5 ml-0.5 text-white/90 hover:text-white cursor-pointer transition-colors"
                                                title="Xóa thẻ này"
                                            >
                                                <IconClose className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}

                                {/* Add Custom Tag Button / Input */}
                                {isAddingCustomTag ? (
                                    <div className="inline-flex items-center gap-1.5 p-1 rounded-xl border border-emerald-500 bg-[var(--bg-primary)] ring-2 ring-emerald-500/20">
                                        <input
                                            type="text"
                                            autoFocus
                                            value={customTagInput}
                                            onChange={e => setCustomTagInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddCustomTag();
                                                } else if (e.key === 'Escape') {
                                                    setIsAddingCustomTag(false);
                                                    setCustomTagInput('');
                                                }
                                            }}
                                            placeholder="Nhập thẻ khác..."
                                            className="px-2 py-0.5 text-xs text-[var(--text-primary)] bg-transparent outline-none w-28 sm:w-36 font-medium"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCustomTag}
                                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer transition-colors"
                                        >
                                            Thêm
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsAddingCustomTag(false);
                                                setCustomTagInput('');
                                            }}
                                            className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                                            title="Hủy"
                                        >
                                            <IconClose className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingCustomTag(true)}
                                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-dashed border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
                                    >
                                        <IconPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        <span>Khác</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="sm:col-span-2">
                            <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
                                Mô tả mục tiêu & đối tượng tham gia
                            </label>
                            <textarea
                                rows={2}
                                value={editForm.description || ''}
                                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                placeholder="Nêu tóm tắt mục tiêu, quy mô số lượng học sinh tham gia..."
                                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y transition-all"
                            />
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
                                Ngày bắt đầu <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={editForm.startDate || ''}
                                onClick={e => { try { e.target.showPicker?.(); } catch {} }}
                                onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
                                Ngày kết thúc <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={editForm.endDate || ''}
                                onClick={e => { try { e.target.showPicker?.(); } catch {} }}
                                onChange={e => setEditForm({ ...editForm, endDate: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                            />
                        </div>

                        {/* Location */}
                        <div className="sm:col-span-2">
                            <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
                                Địa điểm tổ chức
                            </label>
                            <input
                                type="text"
                                value={editForm.location || ''}
                                onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                                placeholder="Ví dụ: Hội trường chính AI Robotic, Tầng 3"
                                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>

                        {/* Event Link */}
                        <div className="sm:col-span-2">
                            <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
                                Link liên kết sự kiện (Google Drive / Canva / Kịch bản / Họp online)
                            </label>
                            <input
                                type="text"
                                value={editForm.link || ''}
                                onChange={e => setEditForm({ ...editForm, link: e.target.value })}
                                placeholder="https://... hoặc drive.google.com/..."
                                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </EventModal>
    );
}

