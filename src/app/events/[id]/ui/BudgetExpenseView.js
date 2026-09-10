'use client';
import React, { useState, useMemo } from 'react';
import { formatCurrencyVN } from '@/function';
import {
    IconDollar,
    IconPlus,
    IconEdit,
    IconTrash,
    IconCheck,
    IconUser,
} from '@/app/events/ui/icons';
import EventToolbar from '@/app/events/ui/common/EventToolbar';
import EventTable from '@/app/events/ui/common/EventTable';
import ActionMenu from '@/app/events/ui/common/ActionMenu';
import EventModal from '@/app/events/ui/common/EventModal';

const categoryLabels = {
    venue: { label: 'Địa điểm / Sân bãi', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40' },
    equipment: { label: 'Trang thiết bị & Robot', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40' },
    prizes: { label: 'Giải thưởng & Quà tặng', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40' },
    marketing: { label: 'Truyền thông & In ấn', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40' },
    catering: { label: 'Ăn uống & Teabreak', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40' },
    logistics: { label: 'Bồi dưỡng & Hậu cần', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40' },
    other: { label: 'Chi phí khác', color: 'bg-gray-50 text-gray-700 dark:bg-gray-800' },
};

export default function BudgetExpenseView({ budget = {}, onUpdateBudget, users = [], members = [], event = {}, readOnly = false }) {
    const items = budget.items || [];
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const [formItem, setFormItem] = useState({
        name: '',
        category: 'other',
        estimatedCost: '',
        actualCost: '',
        note: '',
        isPaid: false,
        paidBy: '',
        payerName: '',
    });

    const totalEstimated = items.reduce((sum, item) => sum + (Number(item.estimatedCost) || 0), 0);
    const totalActual = items.reduce((sum, item) => sum + (Number(item.actualCost) || 0), 0);
    const variance = totalEstimated - totalActual;
    const paidCount = items.filter((i) => i.isPaid).length;

    // Compute unified list of available payers
    const payerOptions = useMemo(() => {
        const list = [];
        const seen = new Set();

        // 1. Members in this event
        (members || []).forEach((m) => {
            const idStr = String(m.id || m._id);
            if (!seen.has(idStr)) {
                seen.add(idStr);
                const matchingUser = (users || []).find((u) => String(u._id) === idStr || String(u._id) === String(m.userId));
                list.push({
                    id: idStr,
                    name: m.name,
                    role: m.role || (matchingUser ? (Array.isArray(matchingUser.role) ? matchingUser.role.join(', ') : matchingUser.role) : 'Thành viên'),
                    organization: m.organization || 'AI Robotic',
                    isExternal: m.isExternal,
                });
            }
        });

        // 2. System Users
        (users || []).forEach((u) => {
            const idStr = String(u._id);
            if (!seen.has(idStr)) {
                seen.add(idStr);
                list.push({
                    id: idStr,
                    name: u.name,
                    role: Array.isArray(u.role) ? u.role.join(', ') : (u.role || 'Nhân sự'),
                    organization: 'AI Robotic',
                    isExternal: false,
                });
            }
        });

        // 3. Event Lead (if assigned)
        if (event?.lead) {
            const leadId = typeof event.lead === 'object' ? String(event.lead._id || event.lead.id) : String(event.lead);
            const leadObj = typeof event.lead === 'object' ? event.lead : (users || []).find((u) => String(u._id) === leadId);
            if (leadObj && !seen.has(leadId)) {
                seen.add(leadId);
                list.unshift({
                    id: leadId,
                    name: leadObj.name,
                    role: 'Trưởng ban tổ chức',
                    organization: 'AI Robotic',
                    isExternal: false,
                });
            }
        }

        return list;
    }, [members, users, event?.lead]);

    // Helper to get display info for payer in table
    const getPayerDisplay = (item) => {
        if (!item) return null;
        if (item.payerName && item.payerName.trim()) {
            const found = payerOptions.find((p) => p.id === item.paidBy || p.name.toLowerCase() === item.payerName.toLowerCase());
            return {
                name: item.payerName,
                role: found?.role || '',
                organization: found?.organization || '',
            };
        }
        if (item.paidBy) {
            const idStr = typeof item.paidBy === 'object' ? String(item.paidBy._id || item.paidBy.id) : String(item.paidBy);
            const found = payerOptions.find((p) => p.id === idStr);
            if (found) return found;
            return { name: idStr, role: '' };
        }
        return null;
    };

    const handleOpenAdd = () => {
        if (readOnly) return;
        setFormItem({
            name: '',
            category: 'other',
            estimatedCost: '',
            actualCost: '',
            note: '',
            isPaid: false,
            paidBy: '',
            payerName: '',
        });
        setIsAddModalOpen(true);
    };

    const handleOpenEdit = (item) => {
        if (readOnly) return;
        setEditingItem(item);
        const pDisplay = getPayerDisplay(item);
        setFormItem({
            name: item.name || '',
            category: item.category || 'other',
            estimatedCost: item.estimatedCost || '',
            actualCost: item.actualCost || '',
            note: item.note || '',
            isPaid: !!item.isPaid,
            paidBy: typeof item.paidBy === 'object' ? String(item.paidBy?._id || item.paidBy?.id || '') : (item.paidBy || ''),
            payerName: item.payerName || pDisplay?.name || '',
        });
    };

    const handleSaveAdd = (e) => {
        e.preventDefault();
        if (readOnly || !formItem.name.trim()) return;

        let resolvedPayerName = formItem.payerName.trim();
        if (formItem.paidBy && !resolvedPayerName) {
            const found = payerOptions.find((p) => p.id === formItem.paidBy);
            if (found) resolvedPayerName = found.name;
        }

        const newItem = {
            id: `budget-${Date.now()}`,
            name: formItem.name.trim(),
            category: formItem.category,
            estimatedCost: Number(formItem.estimatedCost) || 0,
            actualCost: Number(formItem.actualCost) || 0,
            note: formItem.note.trim(),
            isPaid: formItem.isPaid,
            paidBy: formItem.paidBy || null,
            payerName: resolvedPayerName,
        };

        onUpdateBudget?.({
            ...budget,
            items: [...items, newItem],
        });
        setIsAddModalOpen(false);
    };

    const handleSaveEdit = (e) => {
        e.preventDefault();
        if (readOnly || !editingItem || !formItem.name.trim()) return;

        let resolvedPayerName = formItem.payerName.trim();
        if (formItem.paidBy && !resolvedPayerName) {
            const found = payerOptions.find((p) => p.id === formItem.paidBy);
            if (found) resolvedPayerName = found.name;
        }

        const updatedItems = items.map((item) => {
            if (item.id === editingItem.id) {
                return {
                    ...item,
                    name: formItem.name.trim(),
                    category: formItem.category,
                    estimatedCost: Number(formItem.estimatedCost) || 0,
                    actualCost: Number(formItem.actualCost) || 0,
                    note: formItem.note.trim(),
                    isPaid: formItem.isPaid,
                    paidBy: formItem.paidBy || null,
                    payerName: resolvedPayerName,
                };
            }
            return item;
        });

        onUpdateBudget?.({
            ...budget,
            items: updatedItems,
        });
        setEditingItem(null);
    };

    const handleTogglePaid = (itemId) => {
        if (readOnly) return;
        const updatedItems = items.map((item) => {
            if (item.id === itemId) {
                return { ...item, isPaid: !item.isPaid };
            }
            return item;
        });
        onUpdateBudget?.({ ...budget, items: updatedItems });
    };

    const handleDeleteItem = (itemId) => {
        if (readOnly) return;
        if (!confirm('Bạn có chắc chắn muốn xóa khoản chi này?')) return;
        const updatedItems = items.filter((i) => i.id !== itemId);
        onUpdateBudget?.({ ...budget, items: updatedItems });
    };

    // Columns configuration for EventTable
    const columns = [
        {
            key: 'name',
            header: 'Tên hạng mục',
            cellClassName: 'font-bold text-[var(--text-primary)]',
        },
        {
            key: 'category',
            header: 'Danh mục',
            render: (val, item) => {
                const catCfg = categoryLabels[item.category] || categoryLabels.other;
                return (
                    <span className={`px-2.5 py-1 rounded-md text-xs sm:text-sm font-semibold ${catCfg.color}`}>
                        {catCfg.label}
                    </span>
                );
            },
        },
        {
            key: 'payer',
            header: 'Người chi',
            render: (val, item) => {
                const payerInfo = getPayerDisplay(item);
                if (!payerInfo) {
                    return <span className="text-[var(--text-secondary)] italic text-xs sm:text-sm">-</span>;
                }
                return (
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs shrink-0 border border-blue-200 dark:border-blue-900">
                            <IconUser className="w-3.5 h-3.5" />
                        </span>
                        <div className="flex flex-col">
                            <span className="font-semibold text-[var(--text-primary)] leading-tight text-sm sm:text-base">
                                {payerInfo.name}
                            </span>
                            {payerInfo.role && (
                                <span className="text-xs text-[var(--text-secondary)] leading-tight mt-0.5">
                                    {payerInfo.role}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'estimatedCost',
            header: 'Dự toán',
            align: 'right',
            cellClassName: 'font-medium text-[var(--text-primary)]',
            render: (val) => formatCurrencyVN(val),
        },
        {
            key: 'actualCost',
            header: 'Thực chi',
            align: 'right',
            cellClassName: 'font-bold text-blue-600 dark:text-blue-400',
            render: (val) => formatCurrencyVN(val),
        },
        {
            key: 'isPaid',
            header: 'Đã thanh toán',
            align: 'center',
            render: (val, item) => (
                readOnly ? (
                    <span
                        className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold border inline-flex items-center gap-1.5 ${
                            item.isPaid
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                    >
                        {item.isPaid ? (
                            <>
                                <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Đã chi</span>
                            </>
                        ) : (
                            <span>Chưa chi</span>
                        )}
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={() => handleTogglePaid(item.id)}
                        className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold border cursor-pointer transition-all inline-flex items-center gap-1.5 ${
                            item.isPaid
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                    >
                        {item.isPaid ? (
                            <>
                                <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Đã chi</span>
                            </>
                        ) : (
                            <span>Chưa chi</span>
                        )}
                    </button>
                )
            ),
        },
        {
            key: 'note',
            header: 'Ghi chú',
            cellClassName: 'text-[var(--text-secondary)] max-w-xs truncate text-sm',
            render: (val) => val || '-',
        },
        ...(!readOnly ? [{
            key: 'actions',
            header: 'Thao tác',
            align: 'right',
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
                            label: 'Xóa khoản chi',
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
                    !readOnly ? (
                        <button
                            type="button"
                            onClick={handleOpenAdd}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all border-none cursor-pointer shadow-xs flex items-center gap-1.5"
                        >
                            <IconPlus className="w-3.5 h-3.5" />
                            <span>Thêm mục chi</span>
                        </button>
                    ) : null
                }
            >
                {/* Summary Metrics Bar (3 Cards: Tổng Dự chi, Tổng Thực chi, Chênh lệch) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                    {/* 1. Tổng Dự chi */}
                    <div className="flex items-center justify-between sm:flex-col sm:items-start p-3.5 rounded-xl bg-[var(--bg-primary)] border border-blue-200/80 dark:border-blue-900/80">
                        <div>
                            <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-0.5">
                                Tổng Dự chi (Dự toán)
                            </span>
                            <span className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 block">
                                {formatCurrencyVN(totalEstimated)}
                            </span>
                        </div>
                        <span className="text-[11px] text-[var(--text-secondary)] font-medium mt-1">
                            {items.length} hạng mục dự chi
                        </span>
                    </div>

                    {/* 2. Tổng Thực chi */}
                    <div className="flex items-center justify-between sm:flex-col sm:items-start p-3.5 rounded-xl bg-[var(--bg-primary)] border border-purple-200/80 dark:border-purple-900/80">
                        <div>
                            <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-0.5">
                                Tổng Thực chi Phát sinh
                            </span>
                            <span className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400 block">
                                {formatCurrencyVN(totalActual)}
                            </span>
                        </div>
                        <span className="text-[11px] text-[var(--text-secondary)] font-medium mt-1">
                            Đã thanh toán: {paidCount}/{items.length} mục
                        </span>
                    </div>

                    {/* 3. Chênh lệch */}
                    <div
                        className={`flex items-center justify-between sm:flex-col sm:items-start p-3.5 rounded-xl bg-[var(--bg-primary)] border ${
                            variance >= 0
                                ? 'border-emerald-200/80 dark:border-emerald-900/80'
                                : 'border-rose-200/80 dark:border-rose-900/80'
                        }`}
                    >
                        <div>
                            <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-0.5">
                                Chênh lệch (Dự chi - Thực chi)
                            </span>
                            <span
                                className={`text-lg sm:text-xl font-bold block ${
                                    variance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                }`}
                            >
                                {variance >= 0 ? `+${formatCurrencyVN(variance)}` : `-${formatCurrencyVN(Math.abs(variance))}`}
                            </span>
                        </div>
                        <span className="text-[11px] text-[var(--text-secondary)] font-medium mt-1">
                            {variance >= 0 ? 'Tiết kiệm so với dự chi' : 'Vượt định mức dự chi'}
                        </span>
                    </div>
                </div>
            </EventToolbar>

            {/* Reusable Data Table */}
            <EventTable
                columns={columns}
                data={items}
                minWidth="min-w-[820px]"
                emptyState={{
                    icon: IconDollar,
                    title: 'Chưa có khoản chi nào được thêm',
                    description: readOnly ? 'Chưa có thông tin hạng mục chi phí.' : 'Nhấn "Thêm mục chi" để bắt đầu kê khai ngân sách.',
                    action: !readOnly ? (
                        <button
                            type="button"
                            onClick={handleOpenAdd}
                            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-sm cursor-pointer border-none shadow-xs flex items-center gap-1.5"
                        >
                            <IconPlus className="w-4 h-4" />
                            <span>Thêm mục chi</span>
                        </button>
                    ) : null,
                }}
                footer={
                    items.length > 0 ? (
                        <tr>
                            <td colSpan={3} className="py-3.5 px-4 text-[var(--text-primary)]">
                                Tổng cộng ({items.length} hạng mục)
                            </td>
                            <td className="py-3.5 px-3 text-right text-[var(--text-primary)]">
                                {formatCurrencyVN(totalEstimated)}
                            </td>
                            <td className="py-3.5 px-3 text-right text-blue-600 dark:text-blue-400">
                                {formatCurrencyVN(totalActual)}
                            </td>
                            <td className="py-3.5 px-3 text-center text-xs sm:text-sm text-[var(--text-secondary)]">
                                Đã chi: {paidCount}/{items.length}
                            </td>
                            <td colSpan={2} className="py-3.5 px-4 text-right text-xs sm:text-sm text-[var(--text-secondary)]">
                                Chênh lệch:{' '}
                                <span className={variance >= 0 ? 'text-emerald-600 font-bold text-sm sm:text-base' : 'text-rose-600 font-bold text-sm sm:text-base'}>
                                    {variance >= 0 ? `+${formatCurrencyVN(variance)}` : `-${formatCurrencyVN(Math.abs(variance))}`}
                                </span>
                            </td>
                        </tr>
                    ) : null
                }
            />

            {/* Add / Edit Expense Item Modal */}
            <EventModal
                isOpen={isAddModalOpen || !!editingItem}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingItem(null);
                }}
                title={editingItem ? 'Chỉnh sửa Mục chi phí' : 'Thêm Mục chi phí mới'}
                icon={IconDollar}
                maxWidth="max-w-lg"
                onSubmit={editingItem ? handleSaveEdit : handleSaveAdd}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                setIsAddModalOpen(false);
                                setEditingItem(null);
                            }}
                            className="px-4 py-2 rounded-xl text-sm sm:text-base font-semibold border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors bg-transparent cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 rounded-xl text-sm sm:text-base font-semibold bg-blue-600 text-white hover:bg-blue-700 border-none cursor-pointer shadow-xs transition-all"
                        >
                            Lưu mục chi
                        </button>
                    </>
                }
            >
                <div>
                    <label className="block text-sm sm:text-base font-semibold text-[var(--text-primary)] mb-1.5">
                        Tên khoản chi <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={formItem.name}
                        onChange={(e) => setFormItem({ ...formItem, name: e.target.value })}
                        placeholder="Ví dụ: Đặt cúp lưu niệm và huy chương..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                        <label className="block text-sm sm:text-base font-semibold text-[var(--text-primary)] mb-1.5">Danh mục chi</label>
                        <select
                            value={formItem.category}
                            onChange={(e) => setFormItem({ ...formItem, category: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="venue">Địa điểm / Sân bãi</option>
                            <option value="equipment">Trang thiết bị & Robot</option>
                            <option value="prizes">Giải thưởng & Quà tặng</option>
                            <option value="marketing">Truyền thông & In ấn</option>
                            <option value="catering">Ăn uống & Teabreak</option>
                            <option value="logistics">Bồi dưỡng & Hậu cần</option>
                            <option value="other">Chi phí khác</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm sm:text-base font-semibold text-[var(--text-primary)] mb-1.5">Người chi / Phụ trách</label>
                        <select
                            value={formItem.paidBy}
                            onChange={(e) => {
                                const selectedId = e.target.value;
                                const found = payerOptions.find((p) => p.id === selectedId);
                                setFormItem({
                                    ...formItem,
                                    paidBy: selectedId,
                                    payerName: found ? found.name : formItem.payerName,
                                });
                            }}
                            className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="">-- Chọn người chi --</option>
                            {payerOptions.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({p.role})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Optional Custom Payer Name if not in list */}
                <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[var(--text-secondary)] mb-1">Hoặc nhập tên người chi khác:</label>
                    <input
                        type="text"
                        value={formItem.payerName}
                        onChange={(e) => setFormItem({ ...formItem, payerName: e.target.value })}
                        placeholder="Họ và tên người thanh toán (nếu ngoài danh sách)"
                        className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                        <label className="block text-sm sm:text-base font-semibold text-[var(--text-primary)] mb-1.5">Dự toán (VNĐ)</label>
                        <input
                            type="number"
                            value={formItem.estimatedCost}
                            onChange={(e) => setFormItem({ ...formItem, estimatedCost: e.target.value })}
                            placeholder="0"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm sm:text-base font-semibold text-[var(--text-primary)] mb-1.5">Thực chi (VNĐ)</label>
                        <input
                            type="number"
                            value={formItem.actualCost}
                            onChange={(e) => setFormItem({ ...formItem, actualCost: e.target.value })}
                            placeholder="0"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm sm:text-base font-semibold text-[var(--text-primary)] mb-1.5">Ghi chú & Chi tiết</label>
                    <input
                        type="text"
                        value={formItem.note}
                        onChange={(e) => setFormItem({ ...formItem, note: e.target.value })}
                        placeholder="Số lượng, hóa đơn, đơn vị cung cấp..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <label className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-[var(--text-primary)] cursor-pointer pt-1">
                    <input
                        type="checkbox"
                        checked={formItem.isPaid}
                        onChange={(e) => setFormItem({ ...formItem, isPaid: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Đã hoàn tất thanh toán / chi tiền thực tế</span>
                </label>
            </EventModal>
        </div>
    );
}
