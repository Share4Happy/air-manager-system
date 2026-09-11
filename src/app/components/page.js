'use client';
import React, { useState, useEffect, useCallback } from 'react';
import ComponentCard from './ui/ComponentCard';
import ComponentTable from './ui/ComponentTable';
import ComponentFormModal from './ui/ComponentFormModal';
import StockTransactionModal from './ui/StockTransactionModal';
import ComponentDetailModal from './ui/ComponentDetailModal';
import { CATEGORY_MAP, formatCurrency } from './ui/constants';
import {
    IconCpu,
    IconBox,
    IconAlertTriangle,
    IconDollar,
    IconSearch,
    IconPlus,
    IconGrid,
    IconList,
    IconDownload,
    IconTrash
} from './ui/icons';

export default function ComponentsManagementPage() {
    const [components, setComponents] = useState([]);
    const [stats, setStats] = useState({
        totalItems: 0,
        totalQuantity: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalValue: 0
    });
    const [loading, setLoading] = useState(true);

    // Filters & view modes
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingComponent, setEditingComponent] = useState(null);

    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [stockModalTarget, setStockModalTarget] = useState(null);
    const [stockModalType, setStockModalType] = useState('import');

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [detailComponent, setDetailComponent] = useState(null);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch data
    const fetchComponents = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search.trim()) params.set('search', search.trim());
            if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
            if (selectedStatus && selectedStatus !== 'all') params.set('status', selectedStatus);

            const res = await fetch(`/api/components?${params.toString()}`, { cache: 'no-store' });
            const data = await res.json();
            if (data.status) {
                setComponents(data.data || []);
                if (data.stats) setStats(data.stats);
            }
        } catch (err) {
            console.error('Error loading components:', err);
        } finally {
            setLoading(false);
        }
    }, [search, selectedCategory, selectedStatus]);

    useEffect(() => {
        fetchComponents();
    }, [fetchComponents]);

    // Handle Quick Stock In / Out
    const handleQuickStock = (item, type = 'import') => {
        setStockModalTarget(item);
        setStockModalType(type);
        setIsStockModalOpen(true);
    };

    // Handle Edit
    const handleEdit = (item) => {
        setEditingComponent(item);
        setIsFormModalOpen(true);
    };

    // Handle View Detail
    const handleViewDetail = (item) => {
        setDetailComponent(item);
        setIsDetailModalOpen(true);
    };

    // Handle Delete
    const handleDelete = (item) => {
        setDeleteTarget(item);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/components/${deleteTarget._id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.status) {
                setComponents((prev) => prev.filter((c) => c._id !== deleteTarget._id));
                setDeleteTarget(null);
                fetchComponents();
            }
        } catch (err) {
            console.error('Error deleting component:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    // Export CSV
    const handleExportCSV = () => {
        if (components.length === 0) return;
        const headers = ['Mã SKU', 'Tên linh kiện', 'Danh mục', 'Vị trí', 'Tồn kho', 'Tối thiểu', 'Đơn vị', 'Đơn giá', 'Tổng giá trị', 'Trạng thái'];
        const rows = components.map((c) => [
            `"${c.code || ''}"`,
            `"${c.name.replace(/"/g, '""')}"`,
            `"${CATEGORY_MAP[c.category]?.label || c.category}"`,
            `"${c.location || ''}"`,
            c.quantity,
            c.minQuantity,
            `"${c.unit || 'Cái'}"`,
            c.unitPrice,
            c.quantity * (c.unitPrice || 0),
            `"${c.status}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Kiem_Ke_Linh_Kien_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-4 sm:p-6 w-full flex flex-col gap-6 max-w-[1600px] mx-auto min-w-0">
            {/* Top Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-[var(--main_d)] text-white flex items-center justify-center font-bold shadow-md shadow-[var(--main_d)]/20">
                            <IconCpu className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                                Quản lý Linh kiện & Kho Vật tư
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 font-medium">
                                Theo dõi tồn kho linh kiện điện tử, cảm biến, vi điều khiển & cấp phát lớp học
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <button
                        onClick={handleExportCSV}
                        title="Xuất báo cáo kiểm kê Excel/CSV"
                        className="px-3.5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                        <IconDownload className="w-4 h-4 text-gray-500" />
                        <span>Xuất CSV</span>
                    </button>

                    <button
                        onClick={() => {
                            setEditingComponent(null);
                            setIsFormModalOpen(true);
                        }}
                        className="px-4 py-2.5 bg-[var(--main_d)] hover:opacity-90 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer border-none shadow-md shadow-[var(--main_d)]/20"
                    >
                        <IconPlus className="w-4 h-4" />
                        <span>Thêm linh kiện mới</span>
                    </button>
                </div>
            </div>

            {/* Overview Summary Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Total Unique Items */}
                <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <IconCpu className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <span className="text-xs font-semibold text-gray-500">Mã linh kiện</span>
                        <div className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                            {stats.totalItems}
                        </div>
                        <span className="text-[11px] text-blue-600 font-medium">Danh mục quản lý</span>
                    </div>
                </div>

                {/* 2. Total Physical Quantity */}
                <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <IconBox className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <span className="text-xs font-semibold text-gray-500">Tổng số lượng tồn</span>
                        <div className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                            {stats.totalQuantity.toLocaleString('vi-VN')}
                        </div>
                        <span className="text-[11px] text-emerald-600 font-medium">Vật tư trong kho</span>
                    </div>
                </div>

                {/* 3. Alerts: Low & Out of Stock */}
                <div className={`bg-white border rounded-2xl p-4 shadow-sm flex items-center gap-3.5 ${
                    stats.lowStockCount > 0 || stats.outOfStockCount > 0
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-gray-200/80'
                }`}>
                    <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <IconAlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <span className="text-xs font-semibold text-gray-500">Cảnh báo tồn kho</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl sm:text-2xl font-extrabold text-amber-600">
                                {stats.lowStockCount}
                            </span>
                            <span className="text-xs text-gray-400">sắp hết</span>
                            {stats.outOfStockCount > 0 && (
                                <>
                                    <span className="text-gray-300">/</span>
                                    <span className="text-xl sm:text-2xl font-extrabold text-rose-600">
                                        {stats.outOfStockCount}
                                    </span>
                                    <span className="text-xs text-rose-500 font-medium">hết</span>
                                </>
                            )}
                        </div>
                        <span className="text-[11px] text-amber-600 font-medium">Cần bổ sung</span>
                    </div>
                </div>

                {/* 4. Total Valuation */}
                <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <IconDollar className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <span className="text-xs font-semibold text-gray-500">Tổng giá trị tồn kho</span>
                        <div className="text-lg sm:text-xl font-extrabold text-gray-900 truncate">
                            {formatCurrency(stats.totalValue)}
                        </div>
                        <span className="text-[11px] text-purple-600 font-medium">Định giá vật tư</span>
                    </div>
                </div>
            </div>

            {/* Filter, Search & View Controls */}
            <div className="flex flex-col gap-3 bg-white border border-gray-200/90 rounded-2xl p-4 shadow-sm">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <IconSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo tên linh kiện, mã SKU, vị trí ngăn tủ, thông số..."
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[var(--main_d)] focus:ring-1 focus:ring-[var(--main_d)] outline-none transition-all"
                        />
                    </div>

                    {/* Status & View Mode */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        {/* Status Filter */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-3 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="in_stock">🟢 Còn hàng</option>
                            <option value="low_stock">🟡 Sắp hết hàng</option>
                            <option value="out_of_stock">🔴 Hết hàng</option>
                            <option value="discontinued">⚪ Ngừng sử dụng</option>
                        </select>

                        {/* View Switch Buttons (Grid / Table) */}
                        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/80">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer border-none ${
                                    viewMode === 'grid'
                                        ? 'bg-white text-gray-900 shadow-xs'
                                        : 'bg-transparent text-gray-500 hover:text-gray-700'
                                }`}
                                title="Xem dạng lưới (Cards)"
                            >
                                <IconGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer border-none ${
                                    viewMode === 'table'
                                        ? 'bg-white text-gray-900 shadow-xs'
                                        : 'bg-transparent text-gray-500 hover:text-gray-700'
                                }`}
                                title="Xem dạng bảng (Table)"
                            >
                                <IconList className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Category Pills Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-gray-100">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer border ${
                            selectedCategory === 'all'
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                        Tất cả ({stats.totalItems})
                    </button>
                    {Object.entries(CATEGORY_MAP).map(([key, item]) => {
                        const count = components.filter((c) => c.category === key).length;
                        return (
                            <button
                                key={key}
                                onClick={() => setSelectedCategory(key)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer border flex items-center gap-1.5 ${
                                    selectedCategory === key
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                                {count > 0 && selectedCategory !== 'all' && (
                                    <span className="text-[10px] opacity-80">({count})</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Display: Grid or Table */}
            {loading ? (
                <div className="p-16 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <div className="w-8 h-8 border-3 border-gray-300 border-t-[var(--main_d)] rounded-full animate-spin" />
                    <span className="text-sm font-medium">Đang tải danh sách linh kiện...</span>
                </div>
            ) : components.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mb-3">
                        <IconBox className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-gray-800">Không tìm thấy linh kiện nào</h3>
                    <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4">
                        {search || selectedCategory !== 'all' || selectedStatus !== 'all'
                            ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc phân loại.'
                            : 'Kho linh kiện hiện đang trống. Hãy thêm linh kiện đầu tiên để bắt đầu theo dõi.'}
                    </p>
                    <button
                        onClick={() => {
                            setEditingComponent(null);
                            setIsFormModalOpen(true);
                        }}
                        className="px-4 py-2 bg-[var(--main_d)] text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer border-none shadow-sm"
                    >
                        <IconPlus className="w-4 h-4" />
                        <span>Thêm linh kiện ngay</span>
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {components.map((item) => (
                        <ComponentCard
                            key={item._id}
                            component={item}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onQuickStock={handleQuickStock}
                            onViewDetail={handleViewDetail}
                        />
                    ))}
                </div>
            ) : (
                <ComponentTable
                    components={components}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onQuickStock={handleQuickStock}
                    onViewDetail={handleViewDetail}
                />
            )}

            {/* Modal: Create & Edit Component */}
            <ComponentFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                initialData={editingComponent}
                onSuccess={() => {
                    fetchComponents();
                }}
            />

            {/* Modal: Quick Stock In / Out */}
            <StockTransactionModal
                isOpen={isStockModalOpen}
                onClose={() => setIsStockModalOpen(false)}
                component={stockModalTarget}
                defaultType={stockModalType}
                onSuccess={() => {
                    fetchComponents();
                }}
            />

            {/* Modal: Detail Specs & Transaction Timeline */}
            <ComponentDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                component={detailComponent}
                onEdit={handleEdit}
                onQuickStock={handleQuickStock}
            />

            {/* Modal: Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
                    <div
                        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                            <IconTrash className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900">Xóa linh kiện này?</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-4 leading-relaxed">
                            Bạn có chắc chắn muốn xóa <span className="font-semibold text-gray-800">{deleteTarget.name}</span> khỏi hệ thống kho? Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer border-none"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer border-none flex items-center gap-1.5"
                            >
                                {isDeleting && <span className="animate-spin text-xs">⏳</span>}
                                <span>Xác nhận xóa</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
