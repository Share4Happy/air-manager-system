'use client';
import React from 'react';
import { CATEGORY_MAP, STATUS_MAP, formatCurrency } from './constants';
import {
    IconPen,
    IconTrash,
    IconPlus,
    IconMinus,
    IconHistory,
    IconLocation
} from './icons';

export default function ComponentTable({
    components,
    onEdit,
    onDelete,
    onQuickStock,
    onViewDetail
}) {
    if (!components || components.length === 0) {
        return null;
    }

    return (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                            <th className="py-3.5 px-4">Mã & Tên Linh Kiện</th>
                            <th className="py-3.5 px-3">Phân loại</th>
                            <th className="py-3.5 px-3">Vị trí lưu kho</th>
                            <th className="py-3.5 px-3 text-right">Đơn giá</th>
                            <th className="py-3.5 px-3 text-center">Tồn kho</th>
                            <th className="py-3.5 px-3 text-center">Trạng thái</th>
                            <th className="py-3.5 px-4 text-center">Thao tác kho</th>
                            <th className="py-3.5 px-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {components.map((item) => {
                            const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.khac;
                            const stat = STATUS_MAP[item.status] || STATUS_MAP.in_stock;
                            const isLowStock = item.quantity <= (item.minQuantity || 5) && item.quantity > 0;
                            const isOutOfStock = item.quantity === 0;

                            return (
                                <tr
                                    key={item._id}
                                    className="hover:bg-gray-50/70 transition-colors group"
                                >
                                    {/* Name & Code */}
                                    <td className="py-3.5 px-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                {item.code && (
                                                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 tracking-wider">
                                                        {item.code}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => onViewDetail(item)}
                                                    className="font-bold text-gray-900 hover:text-[var(--main_d)] text-left transition-colors cursor-pointer border-none bg-transparent p-0"
                                                >
                                                    {item.name}
                                                </button>
                                            </div>
                                            {item.description && (
                                                <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                    </td>

                                    {/* Category */}
                                    <td className="py-3.5 px-3 whitespace-nowrap">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${cat.color}`}>
                                            <span>{cat.icon}</span>
                                            <span>{cat.label}</span>
                                        </span>
                                    </td>

                                    {/* Location */}
                                    <td className="py-3.5 px-3 whitespace-nowrap">
                                        <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                                            <IconLocation className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <span>{item.location || '—'}</span>
                                        </div>
                                    </td>

                                    {/* Unit Price */}
                                    <td className="py-3.5 px-3 text-right whitespace-nowrap font-medium text-gray-700 text-xs">
                                        {item.unitPrice > 0 ? formatCurrency(item.unitPrice) : '—'}
                                    </td>

                                    {/* Current Quantity */}
                                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                        <div className="inline-flex flex-col items-center">
                                            <div className="flex items-baseline gap-1">
                                                <span className={`font-bold text-sm ${isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>
                                                    {item.quantity}
                                                </span>
                                                <span className="text-[11px] text-gray-400 font-normal">{item.unit || 'Cái'}</span>
                                            </div>
                                            <span className="text-[10px] text-gray-400">Min: {item.minQuantity || 5}</span>
                                        </div>
                                    </td>

                                    {/* Status Badge */}
                                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${stat.badge}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`} />
                                            <span>{stat.label}</span>
                                        </span>
                                    </td>

                                    {/* Quick Stock Actions */}
                                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                        <div className="inline-flex items-center gap-1">
                                            <button
                                                onClick={() => onQuickStock(item, 'import')}
                                                title="Nhập thêm"
                                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-xs font-semibold flex items-center gap-0.5 cursor-pointer border border-emerald-200 transition-colors"
                                            >
                                                <IconPlus className="w-3 h-3" />
                                                <span>Nhập</span>
                                            </button>
                                            <button
                                                onClick={() => onQuickStock(item, 'export')}
                                                disabled={item.quantity <= 0}
                                                title="Xuất kho"
                                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 disabled:opacity-40 rounded text-xs font-semibold flex items-center gap-0.5 cursor-pointer border border-blue-200 transition-colors"
                                            >
                                                <IconMinus className="w-3 h-3" />
                                                <span>Xuất</span>
                                            </button>
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => onViewDetail(item)}
                                                title="Lịch sử xuất nhập & Chi tiết"
                                                className="p-1.5 text-gray-500 hover:text-[var(--main_d)] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                                            >
                                                <IconHistory className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onEdit(item)}
                                                title="Sửa thông tin"
                                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                                            >
                                                <IconPen className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(item)}
                                                title="Xóa"
                                                className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                                            >
                                                <IconTrash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
