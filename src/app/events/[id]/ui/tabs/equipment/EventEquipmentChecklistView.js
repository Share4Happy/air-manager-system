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
    IconTag,
} from '@/app/events/ui/icons';

import EventToolbar from '@/app/events/ui/common/EventToolbar';
import EventTable from '@/app/events/ui/common/EventTable';
import ActionMenu from '@/app/events/ui/common/ActionMenu';
import { useEventDialog } from '@/app/events/ui/common';

import {
    DEFAULT_EQUIPMENT_CATEGORIES,
    CATEGORY_COLOR_PALETTES,
    CONDITIONS,
} from './equipmentConstants';
import AddEditEquipmentModal from './AddEditEquipmentModal';
import ManageEquipmentCategoriesModal from './ManageEquipmentCategoriesModal';
import ImportEquipmentModal from './ImportEquipmentModal';

export default function EventEquipmentChecklistView({
    event,
    checklist = [],
    onUpdateChecklist,
    onUpdateMultiple,
    users = [],
    members = [],
    readOnly = false,
}) {
    const dialog = useEventDialog();
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
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

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
    const handleDeleteItem = async (itemId) => {
        const ok = await dialog.confirm('Bạn có chắc chắn muốn xóa thiết bị này khỏi danh sách mang theo?', {
            title: 'Xóa thiết bị',
            type: 'danger',
            confirmText: 'Xóa thiết bị',
        });
        if (!ok) return;
        const updated = items.filter((it) => it.id !== itemId);
        saveChecklist(updated);
        dialog.toast('Đã xóa thiết bị khỏi danh sách', 'info');
    };

    // Open Add / Edit Modal
    const handleOpenAdd = () => {
        setEditingItem(null);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    // Submit Form
    const handleSaveEquipment = (formData) => {
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
                                : 'bg-[var(--bg-primary)] border-[var(--border-color)]'
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
                                : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-emerald-500'
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
                                : 'bg-[var(--bg-primary)] border-[var(--border-color)]'
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
                                : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-indigo-500'
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
                <span className="font-bold text-base text-[var(--text-primary)]">
                    {item.name}
                </span>
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
                        <IconLocation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
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
                        <IconUser className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
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
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-primary)]">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cond.value === 'Tốt' ? 'bg-emerald-500' : (cond.value === 'Cần sạc pin' ? 'bg-amber-500' : (cond.value === 'Thiếu phụ kiện' ? 'bg-orange-500' : 'bg-rose-500'))}`} />
                        <span>{cond.label}</span>
                    </span>
                );
            },
        },
        {
            key: 'notes',
            header: 'Ghi chú',
            render: (val, item) => (
                <span className="text-xs sm:text-sm text-[var(--text-secondary)] italic line-clamp-2" title={item.notes || ''}>
                    {item.notes || '-'}
                </span>
            ),
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
                                onClick={() => setIsCategoryModalOpen(true)}
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
                                title="Nhập nhanh từ Excel"
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
                    placeholder: 'Tìm theo tên thiết bị, linh kiện, trạm, người phụ trách, ghi chú...',
                    onClear: () => setSearch(''),
                }}
                filters={
                    <>
                        {/* Category Filter */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer [&>option]:bg-[var(--bg-primary)] [&>option]:text-[var(--text-primary)]"
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
                            className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer [&>option]:bg-[var(--bg-primary)] [&>option]:text-[var(--text-primary)]"
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
                                className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[200px] [&>option]:bg-[var(--bg-primary)] [&>option]:text-[var(--text-primary)]"
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
                minWidth="min-w-[1000px]"
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
            <AddEditEquipmentModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                editingItem={editingItem}
                onSave={handleSaveEquipment}
                mergedCategories={mergedCategories}
                stations={stations}
                users={users}
                members={members}
            />

            {/* Modal: Manage Custom Equipment Categories */}
            <ManageEquipmentCategoriesModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                event={event}
                checklist={items}
                onUpdateMultiple={onUpdateMultiple}
                readOnly={readOnly}
            />

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
