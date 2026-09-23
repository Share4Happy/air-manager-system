'use client';
import React, { useState, useEffect } from 'react';
import {
    IconTrophy,
    IconCheck,
    IconTag,
    IconPlus,
    IconClose,
    IconSearch,
} from '@/app/events/ui/icons';
import { EventModal, AVAILABLE_EVENT_TAGS, EVENT_TYPE_OPTIONS } from './common';

const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function CreateEventModal({ isOpen, onClose, onSuccess, templates = [], tags: systemTags = [], users = [] }) {
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [templateSearch, setTemplateSearch] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        code: '',
        type: 'competition',
        startDate: getTodayString(),
        endDate: '',
        location: 'Trụ sở AI Robotic',
        link: '',
        description: '',
        lead: '',
        tags: [],
    });
    const [isAddingCustomTag, setIsAddingCustomTag] = useState(false);
    const [customTagInput, setCustomTagInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            const today = getTodayString();
            setFormData(prev => ({
                ...prev,
                startDate: prev.startDate || today,
            }));
            setIsAddingCustomTag(false);
            setCustomTagInput('');
            setTemplateSearch('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (templates.length > 0 && !selectedTemplateId) {
            setSelectedTemplateId(templates[0]._id);
            setFormData(prev => ({
                ...prev,
                title: templates[0].name || '',
                type: templates[0].type || 'competition',
            }));
        }
    }, [templates]);

    if (!isOpen) return null;

    const filteredTemplates = templates.filter(tpl => {
        if (!templateSearch.trim()) return true;
        const q = templateSearch.toLowerCase().trim();
        return tpl.name?.toLowerCase().includes(q) || tpl.description?.toLowerCase().includes(q);
    });

    const displayedTemplates = templateSearch.trim()
        ? filteredTemplates
        : templates.slice(0, 3);

    const handleTemplateSelect = (templateId) => {
        setSelectedTemplateId(templateId);
        const tpl = templates.find(t => t._id === templateId);
        if (tpl) {
            setFormData(prev => ({
                ...prev,
                title: tpl.name,
                type: tpl.type,
                description: tpl.description || '',
            }));
        }
    };

    const handleAddCustomTag = async () => {
        const val = customTagInput.trim();
        if (val) {
            setFormData(prev => {
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
        setFormData(prev => ({
            ...prev,
            tags: (prev.tags || []).filter(t => t !== tagToRemove),
        }));
    };

    const handleSubmit = async (e) => {
        e?.preventDefault?.();
        if (!formData.title.trim()) {
            setError('Vui lòng nhập tên sự kiện');
            return;
        }
        if (!formData.startDate) {
            setError('Vui lòng chọn ngày bắt đầu');
            return;
        }
        if (!formData.endDate) {
            setError('Vui lòng chọn ngày kết thúc');
            return;
        }
        if (formData.endDate < formData.startDate) {
            setError('Ngày kết thúc không được trước ngày bắt đầu');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    templateId: selectedTemplateId || undefined,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                onSuccess?.(data.event);
                onClose();
            } else {
                setError(data.message || 'Lỗi khi tạo sự kiện');
            }
        } catch (err) {
            console.error(err);
            setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <EventModal
            isOpen={isOpen}
            onClose={onClose}
            title="Tạo Sự kiện Mới"
            subtitle="Khởi tạo kế hoạch tổ chức sự kiện, thiết lập phân công và cấu trúc lộ trình"
            icon={IconTrophy}
            maxWidth="max-w-3xl"
            onSubmit={handleSubmit}
            submitLabel="Khởi tạo Sự kiện"
            cancelLabel="Hủy bỏ"
            loading={loading}
        >
            <div className="flex flex-col gap-4">
                {error && (
                    <div className="p-3 text-xs sm:text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl font-medium">
                        {error}
                    </div>
                )}

                {/* Step 1: Template Selection */}
                <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                                1. Chọn Mẫu Quy trình (Template)
                            </span>
                            <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                                ({templateSearch.trim() ? `Tìm thấy ${displayedTemplates.length}` : '3 mẫu gần nhất'})
                            </span>
                        </div>

                        {/* Search Box */}
                        <div className="relative w-full sm:w-64">
                            <IconSearch className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
                            <input
                                type="text"
                                value={templateSearch}
                                onChange={e => setTemplateSearch(e.target.value)}
                                placeholder="Tìm kiếm mẫu quy trình..."
                                className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/70 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                            {templateSearch && (
                                <button
                                    type="button"
                                    onClick={() => setTemplateSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                                    title="Xóa tìm kiếm"
                                >
                                    <IconClose className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {displayedTemplates.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {displayedTemplates.map(tpl => {
                                const isSelected = selectedTemplateId === tpl._id;
                                return (
                                    <div
                                        key={tpl._id}
                                        onClick={() => handleTemplateSelect(tpl._id)}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-150 flex flex-col justify-between text-left ${
                                            isSelected
                                                ? 'border-blue-600 bg-blue-500/10 shadow-xs ring-1 ring-blue-500'
                                                : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-blue-500/50'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-xs font-bold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-primary)]'}`}>
                                                    {tpl.name}
                                                </span>
                                                {isSelected && <IconCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                                            </div>
                                            <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                                                {tpl.description}
                                            </p>
                                        </div>
                                        <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-2 font-medium">
                                            {tpl.roadmapNodes?.length || 0} khâu • {tpl.budgetItems?.length || 0} mục ngân sách
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-4 text-center text-xs text-[var(--text-secondary)] bg-[var(--bg-primary)] rounded-xl border border-dashed border-[var(--border-color)]">
                            Không tìm thấy mẫu quy trình nào khớp với "{templateSearch}"
                        </div>
                    )}
                </div>

                {/* Step 2: Event Details */}
                <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex flex-col gap-3">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                        2. Thông tin Sự kiện
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
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
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
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
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
                                value={formData.lead}
                                onChange={e => setFormData({ ...formData, lead: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                            >
                                <option value="">-- Chọn nhân sự phụ trách chính --</option>
                                {users.map(u => (
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
                                {(systemTags.length > 0 ? systemTags : AVAILABLE_EVENT_TAGS).map((rawTag, idx) => {
                                    const tag = typeof rawTag === 'string' ? { _id: rawTag, name: rawTag } : rawTag;
                                    const tagName = tag.name || tag.label || '';
                                    const tagKey = tag._id || tag.id || tagName || `create-tag-${idx}`;
                                    const isSelected = formData.tags?.includes(tagName);
                                    return (
                                        <button
                                            key={tagKey}
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => {
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
                                {(formData.tags || [])
                                    .filter(t => !(systemTags.length > 0 ? systemTags : AVAILABLE_EVENT_TAGS).some(at => (typeof at === 'string' ? at : at.name) === t))
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
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
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
                                value={formData.startDate || ''}
                                onClick={e => { try { e.target.showPicker?.(); } catch {} }}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
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
                                value={formData.endDate || ''}
                                onClick={e => { try { e.target.showPicker?.(); } catch {} }}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
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
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
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
                                value={formData.link || ''}
                                onChange={e => setFormData({ ...formData, link: e.target.value })}
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

