'use client';
import React, { useState, useMemo } from 'react';
import {
    IconPackage,
    IconPlus,
    IconTrash,
    IconEdit,
    IconCheck,
    IconDownload,
    IconUpload,
    IconLocation,
    IconUser,
    IconZap,
    IconTag,
} from '@/app/events/ui/icons';
import EventToolbar from '@/app/events/ui/common/EventToolbar';
import EventTable from '@/app/events/ui/common/EventTable';
import ActionMenu from '@/app/events/ui/common/ActionMenu';
import EventModal from '@/app/events/ui/common/EventModal';
import ImportEquipmentModal from './ImportEquipmentModal';

const DEFAULT_EQUIPMENT_CATEGORIES = {
    robot_model: { label: 'Mô hình Robot', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' },
    kit: { label: 'Bộ Kit học tập', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
    electronics: { label: 'Linh kiện & Pin', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
    laptop_screen: { label: 'Laptop & Thiết bị số', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800' },
    tools: { label: 'Dụng cụ & Kỹ thuật', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800' },
    banner_props: { label: 'Sa bàn, Backdrop & Quà', color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800' },
    other: { label: 'Khác', color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' },
};

const CATEGORY_COLOR_PALETTES = [
    { id: 'blue', label: 'Xanh dương', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800', preview: 'bg-blue-500' },
    { id: 'emerald', label: 'Xanh lá', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', preview: 'bg-emerald-500' },
    { id: 'purple', label: 'Tím', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800', preview: 'bg-purple-500' },
    { id: 'amber', label: 'Vàng cam', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800', preview: 'bg-amber-500' },
    { id: 'rose', label: 'Hồng đỏ', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800', preview: 'bg-rose-500' },
    { id: 'indigo', label: 'Chàm', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800', preview: 'bg-indigo-500' },
    { id: 'teal', label: 'Xanh ngọc', color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800', preview: 'bg-teal-500' },
    { id: 'cyan', label: 'Xanh cyan', color: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800', preview: 'bg-cyan-500' },
    { id: 'gray', label: 'Xám bạc', color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700', preview: 'bg-gray-500' },
];

const CONDITIONS = [
    { value: 'Tốt', label: 'Tốt / Đầy đủ', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
    { value: 'Cần sạc pin', label: 'Cần sạc pin', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
    { value: 'Thiếu phụ kiện', label: 'Thiếu phụ kiện', color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800' },
    { value: 'Cần sửa/Hỏng', label: 'Cần sửa / Hỏng', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' },
];

export default function EventEquipmentChecklistView({
    event,
    checklist = [],
    onUpdateChecklist,
    onUpdateMultiple,
    users = [],
    members = [],
    readOnly = false,
}) {
    const items = useMemo(() => checklist || [], [checklist]);
    const stations = useMemo(() => event?.stations || [], [event]);

    // Merged categories (Default + Event Custom)
    const mergedCategories = useMemo(() => {
        const custom = {};
        (event?.equipmentCategories || []).forEach((cat) => {
            if (cat.key && cat.label) {
                custom[cat.key] = {
                    label: cat.label,
                    color: cat.color || CATEGORY_COLOR_PALETTES[0].color,
                    isCustom: true,
                    id: cat.id || cat.key,
                };
            }
        });
        return { ...DEFAULT_EQUIPMENT_CATEGORIES, ...custom };
    }, [event?.equipmentCategories]);

    // Filters
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStation, setSelectedStation] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    // Modals
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
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

    const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);

    // Manage Categories Modal state
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
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

    const handleDeleteCategory = (catKey) => {
        if (readOnly || !onUpdateMultiple) return;
        if (!confirm('Bạn có chắc muốn xóa tag danh mục này? Các thiết bị thuộc tag này vẫn được giữ nguyên.')) return;
        const existingList = event?.equipmentCategories || [];
        const updated = existingList.filter((c) => c.key !== catKey);
        onUpdateMultiple({ equipmentCategories: updated });
        if (editingCatKey === catKey) {
            setEditingCatKey(null);
            setNewCategoryLabel('');
        }
    };

    // Save helper
    const saveChecklist = (newItems) => {
        onUpdateChecklist?.(newItems);
    };

    // Toggle Packed
    const handleTogglePacked = (itemId) => {
        const updated = items.map((it) => {
            if (it.id === itemId) {
                const nextPacked = !it.isPacked;
                return {
                    ...it,
                    isPacked: nextPacked,
                    packedAt: nextPacked ? new Date() : null,
                };
            }
            return it;
        });
        saveChecklist(updated);
    };

    // Toggle Returned
    const handleToggleReturned = (itemId) => {
        const updated = items.map((it) => {
            if (it.id === itemId) {
                const nextReturned = !it.isReturned;
                return {
                    ...it,
                    isReturned: nextReturned,
                    returnedAt: nextReturned ? new Date() : null,
                };
            }
            return it;
        });
        saveChecklist(updated);
    };

    // Delete item
    const handleDeleteItem = (itemId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa thiết bị này khỏi danh sách mang theo?')) return;
        const updated = items.filter((it) => it.id !== itemId);
        saveChecklist(updated);
    };

    // Open Add / Edit Modal
    const handleOpenAdd = () => {
        setEditingItem(null);
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
        setIsFormOpen(true);
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name || '',
            category: item.category || 'robot_model',
            quantity: item.quantity || 1,
            unit: item.unit || 'Bộ',
            assignedStation: item.assignedStation || '',
            assigneeName: item.assigneeName || '',
            condition: item.condition || 'Tốt',
            notes: item.notes || '',
        });
        setIsFormOpen(true);
    };

    // Submit Form
    const handleSaveForm = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        if (editingItem) {
            const updated = items.map((it) =>
                it.id === editingItem.id
                    ? {
                          ...it,
                          name: formData.name.trim(),
                          category: formData.category,
                          quantity: Number(formData.quantity) || 1,
                          unit: formData.unit.trim() || 'Bộ',
                          assignedStation: formData.assignedStation.trim(),
                          assigneeName: formData.assigneeName.trim(),
                          condition: formData.condition,
                          notes: formData.notes.trim(),
                      }
                    : it
            );
            saveChecklist(updated);
        } else {
            const newItem = {
                id: `eq-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                name: formData.name.trim(),
                category: formData.category,
                quantity: Number(formData.quantity) || 1,
                unit: formData.unit.trim() || 'Bộ',
                assignedStation: formData.assignedStation.trim(),
                assigneeName: formData.assigneeName.trim(),
                isPacked: false,
                isReturned: false,
                condition: formData.condition,
                notes: formData.notes.trim(),
            };
            saveChecklist([...items, newItem]);
        }
        setIsFormOpen(false);
    };

    // Batch actions
    const handleBatchPackAll = (packedState = true) => {
        const updated = items.map((it) => ({
            ...it,
            isPacked: packedState,
            packedAt: packedState ? new Date() : null,
        }));
        saveChecklist(updated);
    };

    const handleBatchReturnAll = (returnedState = true) => {
        const updated = items.map((it) => ({
            ...it,
            isReturned: returnedState,
            returnedAt: returnedState ? new Date() : null,
        }));
        saveChecklist(updated);
    };

    // Preset import samples
    const handleImportPreset = (presetType) => {
        let presetItems = [];
        if (presetType === 'robotic_competition') {
            presetItems = [
                { id: `eq-${Date.now()}-1`, name: 'Mô hình Sa bàn thi đấu chuẩn', category: 'banner_props', quantity: 2, unit: 'Bộ', condition: 'Tốt', isPacked: false, isReturned: false },
                { id: `eq-${Date.now()}-2`, name: 'Robot thi đấu AI / Dò line', category: 'robot_model', quantity: 6, unit: 'Con', condition: 'Tốt', isPacked: false, isReturned: false },
                { id: `eq-${Date.now()}-3`, name: 'Pin sạc Li-ion 18650 & Đốc sạc', category: 'electronics', quantity: 12, unit: 'Viên', condition: 'Cần sạc pin', isPacked: false, isReturned: false },
                { id: `eq-${Date.now()}-4`, name: 'Bộ dụng cụ tua vít & kìm nhổ ốc', category: 'tools', quantity: 3, unit: 'Hộp', condition: 'Tốt', isPacked: false, isReturned: false },
                { id: `eq-${Date.now()}-5`, name: 'Laptop điều phối & nạp code', category: 'laptop_screen', quantity: 2, unit: 'Máy', condition: 'Tốt', isPacked: false, isReturned: false },
                { id: `eq-${Date.now()}-6`, name: 'Ổ cắm điện dài 5m & Cáp nối', category: 'tools', quantity: 3, unit: 'Cuộn', condition: 'Tốt', isPacked: false, isReturned: false },
                { id: `eq-${Date.now()}-7`, name: 'Huy chương & Giấy chứng nhận', category: 'banner_props', quantity: 30, unit: 'Cái', condition: 'Tốt', isPacked: false, isReturned: false },
            ];
        } else if (presetType === 'stem_workshop') {
            presetItems = [
                { id: `eq-${Date.now()}-1`, name: 'Bộ Kit trải nghiệm lắp ráp Robotic', category: 'kit', quantity: 15, unit: 'Hộp', condition: 'Tốt', isPacked: false, isReturned: false },
                { id: `eq-${Date.now()}-2`, name: 'Máy tính bảng / Tablet học sinh', category: 'laptop_screen', quantity: 10, unit: 'Chiếc', condition: 'Cần sạc pin', isPacked: false, isReturned: false },
                { id: `eq-${Date.now()}-3`, name: 'Passport trải nghiệm & Con dấu', category: 'banner_props', quantity: 100, unit: 'Tờ', condition: 'Tốt', isPacked: false, isReturned: false },
                { id: `eq-${Date.now()}-4`, name: 'Mô hình Robot trình diễn (Robot Chó/Nhện)', category: 'robot_model', quantity: 2, unit: 'Con', condition: 'Tốt', isPacked: false, isReturned: false },
                { id: `eq-${Date.now()}-5`, name: 'Sticker & Quà tặng trải nghiệm', category: 'banner_props', quantity: 1, unit: 'Túi', condition: 'Tốt', isPacked: false, isReturned: false },
                { id: `eq-${Date.now()}-6`, name: 'Băng dính cách điện & Dây rút', category: 'tools', quantity: 2, unit: 'Cuộn', condition: 'Tốt', isPacked: false, isReturned: false },
            ];
        }

        if (presetItems.length > 0) {
            saveChecklist([...items, ...presetItems]);
            setIsPresetModalOpen(false);
        }
    };

    // Filter items
    const filteredItems = useMemo(() => {
        return items.filter((it) => {
            const matchSearch =
                !search.trim() ||
                (it.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (it.assignedStation || '').toLowerCase().includes(search.toLowerCase()) ||
                (it.assigneeName || '').toLowerCase().includes(search.toLowerCase()) ||
                (it.notes || '').toLowerCase().includes(search.toLowerCase());

            const matchCat = selectedCategory === 'all' || it.category === selectedCategory;
            const matchStation = selectedStation === 'all' || it.assignedStation === selectedStation;

            let matchStatus = true;
            if (selectedStatus === 'not_packed') matchStatus = !it.isPacked;
            else if (selectedStatus === 'packed') matchStatus = it.isPacked && !it.isReturned;
            else if (selectedStatus === 'returned') matchStatus = it.isReturned;

            return matchSearch && matchCat && matchStation && matchStatus;
        });
    }, [items, search, selectedCategory, selectedStation, selectedStatus]);

    // Export CSV
    const handleExportCSV = () => {
        if (items.length === 0) return;
        const headers = ['STT', 'Tên thiết bị/linh kiện', 'Phân loại', 'Số lượng', 'Đơn vị', 'Trạm phụ trách', 'Người phụ trách', 'Đã đóng gói (Đi)', 'Đã thu hồi (Về)', 'Tình trạng', 'Ghi chú'];
        const rows = items.map((it, idx) => [
            idx + 1,
            `"${it.name.replace(/"/g, '""')}"`,
            `"${mergedCategories[it.category]?.label || it.category}"`,
            it.quantity || 1,
            `"${it.unit || 'Bộ'}"`,
            `"${it.assignedStation || ''}"`,
            `"${it.assigneeName || ''}"`,
            it.isPacked ? 'ĐÃ ĐÓNG GÓI' : 'CHƯA',
            it.isReturned ? 'ĐÃ THU HỒI' : 'CHƯA',
            `"${it.condition || 'Tốt'}"`,
            `"${(it.notes || '').replace(/"/g, '""')}"`,
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Checklist_Thiet_Bi_${event?.title || 'Event'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Table Columns Configuration
    const columns = [
        {
            key: 'stt',
            header: 'STT',
            align: 'center',
            width: 'w-14',
            render: (val, item, idx) => (
                <span className="text-[var(--text-secondary)] font-semibold text-sm sm:text-base">
                    {idx + 1}
                </span>
            ),
        },
        {
            key: 'isPacked',
            header: 'Mang đi',
            align: 'center',
            width: 'w-24',
            render: (val, item) => (
                readOnly ? (
                    <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center mx-auto ${
                            item.isPacked
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                        }`}
                    >
                        {item.isPacked && <IconCheck className="w-4 h-4 stroke-[3]" />}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => handleTogglePacked(item.id)}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer mx-auto ${
                            item.isPacked
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-emerald-500'
                        }`}
                        title={item.isPacked ? 'Đã đóng gói mang đi (Bấm để hủy)' : 'Bấm để đánh dấu đã đóng gói mang đi'}
                    >
                        {item.isPacked && <IconCheck className="w-4 h-4 stroke-[3]" />}
                    </button>
                )
            ),
        },
        {
            key: 'isReturned',
            header: 'Mang về',
            align: 'center',
            width: 'w-24',
            render: (val, item) => (
                readOnly ? (
                    <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center mx-auto ${
                            item.isReturned
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                        }`}
                    >
                        {item.isReturned && <IconCheck className="w-4 h-4 stroke-[3]" />}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => handleToggleReturned(item.id)}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer mx-auto ${
                            item.isReturned
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-indigo-500'
                        }`}
                        title={item.isReturned ? 'Đã thu hồi mang về (Bấm để hủy)' : 'Bấm để đánh dấu đã thu hồi mang về'}
                    >
                        {item.isReturned && <IconCheck className="w-4 h-4 stroke-[3]" />}
                    </button>
                )
            ),
        },
        {
            key: 'name',
            header: 'Tên Thiết Bị / Linh Kiện',
            render: (val, item) => (
                <div className="flex flex-col">
                    <span className="font-bold text-base text-[var(--text-primary)]">
                        {item.name}
                    </span>
                    {item.notes && (
                        <span className="text-xs text-[var(--text-secondary)] italic mt-0.5 line-clamp-1">
                            {item.notes}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'category',
            header: 'Phân loại',
            width: 'w-36',
            render: (val, item) => {
                const cat = mergedCategories[item.category] || { label: item.category || 'Khác', color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' };
                return (
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border inline-block ${cat.color}`}>
                        {cat.label}
                    </span>
                );
            },
        },
        {
            key: 'quantity',
            header: 'Số lượng',
            align: 'center',
            width: 'w-28',
            render: (val, item) => (
                <span className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
                    {item.quantity || 1} <span className="text-xs text-[var(--text-secondary)] font-normal">{item.unit || 'Bộ'}</span>
                </span>
            ),
        },
        {
            key: 'assignedStation',
            header: 'Trạm sử dụng',
            render: (val, item) => {
                const st = stations.find((s) => s.id === item.assignedStation || s.name === item.assignedStation);
                const stationName = st ? st.name : item.assignedStation;
                return (
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
                        <IconLocation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate max-w-[160px]">{stationName || 'Chung / Toàn sự kiện'}</span>
                    </div>
                );
            },
        },
        {
            key: 'assigneeName',
            header: 'Người phụ trách',
            render: (val, item) => {
                return (
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[var(--text-primary)]">
                        <IconUser className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate max-w-[140px]">{item.assigneeName || 'Chưa phân công'}</span>
                    </div>
                );
            },
        },
        {
            key: 'condition',
            header: 'Tình trạng',
            align: 'center',
            width: 'w-32',
            render: (val, item) => {
                const cond = CONDITIONS.find((c) => c.value === item.condition) || CONDITIONS[0];
                return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cond.value === 'Tốt' ? 'bg-emerald-500' : (cond.value === 'Cần sạc pin' ? 'bg-amber-500' : (cond.value === 'Thiếu phụ kiện' ? 'bg-orange-500' : 'bg-rose-500'))}`} />
                        <span>{cond.label}</span>
                    </span>
                );
            },
        },
        ...(!readOnly ? [{
            key: 'actions',
            header: 'Thao tác',
            align: 'center',
            width: 'w-24',
            render: (val, item) => (
                <ActionMenu
                    items={[
                        {
                            label: 'Chỉnh sửa',
                            icon: IconEdit,
                            onClick: () => handleOpenEdit(item),
                        },
                        { divider: true },
                        {
                            label: 'Xóa thiết bị',
                            icon: IconTrash,
                            danger: true,
                            onClick: () => handleDeleteItem(item.id),
                        },
                    ]}
                />
            ),
        }] : []),
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Unified Toolbar Card */}
            <EventToolbar
                primaryActions={
                    readOnly ? (
                        <button
                            type="button"
                            onClick={handleExportCSV}
                            disabled={items.length === 0}
                            title="Xuất danh sách kiểm kê CSV"
                            className="px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                        >
                            <IconDownload className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                            <span>Xuất CSV</span>
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => setIsPresetModalOpen(true)}
                                title="Nạp nhanh từ danh mục mẫu có sẵn"
                                className="px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                <IconZap className="w-3.5 h-3.5 text-amber-500" />
                                <span>Dùng mẫu có sẵn</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingCatKey(null);
                                    setNewCategoryLabel('');
                                    setNewCategoryColor(CATEGORY_COLOR_PALETTES[0].color);
                                    setIsCategoryModalOpen(true);
                                }}
                                title="Quản lý và tạo thêm Tag phân loại thiết bị"
                                className="px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                <IconTag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Quản lý Tag</span>
                                {(event?.equipmentCategories?.length > 0) && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                        +{event.equipmentCategories.length}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsImportOpen(true)}
                                title="Nhập nhanh từ Excel hoặc mẫu"
                                className="px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                <IconUpload className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                <span>Nhập Excel</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleExportCSV}
                                disabled={items.length === 0}
                                title="Xuất danh sách kiểm kê CSV"
                                className="px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                            >
                                <IconDownload className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                <span>Xuất CSV</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleOpenAdd}
                                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all border-none cursor-pointer shadow-xs flex items-center gap-1.5"
                            >
                                <IconPlus className="w-3.5 h-3.5" />
                                <span>Thêm thiết bị</span>
                            </button>
                        </>
                    )
                }
                search={{
                    value: search,
                    onChange: (e) => setSearch(e.target.value),
                    placeholder: 'Tìm theo tên thiết bị, linh kiện, trạm, người phụ trách...',
                    onClear: () => setSearch(''),
                }}
                filters={
                    <>
                        {/* Category Filter */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="all">Tất cả phân loại ({items.length})</option>
                            {Object.entries(mergedCategories).map(([key, item]) => {
                                const count = items.filter((it) => it.category === key).length;
                                return (
                                    <option key={key} value={key}>
                                        {item.label} ({count})
                                    </option>
                                );
                            })}
                        </select>

                        {/* Status Filter */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="not_packed">Chưa đóng gói</option>
                            <option value="packed">Đã đóng gói (Đi)</option>
                            <option value="returned">Đã thu hồi (Về)</option>
                        </select>

                        {/* Station Filter */}
                        {stations.length > 0 && (
                            <select
                                value={selectedStation}
                                onChange={(e) => setSelectedStation(e.target.value)}
                                className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[200px]"
                            >
                                <option value="all">Tất cả trạm / khu vực</option>
                                {stations.map((st) => (
                                    <option key={st.id} value={st.name}>
                                        {st.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </>
                }
            />

            {/* Reusable Data Table */}
            <EventTable
                columns={columns}
                data={filteredItems}
                rowClassName={(item) =>
                    item.isPacked && !item.isReturned
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/10'
                        : item.isReturned
                        ? 'bg-indigo-50/30 dark:bg-indigo-950/10'
                        : ''
                }
                emptyState={{
                    icon: IconPackage,
                    title: 'Chưa có thiết bị / linh kiện nào trong danh sách',
                    description:
                        search || selectedCategory !== 'all' || selectedStatus !== 'all'
                            ? 'Không tìm thấy thiết bị phù hợp với bộ lọc hiện tại.'
                            : 'Hãy lập danh sách các mô hình robot, bộ kit, linh kiện, máy tính và đồ dùng cần mang theo cho sự kiện.',
                    action: (
                        <div className="flex items-center gap-2 flex-wrap justify-center">
                            <button
                                type="button"
                                onClick={() => setIsPresetModalOpen(true)}
                                className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 rounded-xl text-xs sm:text-sm font-semibold border border-amber-200 dark:border-amber-800 cursor-pointer transition-colors flex items-center gap-1.5"
                            >
                                <IconZap className="w-3.5 h-3.5" />
                                <span>Dùng mẫu có sẵn</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsImportOpen(true)}
                                className="px-4 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl text-xs sm:text-sm font-semibold border border-blue-200 dark:border-blue-800 cursor-pointer transition-colors flex items-center gap-1.5"
                            >
                                <IconUpload className="w-3.5 h-3.5" />
                                <span>Import Excel</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleOpenAdd}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-semibold cursor-pointer border-none shadow-xs flex items-center gap-1.5"
                            >
                                <IconPlus className="w-3.5 h-3.5" />
                                <span>Thêm thiết bị</span>
                            </button>
                        </div>
                    ),
                }}
            />

            {/* Modal: Add / Edit Equipment Item */}
            <EventModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editingItem ? 'Chỉnh sửa thiết bị mang theo' : 'Thêm thiết bị / linh kiện mang theo'}
                subtitle="Quản lý danh mục thiết bị, số lượng và thông tin phân công bàn giao"
                icon={IconPackage}
                maxWidth="max-w-lg"
                onSubmit={handleSaveForm}
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

            {/* Modal: Presets Selection */}
            <EventModal
                isOpen={isPresetModalOpen}
                onClose={() => setIsPresetModalOpen(false)}
                title="Chọn Mẫu Checklist Thiết Bị Chuẩn"
                subtitle="Nạp nhanh danh mục thiết bị, linh kiện và mô hình tiêu chuẩn vào sự kiện"
                icon={IconZap}
                maxWidth="max-w-md"
                cancelLabel="Đóng"
                submitLabel=""
            >
                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={() => handleImportPreset('robotic_competition')}
                        className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/40 hover:bg-[var(--bg-primary)] hover:border-blue-500/50 text-left transition-all cursor-pointer flex flex-col gap-1.5 group"
                    >
                        <div className="font-bold text-sm text-[var(--text-primary)] group-hover:text-blue-600 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span>Cuộc thi & Giải đấu Robotics</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            Bao gồm: Sa bàn thi đấu, Robot thi đấu, Pin 18650, Hộp dụng cụ tua vít, Laptop nạp code, Ổ cắm điện, Huy chương.
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleImportPreset('stem_workshop')}
                        className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/40 hover:bg-[var(--bg-primary)] hover:border-blue-500/50 text-left transition-all cursor-pointer flex flex-col gap-1.5 group"
                    >
                        <div className="font-bold text-sm text-[var(--text-primary)] group-hover:text-blue-600 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span>Ngày hội STEM & Workshop Trải nghiệm trường</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            Bao gồm: Bộ Kit lắp ráp, Máy tính bảng học sinh, Passport trải nghiệm, Robot trình diễn, Quà tặng & Sticker, Băng dính.
                        </p>
                    </button>
                </div>
            </EventModal>

            {/* Modal: Manage Custom Equipment Categories */}
            <EventModal
                isOpen={isCategoryModalOpen}
                onClose={() => {
                    setIsCategoryModalOpen(false);
                    setEditingCatKey(null);
                    setNewCategoryLabel('');
                }}
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
                                    const usageCount = items.filter((it) => it.category === cat.key).length;
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

            {/* Modal: Import Excel */}
            <ImportEquipmentModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                eventId={event?._id || event?.id}
                onImportSuccess={(importedList) => {
                    onUpdateChecklist?.(importedList);
                }}
            />
        </div>
    );
}
