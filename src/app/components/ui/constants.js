export const CATEGORY_MAP = {
    vi_dieu_khien: {
        label: 'Vi điều khiển & Board',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        badgeColor: 'text-blue-600 bg-blue-100/70',
        icon: '💻'
    },
    cam_bien: {
        label: 'Cảm biến',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badgeColor: 'text-emerald-600 bg-emerald-100/70',
        icon: '📡'
    },
    dong_co: {
        label: 'Động cơ & Servo',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        badgeColor: 'text-amber-600 bg-amber-100/70',
        icon: '⚙️'
    },
    module: {
        label: 'Module & Truyền thông',
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        badgeColor: 'text-indigo-600 bg-indigo-100/70',
        icon: '📶'
    },
    nguon_pin: {
        label: 'Nguồn & Pin',
        color: 'bg-orange-50 text-orange-700 border-orange-200',
        badgeColor: 'text-orange-600 bg-orange-100/70',
        icon: '🔋'
    },
    khung_co_khi: {
        label: 'Khung vỏ & Cơ khí',
        color: 'bg-stone-50 text-stone-700 border-stone-200',
        badgeColor: 'text-stone-600 bg-stone-100/70',
        icon: '🤖'
    },
    day_noi: {
        label: 'Dây cáp & Thụ động',
        color: 'bg-teal-50 text-teal-700 border-teal-200',
        badgeColor: 'text-teal-600 bg-teal-100/70',
        icon: '🔌'
    },
    dung_cu: {
        label: 'Dụng cụ & Thiết bị',
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        badgeColor: 'text-purple-600 bg-purple-100/70',
        icon: '🛠️'
    },
    khac: {
        label: 'Khác',
        color: 'bg-gray-50 text-gray-700 border-gray-200',
        badgeColor: 'text-gray-600 bg-gray-100/70',
        icon: '📦'
    }
};

export const STATUS_MAP = {
    in_stock: {
        label: 'Còn hàng',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500'
    },
    low_stock: {
        label: 'Sắp hết',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500'
    },
    out_of_stock: {
        label: 'Hết hàng',
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500'
    },
    discontinued: {
        label: 'Ngừng dùng',
        badge: 'bg-gray-50 text-gray-600 border-gray-200',
        dot: 'bg-gray-400'
    }
};

export const TRANSACTION_TYPE_MAP = {
    import: {
        label: 'Nhập kho',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        sign: '+'
    },
    export: {
        label: 'Xuất cấp phát',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        sign: '-'
    },
    damaged: {
        label: 'Báo hỏng',
        color: 'text-rose-600 bg-rose-50 border-rose-200',
        sign: '-'
    },
    lost: {
        label: 'Thất lạc',
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        sign: '-'
    },
    adjust: {
        label: 'Kiểm kê điều chỉnh',
        color: 'text-purple-600 bg-purple-50 border-purple-200',
        sign: '±'
    }
};

export const formatCurrency = (val) => {
    if (!val || isNaN(val)) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

export const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
};
