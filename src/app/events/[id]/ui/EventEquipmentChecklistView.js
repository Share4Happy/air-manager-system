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
} from '@/app/events/ui/icons';
import EventToolbar from '@/app/events/ui/common/EventToolbar';
import EventTable from '@/app/events/ui/common/EventTable';
import ActionMenu from '@/app/events/ui/common/ActionMenu';
import EventModal from '@/app/events/ui/common/EventModal';
import ImportEquipmentModal from './ImportEquipmentModal';

const EQUIPMENT_CATEGORIES = {
    robot_model: { label: 'Mô hình Robot', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' },
    kit: { label: 'Bộ Kit học tập', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
    electronics: { label: 'Linh kiện & Pin', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
    laptop_screen: { label: 'Laptop & Thiết bị số', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800' },
    tools: { label: 'Dụng cụ & Kỹ thuật', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800' },
    banner_props: { label: 'Sa bàn, Backdrop & Quà', color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800' },
    other: { label: 'Khác', color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' },
};

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
    users = [],
    members = [],
}) {
    const items = useMemo(() => checklist || [], [checklist]);
    const stations = useMemo(() => event?.stations || [], [event]);

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
        const headers = ['Tên thiết bị/linh kiện', 'Phân loại', 'Số lượng', 'Đơn vị', 'Trạm phụ trách', 'Người phụ trách', 'Đã đóng gói (Đi)', 'Đã thu hồi (Về)', 'Tình trạng', 'Ghi chú'];
        const rows = items.map((it) => [
            `"${it.name.replace(/"/g, '""')}"`,
            `"${EQUIPMENT_CATEGORIES[it.category]?.label || it.category}"`,
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
            key: 'isPacked',
            header: 'Mang đi',
            align: 'center',
            width: 'w-16',
            render: (val, item) => (
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
            ),
        },
        {
            key: 'isReturned',
            header: 'Mang về',
            align: 'center',
            width: 'w-16',
            render: (val, item) => (
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
            ),
        },
        {
            key: 'name',
            header: 'Tên Thiết Bị / Linh Kiện',
            render: (val, item) => (
                <div className="flex flex-col">
                    <span className={`font-bold text-sm sm:text-base text-[var(--text-primary)] ${item.isPacked ? 'text-gray-900 dark:text-white' : ''}`}>
                        {item.name}
                    </span>
                    {item.notes && (
                        <span className="text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                            {item.notes}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'category',
            header: 'Phân loại',
            cellClassName: 'whitespace-nowrap',
            render: (val, item) => {
                const cat = EQUIPMENT_CATEGORIES[item.category] || EQUIPMENT_CATEGORIES.other;
                return (
                    <span className={`text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-full border inline-block ${cat.color}`}>
                        {cat.label}
                    </span>
                );
            },
        },
        {
            key: 'quantity',
            header: 'Số lượng',
            align: 'center',
            cellClassName: 'whitespace-nowrap',
            render: (val, item) => (
                <>
                    <span className="font-extrabold text-sm sm:text-base text-[var(--text-primary)]">
                        {item.quantity || 1}
                    </span>{' '}
                    <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
                        {item.unit || 'Bộ'}
                    </span>
                </>
            ),
        },
        {
            key: 'assignedStation',
            header: 'Trạm / Khu vực',
            cellClassName: 'whitespace-nowrap',
            render: (val, item) => (
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--text-primary)] font-medium">
                    <IconLocation className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{item.assignedStation || 'Chưa phân trạm'}</span>
                </div>
            ),
        },
        {
            key: 'assigneeName',
            header: 'Phụ trách',
            cellClassName: 'whitespace-nowrap',
            render: (val, item) => (
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--text-primary)] font-medium">
                    <IconUser className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{item.assigneeName || '—'}</span>
                </div>
            ),
        },
        {
            key: 'condition',
            header: 'Tình trạng',
            align: 'center',
            cellClassName: 'whitespace-nowrap',
            render: (val, item) => {
                const cond = CONDITIONS.find((c) => c.value === item.condition) || CONDITIONS[0];
                return (
                    <span className={`text-xs sm:text-sm font-semibold px-2.5 py-0.5 rounded-full border inline-block ${cond.color}`}>
                        {cond.label}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: 'Thao tác',
            align: 'center',
            width: 'w-14',
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
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Unified Toolbar Card */}
            <EventToolbar
                primaryActions={
                    <>
                        {items.length === 0 && (
                            <button
                                type="button"
                                onClick={() => setIsPresetModalOpen(true)}
                                className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                                title="Nạp nhanh danh sách thiết bị mẫu"
                            >
                                <IconZap className="w-3.5 h-3.5 text-amber-500" />
                                <span>Nạp Mẫu Có Sẵn</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => setIsImportOpen(true)}
                            title="Nhập danh sách thiết bị từ file Excel/CSV"
                            className="px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <IconUpload className="w-3.5 h-3.5" />
                            <span>Import Excel</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleExportCSV}
                            disabled={items.length === 0}
                            title="Xuất danh sách kiểm kê CSV"
                            className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                        >
                            <IconDownload className="w-3.5 h-3.5" />
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
                            {Object.entries(EQUIPMENT_CATEGORIES).map(([key, item]) => {
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
                secondaryActions={
                    items.length > 0 && (
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => handleBatchPackAll(true)}
                                title="Đánh dấu tất cả đã đóng gói sẵn sàng"
                                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs sm:text-sm font-semibold rounded-xl border border-emerald-200 cursor-pointer transition-colors"
                            >
                                ✓ Gói hết
                            </button>
                            <button
                                type="button"
                                onClick={() => handleBatchReturnAll(true)}
                                title="Đánh dấu tất cả đã thu hồi về kho"
                                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-semibold rounded-xl border border-indigo-200 cursor-pointer transition-colors"
                            >
                                ✓ Thu hồi hết
                            </button>
                        </div>
                    )
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
                icon={IconPackage}
                maxWidth="max-w-lg"
                onSubmit={handleSaveForm}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm font-semibold transition-colors cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all cursor-pointer border-none shadow-xs"
                        >
                            {editingItem ? 'Cập nhật' : 'Thêm vào danh sách'}
                        </button>
                    </>
                }
            >
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
                        className="w-full px-3.5 py-2.5 text-sm sm:text-base bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:border-blue-500 outline-none text-[var(--text-primary)]"
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
                            className="w-full px-3.5 py-2.5 text-sm sm:text-base bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:border-blue-500 outline-none text-[var(--text-primary)]"
                        >
                            {Object.entries(EQUIPMENT_CATEGORIES).map(([key, item]) => (
                                <option key={key} value={key}>
                                    {item.label}
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
                            className="w-full px-3.5 py-2.5 text-sm sm:text-base bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:border-blue-500 outline-none text-[var(--text-primary)]"
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
                            Số lượng mang theo
                        </label>
                        <input
                            type="number"
                            min="1"
                            required
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            className="w-full px-3.5 py-2.5 text-sm sm:text-base bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:border-blue-500 outline-none text-[var(--text-primary)] font-bold"
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
                            className="w-full px-3.5 py-2.5 text-sm sm:text-base bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:border-blue-500 outline-none text-[var(--text-primary)]"
                        />
                    </div>
                </div>

                {/* Assigned Station & Assignee */}
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
                            className="w-full px-3.5 py-2.5 text-sm sm:text-base bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:border-blue-500 outline-none text-[var(--text-primary)]"
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
                            className="w-full px-3.5 py-2.5 text-sm sm:text-base bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:border-blue-500 outline-none text-[var(--text-primary)]"
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
                        className="w-full px-3.5 py-2.5 text-sm sm:text-base bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:border-blue-500 outline-none resize-y text-[var(--text-primary)]"
                    />
                </div>
            </EventModal>

            {/* Modal: Presets Selection */}
            <EventModal
                isOpen={isPresetModalOpen}
                onClose={() => setIsPresetModalOpen(false)}
                title="Chọn Mẫu Checklist Thiết Bị Sẵn Có"
                subtitle="Hệ thống sẽ nạp danh sách các thiết bị, mô hình và dụng cụ tiêu chuẩn:"
                icon={IconZap}
                maxWidth="max-w-md"
                footer={
                    <button
                        type="button"
                        onClick={() => setIsPresetModalOpen(false)}
                        className="px-4 py-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm font-semibold border border-[var(--border-color)] cursor-pointer"
                    >
                        Đóng
                    </button>
                }
            >
                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={() => handleImportPreset('robotic_competition')}
                        className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100/80 dark:hover:bg-blue-900/60 text-left transition-all cursor-pointer flex flex-col gap-1"
                    >
                        <div className="font-bold text-sm sm:text-base text-blue-900 dark:text-blue-200 flex items-center gap-2">
                            <span>Cuộc thi & Giải đấu Robotics</span>
                        </div>
                        <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                            Bao gồm: Sa bàn thi đấu, Robot thi đấu, Pin 18650, Hộp dụng cụ tua vít, Laptop nạp code, Ổ cắm điện, Huy chương.
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleImportPreset('stem_workshop')}
                        className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/40 hover:bg-amber-100/80 dark:hover:bg-amber-900/60 text-left transition-all cursor-pointer flex flex-col gap-1"
                    >
                        <div className="font-bold text-sm sm:text-base text-amber-900 dark:text-amber-200 flex items-center gap-2">
                            <span>Ngày hội STEM & Workshop Trải nghiệm trường</span>
                        </div>
                        <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
                            Bao gồm: Bộ Kit lắp ráp, Máy tính bảng học sinh, Passport trải nghiệm, Robot trình diễn, Quà tặng & Sticker, Băng dính.
                        </p>
                    </button>
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
