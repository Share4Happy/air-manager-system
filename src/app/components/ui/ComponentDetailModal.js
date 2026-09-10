'use client';
import React, { useState } from 'react';
import {
    CATEGORY_MAP,
    STATUS_MAP,
    TRANSACTION_TYPE_MAP,
    formatCurrency,
    formatDate
} from './constants';
import {
    IconClose,
    IconLocation,
    IconExternalLink,
    IconHistory,
    IconPlus,
    IconMinus,
    IconPen
} from './icons';

export default function ComponentDetailModal({
    isOpen,
    onClose,
    component,
    onEdit,
    onQuickStock
}) {
    const [filterType, setFilterType] = useState('all');

    if (!isOpen || !component) return null;

    const cat = CATEGORY_MAP[component.category] || CATEGORY_MAP.khac;
    const stat = STATUS_MAP[component.status] || STATUS_MAP.in_stock;
    const history = component.history || [];

    const filteredHistory = history.filter((h) => {
        if (filterType === 'all') return true;
        return h.type === filterType;
    });

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl shadow-inner">
                            {cat.icon}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                {component.code && (
                                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-800 tracking-wider">
                                        {component.code}
                                    </span>
                                )}
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cat.color}`}>
                                    {cat.label}
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 mt-0.5">
                                {component.name}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => {
                                onClose();
                                onEdit(component);
                            }}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border-none"
                        >
                            <IconPen className="w-3.5 h-3.5" />
                            <span>Chỉnh sửa</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer border-none bg-transparent"
                        >
                            <IconClose className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto flex flex-col gap-6">
                    {/* Top Overview Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <span className="text-xs text-gray-500 font-medium">Tồn kho hiện tại</span>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-2xl font-extrabold text-gray-900">
                                    {component.quantity}
                                </span>
                                <span className="text-xs text-gray-500">{component.unit || 'Cái'}</span>
                            </div>
                            <span className="text-[10px] text-gray-400">Định mức min: {component.minQuantity || 5}</span>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <span className="text-xs text-gray-500 font-medium">Vị trí lưu kho</span>
                            <div className="flex items-center gap-1.5 mt-1">
                                <IconLocation className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="font-bold text-gray-800 text-sm truncate">
                                    {component.location || 'Chưa phân vị trí'}
                                </span>
                            </div>
                            <span className="text-[10px] text-gray-400">Kệ / Tủ / Lab</span>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <span className="text-xs text-gray-500 font-medium">Đơn giá mua</span>
                            <div className="font-extrabold text-gray-900 text-sm mt-1">
                                {component.unitPrice > 0 ? formatCurrency(component.unitPrice) : '—'}
                            </div>
                            <span className="text-[10px] text-gray-400">Tổng giá trị: {formatCurrency(component.quantity * (component.unitPrice || 0))}</span>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <span className="text-xs text-gray-500 font-medium">Trạng thái</span>
                            <div className="mt-1">
                                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${stat.badge}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`} />
                                    <span>{stat.label}</span>
                                </span>
                            </div>
                            <span className="text-[10px] text-gray-400">Cập nhật: {formatDate(component.updatedAt)}</span>
                        </div>
                    </div>

                    {/* Quick Stock Action Bar inside Detail */}
                    <div className="flex items-center justify-between bg-blue-50/50 border border-blue-100 rounded-xl p-3.5">
                        <div>
                            <p className="text-xs font-bold text-blue-950">Thao tác kho nhanh</p>
                            <p className="text-[11px] text-blue-700">Ghi nhận xuất cấp phát cho lớp hoặc nhập thêm số lượng</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    onClose();
                                    onQuickStock(component, 'import');
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer border-none shadow-sm transition-colors"
                            >
                                <IconPlus className="w-3.5 h-3.5" />
                                <span>Nhập kho</span>
                            </button>
                            <button
                                onClick={() => {
                                    onClose();
                                    onQuickStock(component, 'export');
                                }}
                                disabled={component.quantity <= 0}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer border-none shadow-sm transition-colors"
                            >
                                <IconMinus className="w-3.5 h-3.5" />
                                <span>Xuất cấp phát</span>
                            </button>
                        </div>
                    </div>

                    {/* Specs / Description / Links */}
                    {(component.description || component.datasheetUrl || component.supplier || (component.tags && component.tags.length > 0)) && (
                        <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-200/80 flex flex-col gap-3">
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Thông tin kỹ thuật & Hướng dẫn
                            </h4>

                            {component.description && (
                                <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                                    {component.description}
                                </p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 pt-1">
                                {component.supplier && (
                                    <div>
                                        <span className="text-gray-400">Nhà cung cấp: </span>
                                        <span className="font-semibold text-gray-800">{component.supplier}</span>
                                    </div>
                                )}
                                {component.datasheetUrl && (
                                    <a
                                        href={component.datasheetUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                                    >
                                        <IconExternalLink className="w-3.5 h-3.5" />
                                        <span>Xem Tài liệu / Datasheet</span>
                                    </a>
                                )}
                            </div>

                            {component.tags && component.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {component.tags.map((tag, i) => (
                                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600 font-medium">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Transaction History Timeline */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <IconHistory className="w-4 h-4 text-gray-500" />
                                <h3 className="text-sm font-bold text-gray-900">
                                    Lịch sử xuất / nhập kho ({history.length})
                                </h3>
                            </div>

                            {/* Filter by transaction type */}
                            <div className="flex items-center gap-1">
                                {['all', 'import', 'export', 'damaged'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setFilterType(t)}
                                        className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer border-none ${
                                            filterType === t
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {t === 'all'
                                            ? 'Tất cả'
                                            : t === 'import'
                                            ? 'Nhập'
                                            : t === 'export'
                                            ? 'Xuất'
                                            : 'Hỏng/Mất'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredHistory.length === 0 ? (
                            <div className="p-8 bg-gray-50 rounded-xl text-center text-xs text-gray-400 italic">
                                Chưa có lịch sử giao dịch nào được ghi nhận.
                            </div>
                        ) : (
                            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white">
                                {filteredHistory.map((item, idx) => {
                                    const typeInfo = TRANSACTION_TYPE_MAP[item.type] || TRANSACTION_TYPE_MAP.import;
                                    return (
                                        <div key={item._id || idx} className="p-3 hover:bg-gray-50/70 transition-colors flex items-start justify-between gap-3 text-xs">
                                            <div className="flex items-start gap-2.5">
                                                <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] border shrink-0 ${typeInfo.color}`}>
                                                    {typeInfo.label}
                                                </span>
                                                <div>
                                                    <div className="font-semibold text-gray-900">
                                                        {item.reason || (item.type === 'import' ? 'Nhập kho' : 'Xuất kho')}
                                                        {item.className && (
                                                            <span className="ml-1 text-blue-600 font-normal">
                                                                (Dùng cho: {item.className})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 mt-0.5">
                                                        Người thực hiện: <span className="text-gray-600 font-medium">{item.creatorName || 'Hệ thống'}</span> • {formatDate(item.createdAt)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <div className={`font-extrabold text-sm ${item.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {item.quantityChange > 0 ? `+${item.quantityChange}` : item.quantityChange} {component.unit || 'Cái'}
                                                </div>
                                                <div className="text-[10px] text-gray-400">
                                                    Còn lại: {item.quantityAfter} {component.unit}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-100 flex justify-end bg-gray-50/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer border-none"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
