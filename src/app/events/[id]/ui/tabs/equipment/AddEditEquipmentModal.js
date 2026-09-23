'use client';
import React, { useState, useEffect } from 'react';
import { IconPackage } from '@/app/events/ui/icons';
import EventModal from '@/app/events/ui/common/EventModal';
import { CONDITIONS } from './equipmentConstants';

export default function AddEditEquipmentModal({
    isOpen,
    onClose,
    editingItem,
    onSave,
    mergedCategories = {},
    stations = [],
    users = [],
    members = [],
}) {
    const [formData, setFormData] = useState({
        name: '',
        category: 'robot_model',
        quantity: 1,
        unit: 'Bộ',
        assignedStation: '',
        assigneeName: '',
        condition: 'Tốt',
        notes: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (editingItem) {
                setFormData({
                    name: editingItem.name || '',
                    category: editingItem.category || 'robot_model',
                    quantity: editingItem.quantity || 1,
                    unit: editingItem.unit || 'Bộ',
                    assignedStation: editingItem.assignedStation || '',
                    assigneeName: editingItem.assigneeName || '',
                    condition: editingItem.condition || 'Tốt',
                    notes: editingItem.notes || '',
                });
            } else {
                setFormData({
                    name: '',
                    category: 'robot_model',
                    quantity: 1,
                    unit: 'Bộ',
                    assignedStation: stations[0]?.name || '',
                    assigneeName: '',
                    condition: 'Tốt',
                    notes: '',
                });
            }
        }
    }, [isOpen, editingItem, stations]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        onSave(formData);
        onClose();
    };

    return (
        <EventModal
            isOpen={isOpen}
            onClose={onClose}
            title={editingItem ? 'Chỉnh sửa thiết bị mang theo' : 'Thêm thiết bị / linh kiện mang theo'}
            subtitle="Quản lý danh mục thiết bị, số lượng và thông tin phân công bàn giao"
            icon={IconPackage}
            maxWidth="max-w-lg"
            onSubmit={handleSubmit}
            submitLabel={editingItem ? 'Cập nhật thiết bị' : 'Thêm vào danh sách'}
        >
            {/* 1. Basic equipment info */}
            <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex flex-col gap-3">
                <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Thông tin thiết bị & Số lượng
                </span>

                {/* Name */}
                <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                        Tên thiết bị / linh kiện <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Vd: Robot cú mèo lắp sẵn, Bộ Kit Microbit K24, Pin 18650..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-[var(--text-primary)] font-medium transition-all"
                    />
                </div>

                {/* Category & Condition */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                            Phân loại danh mục
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-[var(--text-primary)] font-medium transition-all cursor-pointer"
                        >
                            {Object.entries(mergedCategories).map(([key, item]) => (
                                <option key={key} value={key}>
                                    {item.label} {item.isCustom ? '(Tùy chỉnh)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                            Tình trạng thiết bị
                        </label>
                        <select
                            value={formData.condition}
                            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-[var(--text-primary)] font-medium transition-all cursor-pointer"
                        >
                            {CONDITIONS.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Quantity & Unit */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                            Số lượng mang theo <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            required
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-[var(--text-primary)] font-bold transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                            Đơn vị tính
                        </label>
                        <input
                            type="text"
                            value={formData.unit}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            placeholder="Bộ, Con, Cái, Hộp..."
                            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-[var(--text-primary)] font-medium transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* 2. Assignment & Location */}
            <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex flex-col gap-3">
                <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Vị trí sử dụng & Người phụ trách
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                            Trạm / Khu vực sử dụng
                        </label>
                        <input
                            type="text"
                            list="station-options"
                            value={formData.assignedStation}
                            onChange={(e) => setFormData({ ...formData, assignedStation: e.target.value })}
                            placeholder="Vd: Khu vực Lắp ráp, Sảnh chính..."
                            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-[var(--text-primary)] font-medium transition-all"
                        />
                        <datalist id="station-options">
                            {stations.map((st) => (
                                <option key={st.id} value={st.name} />
                            ))}
                        </datalist>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                            Người phụ trách / Bàn giao
                        </label>
                        <input
                            type="text"
                            list="assignee-options"
                            value={formData.assigneeName}
                            onChange={(e) => setFormData({ ...formData, assigneeName: e.target.value })}
                            placeholder="Chọn hoặc nhập tên..."
                            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-[var(--text-primary)] font-medium transition-all"
                        />
                        <datalist id="assignee-options">
                            {users.map((u) => (
                                <option key={u._id} value={u.name} />
                            ))}
                            {members.map((m) => (
                                <option key={m.id} value={m.name} />
                            ))}
                        </datalist>
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                        Ghi chú thêm
                    </label>
                    <textarea
                        rows={2}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Lưu ý khi vận chuyển, phụ kiện kèm theo..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-y text-[var(--text-primary)] font-medium transition-all"
                    />
                </div>
            </div>
        </EventModal>
    );
}
