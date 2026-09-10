'use client';
import React, { useState, useEffect } from 'react';
import { CATEGORY_MAP } from './constants';
import { IconClose, IconPlus, IconPen } from './icons';

const UNITS = ['Cái', 'Con', 'Chiếc', 'Bộ', 'Gói', 'Mét', 'Cặp', 'Hộp', 'Cuộn'];

export default function ComponentFormModal({
    isOpen,
    onClose,
    onSuccess,
    initialData = null
}) {
    const isEdit = Boolean(initialData?._id);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        category: 'vi_dieu_khien',
        quantity: 0,
        minQuantity: 5,
        unit: 'Cái',
        location: '',
        unitPrice: '',
        supplier: '',
        datasheetUrl: '',
        imageUrl: '',
        description: '',
        tags: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                code: initialData.code || '',
                category: initialData.category || 'vi_dieu_khien',
                quantity: initialData.quantity !== undefined ? initialData.quantity : 0,
                minQuantity: initialData.minQuantity !== undefined ? initialData.minQuantity : 5,
                unit: initialData.unit || 'Cái',
                location: initialData.location || '',
                unitPrice: initialData.unitPrice || '',
                supplier: initialData.supplier || '',
                datasheetUrl: initialData.datasheetUrl || '',
                imageUrl: initialData.imageUrl || '',
                description: initialData.description || '',
                tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : ''
            });
        } else {
            setFormData({
                name: '',
                code: '',
                category: 'vi_dieu_khien',
                quantity: 0,
                minQuantity: 5,
                unit: 'Cái',
                location: '',
                unitPrice: '',
                supplier: '',
                datasheetUrl: '',
                imageUrl: '',
                description: '',
                tags: ''
            });
        }
        setError('');
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAutoGenerateCode = () => {
        const prefixMap = {
            vi_dieu_khien: 'MCU',
            cam_bien: 'SEN',
            dong_co: 'MOT',
            module: 'MOD',
            nguon_pin: 'PWR',
            khung_co_khi: 'MEC',
            day_noi: 'WIR',
            dung_cu: 'TLS',
            khac: 'OTH'
        };
        const prefix = prefixMap[formData.category] || 'LK';
        const randomNum = Math.floor(100 + Math.random() * 900);
        setFormData((prev) => ({ ...prev, code: `LK-${prefix}-${randomNum}` }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Vui lòng nhập tên linh kiện.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const tagsArray = formData.tags
                ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
                : [];

            const payload = {
                ...formData,
                name: formData.name.trim(),
                code: formData.code.trim(),
                quantity: Number(formData.quantity) || 0,
                minQuantity: Number(formData.minQuantity) || 0,
                unitPrice: Number(formData.unitPrice) || 0,
                tags: tagsArray
            };

            const url = isEdit ? `/api/components/${initialData._id}` : '/api/components';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.status) {
                onSuccess(data.data);
                onClose();
            } else {
                setError(data.mes || 'Không thể lưu linh kiện.');
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
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[var(--main_d)] text-white flex items-center justify-center font-bold text-sm">
                            {isEdit ? <IconPen className="w-4 h-4" /> : <IconPlus className="w-4 h-4" />}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                {isEdit ? 'Chỉnh sửa thông tin linh kiện' : 'Thêm mới linh kiện vào kho'}
                            </h2>
                            <p className="text-xs text-gray-500">
                                {isEdit ? 'Cập nhật thông số kỹ thuật & quy cách' : 'Điền đầy đủ thông tin để theo dõi định mức tồn kho'}
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

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-4">
                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                            {error}
                        </div>
                    )}

                    {/* Category & SKU Code */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Danh mục linh kiện <span className="text-rose-500">*</span>
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:border-[var(--main_d)] focus:ring-1 focus:ring-[var(--main_d)] outline-none"
                            >
                                {Object.entries(CATEGORY_MAP).map(([key, item]) => (
                                    <option key={key} value={key}>
                                        {item.icon} {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-semibold text-gray-700">
                                    Mã linh kiện / SKU
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAutoGenerateCode}
                                    className="text-[11px] text-[var(--main_d)] hover:underline cursor-pointer border-none bg-transparent p-0 font-medium"
                                >
                                    Tạo tự động
                                </button>
                            </div>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                placeholder="Vd: LK-SRV-01, LK-ESP-02"
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:border-[var(--main_d)] focus:ring-1 focus:ring-[var(--main_d)] outline-none font-mono"
                            />
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Tên linh kiện <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Vd: Động cơ Servo SG90 9g, Cảm biến siêu âm HC-SR04..."
                            required
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:border-[var(--main_d)] focus:ring-1 focus:ring-[var(--main_d)] outline-none"
                        />
                    </div>

                    {/* Quantity, Min Quantity, Unit, Location */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {!isEdit && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Số lượng ban đầu
                                </label>
                                <input
                                    type="number"
                                    name="quantity"
                                    min="0"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:border-[var(--main_d)] outline-none font-semibold text-gray-900"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Cảnh báo tồn min
                            </label>
                            <input
                                type="number"
                                name="minQuantity"
                                min="0"
                                value={formData.minQuantity}
                                onChange={handleChange}
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:border-[var(--main_d)] outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Đơn vị tính
                            </label>
                            <input
                                type="text"
                                name="unit"
                                list="unit-list"
                                value={formData.unit}
                                onChange={handleChange}
                                placeholder="Cái"
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:border-[var(--main_d)] outline-none"
                            />
                            <datalist id="unit-list">
                                {UNITS.map((u) => (
                                    <option key={u} value={u} />
                                ))}
                            </datalist>
                        </div>

                        <div className={isEdit ? 'col-span-2' : ''}>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Vị trí lưu kho
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="Kệ A - Hộc 2"
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:border-[var(--main_d)] outline-none"
                            />
                        </div>
                    </div>

                    {/* Unit Price & Supplier */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Đơn giá mua ước tính (VNĐ)
                            </label>
                            <input
                                type="number"
                                name="unitPrice"
                                min="0"
                                step="1000"
                                value={formData.unitPrice}
                                onChange={handleChange}
                                placeholder="Vd: 35000"
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:border-[var(--main_d)] outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Nhà cung cấp / Nguồn nhập
                            </label>
                            <input
                                type="text"
                                name="supplier"
                                value={formData.supplier}
                                onChange={handleChange}
                                placeholder="Vd: Nshop, Cytron, Shopee..."
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:border-[var(--main_d)] outline-none"
                            />
                        </div>
                    </div>

                    {/* Datasheet URL & Image Link */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Link Datasheet / Hướng dẫn
                            </label>
                            <input
                                type="url"
                                name="datasheetUrl"
                                value={formData.datasheetUrl}
                                onChange={handleChange}
                                placeholder="https://..."
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:border-[var(--main_d)] outline-none text-blue-600"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Link hình ảnh / Drive URL
                            </label>
                            <input
                                type="url"
                                name="imageUrl"
                                value={formData.imageUrl}
                                onChange={handleChange}
                                placeholder="https://..."
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:border-[var(--main_d)] outline-none"
                            />
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Từ khóa tìm kiếm (ngăn cách bởi dấu phẩy)
                        </label>
                        <input
                            type="text"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            placeholder="Vd: pwm, 5v, esp32, wifi, bluetooth..."
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:border-[var(--main_d)] outline-none"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Mô tả chi tiết & Lưu ý kỹ thuật
                        </label>
                        <textarea
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Ghi chú điện áp hoạt động, chân nối, cảnh báo cho học sinh..."
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:border-[var(--main_d)] outline-none resize-y"
                        />
                    </div>

                    {/* Footer buttons */}
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
                            <span>{isEdit ? 'Lưu thay đổi' : 'Thêm vào kho'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
