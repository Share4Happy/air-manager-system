'use client';
import React, { useState, useEffect } from 'react';
import { TRANSACTION_TYPE_MAP } from './constants';
import {
    IconClose,
    IconPlus,
    IconMinus,
    IconAlertTriangle,
    IconArrowDownRight,
    IconArrowUpRight
} from './icons';

export default function StockTransactionModal({
    isOpen,
    onClose,
    component,
    defaultType = 'import',
    onSuccess
}) {
    const [type, setType] = useState(defaultType);
    const [quantity, setQuantity] = useState(1);
    const [reason, setReason] = useState('');
    const [className, setClassName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setType(defaultType);
        setQuantity(1);
        setReason('');
        setClassName('');
        setError('');
    }, [isOpen, defaultType, component]);

    if (!isOpen || !component) return null;

    const currentQty = component.quantity || 0;
    const unit = component.unit || 'Cái';

    // Calculate anticipated stock after transaction
    let anticipatedQty = currentQty;
    const numQty = Number(quantity) || 0;
    if (type === 'import') {
        anticipatedQty = currentQty + numQty;
    } else if (type === 'export' || type === 'damaged' || type === 'lost') {
        anticipatedQty = Math.max(0, currentQty - numQty);
    } else if (type === 'adjust') {
        anticipatedQty = numQty;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const num = Number(quantity);
        if (isNaN(num) || num <= 0) {
            setError('Số lượng phải lớn hơn 0.');
            return;
        }

        if ((type === 'export' || type === 'damaged' || type === 'lost') && num > currentQty) {
            setError(`Số lượng xuất (${num}) vượt quá tồn kho hiện tại (${currentQty} ${unit}).`);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/components/${component._id}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    quantity: num,
                    reason: reason.trim(),
                    className: className.trim()
                })
            });

            const data = await res.json();
            if (data.status) {
                onSuccess(data.data);
                onClose();
            } else {
                setError(data.mes || 'Không thể thực hiện giao dịch.');
            }
        } catch (err) {
            setError('Lỗi kết nối máy chủ.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[var(--main_d)] text-white flex items-center justify-center font-bold text-sm">
                            {type === 'import' ? <IconArrowDownRight className="w-4 h-4" /> : <IconArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                {type === 'import' ? 'Nhập kho linh kiện' : type === 'export' ? 'Xuất cấp phát linh kiện' : 'Điều chỉnh kho'}
                            </h2>
                            <p className="text-xs text-gray-500 font-medium truncate max-w-xs">
                                {component.name} ({component.code || 'Chưa có SKU'})
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer border-none bg-transparent"
                    >
                        <IconClose className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                            {error}
                        </div>
                    )}

                    {/* Transaction Type Picker */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Loại giao dịch
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setType('import')}
                                className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                    type === 'import'
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                📥 Nhập thêm
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('export')}
                                className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                    type === 'export'
                                        ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                📤 Cấp phát lớp
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('damaged')}
                                className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                    type === 'damaged'
                                        ? 'bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-500'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                ⚠️ Báo hỏng
                            </button>
                        </div>
                    </div>

                    {/* Stock comparison info card */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                        <div>
                            <span className="text-xs text-gray-500">Tồn hiện tại:</span>
                            <div className="font-bold text-gray-900 text-sm">
                                {currentQty} {unit}
                            </div>
                        </div>
                        <div className="text-gray-400 font-bold">➔</div>
                        <div className="text-right">
                            <span className="text-xs text-gray-500">Dự kiến sau giao dịch:</span>
                            <div className={`font-extrabold text-sm ${anticipatedQty <= (component.minQuantity || 5) ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {anticipatedQty} {unit}
                            </div>
                        </div>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Số lượng ({unit}) <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setQuantity((q) => Math.max(1, Number(q) - 1))}
                                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-100 cursor-pointer bg-white"
                            >
                                <IconMinus className="w-4 h-4" />
                            </button>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                required
                                className="flex-1 px-3 py-2 text-center text-lg font-bold bg-white border border-gray-200 rounded-xl focus:border-[var(--main_d)] outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setQuantity((q) => Number(q) + 1)}
                                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-100 cursor-pointer bg-white"
                            >
                                <IconPlus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Class / Event destination */}
                    {(type === 'export' || type === 'damaged') && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Lớp học / Sự kiện sử dụng
                            </label>
                            <input
                                type="text"
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                                placeholder="Vd: Lớp Robotic K24, Workshop Cuối tuần..."
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:border-[var(--main_d)] outline-none"
                            />
                        </div>
                    )}

                    {/* Reason / Note */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Lý do / Ghi chú
                        </label>
                        <textarea
                            rows={2}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ghi chú chi tiết cho lần xuất/nhập này..."
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:border-[var(--main_d)] outline-none resize-y"
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer border-none"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 bg-[var(--main_d)] hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer border-none shadow-sm flex items-center gap-2"
                        >
                            {loading && <span className="animate-spin text-xs">⏳</span>}
                            <span>Xác nhận</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
