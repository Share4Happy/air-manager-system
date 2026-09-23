'use client';
import React, { useState } from 'react';
import { IconTag, IconPlus, IconEdit, IconTrash, IconCheck } from '@/app/events/ui/icons';
import EventModal from '@/app/events/ui/common/EventModal';
import { useEventDialog } from '@/app/events/ui/common';
import { DEFAULT_EQUIPMENT_CATEGORIES, CATEGORY_COLOR_PALETTES } from './equipmentConstants';

export default function ManageEquipmentCategoriesModal({
    isOpen,
    onClose,
    event,
    checklist = [],
    onUpdateMultiple,
    readOnly = false,
}) {
    const dialog = useEventDialog();
    const [newCategoryLabel, setNewCategoryLabel] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLOR_PALETTES[0].color);
    const [editingCatKey, setEditingCatKey] = useState(null);

    const handleSaveCategory = (e) => {
        e.preventDefault();
        if (readOnly || !onUpdateMultiple) return;
        if (!newCategoryLabel.trim()) return;

        const label = newCategoryLabel.trim();
        const existingList = event?.equipmentCategories || [];

        if (editingCatKey) {
            const updated = existingList.map((c) =>
                c.key === editingCatKey ? { ...c, label, color: newCategoryColor } : c
            );
            onUpdateMultiple({ equipmentCategories: updated });
        } else {
            const key = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            const newCat = {
                id: key,
                key: key,
                label: label,
                color: newCategoryColor,
            };
            const updated = [...existingList, newCat];
            onUpdateMultiple({ equipmentCategories: updated });
        }

        setNewCategoryLabel('');
        setNewCategoryColor(CATEGORY_COLOR_PALETTES[0].color);
        setEditingCatKey(null);
    };

    const handleDeleteCategory = async (catKey) => {
        if (readOnly || !onUpdateMultiple) return;
        const ok = await dialog.confirm('Bạn có chắc muốn xóa tag danh mục này? Các thiết bị thuộc tag này vẫn được giữ nguyên.', {
            title: 'Xóa danh mục thiết bị',
            type: 'warning',
            confirmText: 'Xóa tag',
        });
        if (!ok) return;
        const existingList = event?.equipmentCategories || [];
        const updated = existingList.filter((c) => c.key !== catKey);
        onUpdateMultiple({ equipmentCategories: updated });
        if (editingCatKey === catKey) {
            setEditingCatKey(null);
            setNewCategoryLabel('');
        }
        dialog.toast('Đã xóa danh mục thiết bị', 'info');
    };

    const handleClose = () => {
        setEditingCatKey(null);
        setNewCategoryLabel('');
        setNewCategoryColor(CATEGORY_COLOR_PALETTES[0].color);
        onClose();
    };

    return (
        <EventModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Quản lý Tag & Danh mục Thiết bị"
            subtitle="Tạo thêm hoặc chỉnh sửa các nhóm phân loại thiết bị tùy chỉnh cho sự kiện"
            icon={IconTag}
            maxWidth="max-w-xl"
        >
            <div className="flex flex-col gap-5">
                {/* Form Add / Edit Category */}
                {!readOnly && (
                    <form onSubmit={handleSaveCategory} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 flex flex-col gap-3.5">
                        <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                            {editingCatKey ? '✏️ Chỉnh sửa Tag Danh mục' : '➕ Thêm Tag Danh mục mới'}
                        </span>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                                Tên Tag / Danh mục <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={newCategoryLabel}
                                onChange={(e) => setNewCategoryLabel(e.target.value)}
                                placeholder="Ví dụ: Âm thanh & Ánh sáng, Thảm thi đấu, Quà tặng..."
                                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-[var(--text-primary)] font-medium transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                                Màu sắc hiển thị của Tag
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                {CATEGORY_COLOR_PALETTES.map((pal) => {
                                    const isSelected = newCategoryColor === pal.color;
                                    return (
                                        <button
                                            key={pal.id}
                                            type="button"
                                            onClick={() => setNewCategoryColor(pal.color)}
                                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${pal.color} ${
                                                isSelected ? 'ring-2 ring-offset-1 ring-blue-500 font-extrabold shadow-xs' : 'opacity-80 hover:opacity-100'
                                            }`}
                                        >
                                            <span className={`w-2.5 h-2.5 rounded-full ${pal.preview}`} />
                                            <span className="truncate">{pal.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Preview Badge */}
                        {newCategoryLabel.trim() && (
                            <div className="flex items-center gap-2 pt-1 text-xs text-[var(--text-secondary)]">
                                <span>Xem trước:</span>
                                <span className={`px-2.5 py-0.5 rounded-md border font-bold text-xs ${newCategoryColor}`}>
                                    {newCategoryLabel.trim()}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1">
                            {editingCatKey && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingCatKey(null);
                                        setNewCategoryLabel('');
                                        setNewCategoryColor(CATEGORY_COLOR_PALETTES[0].color);
                                    }}
                                    className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                                >
                                    Hủy sửa
                                </button>
                            )}
                            <button
                                type="submit"
                                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs border-none cursor-pointer flex items-center gap-1.5"
                            >
                                <IconCheck className="w-3.5 h-3.5" />
                                <span>{editingCatKey ? 'Lưu thay đổi' : 'Tạo Tag mới'}</span>
                            </button>
                        </div>
                    </form>
                )}

                {/* List of Custom Categories */}
                <div className="flex flex-col gap-2.5">
                    <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        Danh sách Tag tùy chỉnh ({event?.equipmentCategories?.length || 0})
                    </span>

                    {(!event?.equipmentCategories || event.equipmentCategories.length === 0) ? (
                        <div className="py-6 text-center text-xs text-[var(--text-secondary)] italic border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)]/20">
                            Chưa có Tag danh mục tùy chỉnh nào. Bạn có thể tạo tag mới ở trên!
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                            {event.equipmentCategories.map((cat) => {
                                const usageCount = checklist.filter((it) => it.category === cat.key).length;
                                return (
                                    <div
                                        key={cat.key}
                                        className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] gap-2 shadow-2xs"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className={`px-2.5 py-1 rounded-md border text-xs font-bold shrink-0 ${cat.color || CATEGORY_COLOR_PALETTES[0].color}`}>
                                                {cat.label}
                                            </span>
                                            <span className="text-xs text-[var(--text-secondary)] truncate">
                                                ({usageCount} thiết bị)
                                            </span>
                                        </div>
                                        {!readOnly && (
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingCatKey(cat.key);
                                                        setNewCategoryLabel(cat.label);
                                                        setNewCategoryColor(cat.color || CATEGORY_COLOR_PALETTES[0].color);
                                                    }}
                                                    className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer border-none bg-transparent transition-colors"
                                                    title="Chỉnh sửa tag"
                                                >
                                                    <IconEdit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteCategory(cat.key)}
                                                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer border-none bg-transparent transition-colors"
                                                    title="Xóa tag"
                                                >
                                                    <IconTrash className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* List of Standard / System Categories */}
                <div className="pt-3 border-t border-[var(--border-color)] flex flex-col gap-2">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        Các Tag mặc định hệ thống
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {Object.entries(DEFAULT_EQUIPMENT_CATEGORIES).map(([k, cat]) => (
                            <span key={k} className={`px-2 py-0.5 rounded-md border text-[11px] font-medium opacity-80 ${cat.color}`}>
                                {cat.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </EventModal>
    );
}
