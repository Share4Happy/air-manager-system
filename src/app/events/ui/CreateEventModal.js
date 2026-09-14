'use client';
import React, { useState, useEffect } from 'react';
import {
    IconTrophy,
    IconCheck,
} from '@/app/events/ui/icons';
import { EventModal } from './common';

const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function CreateEventModal({ isOpen, onClose, onSuccess, templates = [], users = [] }) {
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        code: '',
        type: 'competition',
        startDate: getTodayString(),
        endDate: '',
        location: 'Trụ sở AI Robotic',
        description: '',
        lead: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            const today = getTodayString();
            setFormData(prev => ({
                ...prev,
                startDate: prev.startDate || today,
            }));
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

    const handleSubmit = async (e) => {
        e?.preventDefault?.();
        if (!formData.title.trim()) {
            setError('Vui lòng nhập tên sự kiện');
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
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                        1. Chọn Mẫu Quy trình (Template)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {templates.map(tpl => {
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
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ví dụ: AI Robotic Championship 2026 Mùa 1"
                                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                                <option value="competition">Cuộc thi Robotics</option>
                                <option value="workshop">Workshop / Trải nghiệm</option>
                                <option value="showcase">Showcase / Lễ Tốt nghiệp</option>
                                <option value="internal">Nội bộ / Tập huấn</option>
                                <option value="other">Khác</option>
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

                        {/* Start Date */}
                        <div>
                            <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
                                Ngày bắt đầu
                            </label>
                            <input
                                type="date"
                                value={formData.startDate || ''}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
                                Ngày kết thúc
                            </label>
                            <input
                                type="date"
                                value={formData.endDate || ''}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                    </div>
                </div>
            </div>
        </EventModal>
    );
}
