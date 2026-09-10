'use client';
import React from 'react';
import { CATEGORY_MAP, STATUS_MAP, formatCurrency } from './constants';
import {
    IconPen,
    IconTrash,
    IconPlus,
    IconMinus,
    IconLocation,
    IconExternalLink,
    IconHistory
} from './icons';

export default function ComponentCard({
    component,
    onEdit,
    onDelete,
    onQuickStock,
    onViewDetail
}) {
    const cat = CATEGORY_MAP[component.category] || CATEGORY_MAP.khac;
    const stat = STATUS_MAP[component.status] || STATUS_MAP.in_stock;

    const isLowStock = component.quantity <= (component.minQuantity || 5) && component.quantity > 0;
    const isOutOfStock = component.quantity === 0;

    // Stock progress indicator
    const targetStock = Math.max(component.minQuantity * 2, 20);
    const stockPercent = Math.min(100, Math.round((component.quantity / targetStock) * 100));

    return (
        <div className="flex flex-col bg-white border border-gray-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 group relative">
            {/* Header: Code + Category Pill + Status */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                    {component.code && (
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 tracking-wider">
                            {component.code}
                        </span>
                    )}
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${cat.color}`}>
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                    </span>
                </div>

                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${stat.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`} />
                    <span>{stat.label}</span>
                </span>
            </div>

            {/* Title & Description */}
            <div className="cursor-pointer mb-2" onClick={() => onViewDetail(component)}>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-[var(--main_d)] transition-colors line-clamp-2 leading-snug">
                    {component.name}
                </h3>
                {component.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 whitespace-pre-line">
                        {component.description}
                    </p>
                )}
            </div>

            {/* Location & Unit Price */}
            <div className="flex items-center justify-between gap-2 text-xs text-gray-600 mb-3 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1 min-w-0 text-gray-500">
                    <IconLocation className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                    <span className="truncate font-medium">{component.location || 'Chưa xếp vị trí'}</span>
                </div>
                {component.unitPrice > 0 && (
                    <div className="shrink-0 font-semibold text-gray-800">
                        {formatCurrency(component.unitPrice)}
                    </div>
                )}
            </div>

            {/* Stock Level Display & Progress */}
            <div className="bg-gray-50/80 rounded-xl p-3 mb-3 border border-gray-100">
                <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xs text-gray-500 font-medium">Tồn kho hiện tại:</span>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-extrabold ${isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>
                            {component.quantity}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">{component.unit || 'Cái'}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${
                            isOutOfStock
                                ? 'bg-rose-500'
                                : isLowStock
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(5, stockPercent)}%` }}
                    />
                </div>

                <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1">
                    <span>Tối thiểu: {component.minQuantity || 5} {component.unit}</span>
                    {isLowStock && <span className="text-amber-600 font-semibold">⚠️ Cần nhập thêm</span>}
                    {isOutOfStock && <span className="text-rose-600 font-semibold">🚫 Hết hàng</span>}
                </div>
            </div>

            {/* Actions Bar */}
            <div className="mt-auto flex items-center justify-between gap-1.5 pt-2 border-t border-gray-100">
                {/* Quick Stock In / Out Buttons */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onQuickStock(component, 'import')}
                        title="Nhập thêm vào kho"
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-emerald-200"
                    >
                        <IconPlus className="w-3.5 h-3.5" />
                        <span>Nhập</span>
                    </button>
                    <button
                        onClick={() => onQuickStock(component, 'export')}
                        disabled={component.quantity <= 0}
                        title="Xuất kho cấp phát"
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 disabled:opacity-40 disabled:hover:bg-blue-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-blue-200"
                    >
                        <IconMinus className="w-3.5 h-3.5" />
                        <span>Xuất</span>
                    </button>
                </div>

                {/* Other Actions: Detail / Edit / Delete */}
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={() => onViewDetail(component)}
                        title="Xem chi tiết & Lịch sử"
                        className="p-1.5 text-gray-500 hover:text-[var(--main_d)] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                    >
                        <IconHistory className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onEdit(component)}
                        title="Chỉnh sửa thông tin"
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                    >
                        <IconPen className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(component)}
                        title="Xóa linh kiện"
                        className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                    >
                        <IconTrash className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
