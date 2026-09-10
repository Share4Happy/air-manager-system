'use client';
import React, { useState, useEffect } from 'react';
import {
    IconTrophy,
    IconCheck,
} from '@/app/events/ui/icons';
import { EventModal } from './common';

export default function CreateEventModal({ isOpen, onClose, onSuccess, templates = [], users = [] }) {
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        code: '',
        type: 'competition',
        startDate: '',
        endDate: '',
        location: 'Trụ sở AI Robotic',
        description: '',
        lead: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    const modalTitle = (
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                <IconTrophy className="w-5 h-5 text-white" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Tạo Sự kiện mới</h2>
                <p className="text-xs text-[var(--text-secondary)]">Khởi tạo kế hoạch tổ chức sự kiện và cấu trúc lộ trình cây</p>
            </div>
        </div>
    );

    return (
        <EventModal
            isOpen={isOpen}
            onClose={onClose}
            title={modalTitle}
            maxWidth="max-w-3xl"
            onSubmit={handleSubmit}
            submitLabel="Khởi tạo Sự kiện"
            cancelLabel="Hủy bỏ"
            loading={loading}
        >
            <div className="flex flex-col gap-5">
                {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-xl">
                        {error}
                    </div>
                )}

                {/* Step 1: Template Selection */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2">
                        1. Chọn Mẫu Quy trình (Template)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {templates.map(tpl => {
                            const isSelected = selectedTemplateId === tpl._id;
                            return (
                                <div
                                    key={tpl._id}
                                    onClick={() => handleTemplateSelect(tpl._id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between text-left ${
                                        isSelected
                                            ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm ring-1 ring-blue-600'
                                            : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-gray-400'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{tpl.name}</span>
                                            {isSelected && <IconCheck className="w-4 h-4 text-blue-600" />}
                                        </div>
                                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">{tpl.description}</p>
                                    </div>
                                    <div className="text-[10px] text-[var(--text-secondary)] mt-2 font-medium opacity-80">
                                        {tpl.roadmapNodes?.length || 0} khâu • {tpl.budgetItems?.length || 0} mục ngân sách
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step 2: Event Details */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2">
                        2. Thông tin Sự kiện
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Title */}
                        <div className="sm:col-span-2">
                            <span className="text-xs text-[var(--text-secondary)] font-medium mb-1 block">Tên sự kiện *</span>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ví dụ: AI Robotic Championship 2026 Mùa 1"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Event Type */}
                        <div>
                            <span className="text-xs text-[var(--text-secondary)] font-medium mb-1 block">Loại sự kiện</span>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            <span className="text-xs text-[var(--text-secondary)] font-medium mb-1 block">Trưởng ban tổ chức (Lead)</span>
                            <select
                                value={formData.lead}
                                onChange={e => setFormData({ ...formData, lead: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            <span className="text-xs text-[var(--text-secondary)] font-medium mb-1 block">Ngày bắt đầu</span>
                            <input
                                type="date"
                                value={formData.startDate ? new Date(formData.startDate).toISOString().slice(0, 10) : ''}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <span className="text-xs text-[var(--text-secondary)] font-medium mb-1 block">Ngày kết thúc</span>
                            <input
                                type="date"
                                value={formData.endDate ? new Date(formData.endDate).toISOString().slice(0, 10) : ''}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Location */}
                        <div className="sm:col-span-2">
                            <span className="text-xs text-[var(--text-secondary)] font-medium mb-1 block">Địa điểm tổ chức</span>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Ví dụ: Hội trường chính AI Robotic, Tầng 3"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Description */}
                        <div className="sm:col-span-2">
                            <span className="text-xs text-[var(--text-secondary)] font-medium mb-1 block">Mô tả mục tiêu & đối tượng tham gia</span>
                            <textarea
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Nêu tóm tắt mục tiêu, quy mô số lượng học sinh tham gia..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </EventModal>
    );
}
