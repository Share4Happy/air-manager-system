export const DEFAULT_EQUIPMENT_CATEGORIES = {
    robot_model: { label: 'Mô hình Robot', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' },
    kit: { label: 'Bộ Kit học tập', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
    electronics: { label: 'Linh kiện & Pin', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
    laptop_screen: { label: 'Laptop & Thiết bị số', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800' },
    tools: { label: 'Dụng cụ & Kỹ thuật', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800' },
    banner_props: { label: 'Sa bàn, Backdrop & Quà', color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800' },
    other: { label: 'Khác', color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' },
};

export const CATEGORY_COLOR_PALETTES = [
    { id: 'blue', label: 'Xanh dương', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800', preview: 'bg-blue-500' },
    { id: 'emerald', label: 'Xanh lá', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', preview: 'bg-emerald-500' },
    { id: 'purple', label: 'Tím', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800', preview: 'bg-purple-500' },
    { id: 'amber', label: 'Vàng cam', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800', preview: 'bg-amber-500' },
    { id: 'rose', label: 'Hồng đỏ', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800', preview: 'bg-rose-500' },
    { id: 'indigo', label: 'Chàm', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800', preview: 'bg-indigo-500' },
    { id: 'teal', label: 'Xanh ngọc', color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800', preview: 'bg-teal-500' },
    { id: 'cyan', label: 'Xanh cyan', color: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800', preview: 'bg-cyan-500' },
    { id: 'gray', label: 'Xám bạc', color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700', preview: 'bg-gray-500' },
];

export const CONDITIONS = [
    { value: 'Tốt', label: 'Tốt / Đầy đủ', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
    { value: 'Cần sạc pin', label: 'Cần sạc pin', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
    { value: 'Thiếu phụ kiện', label: 'Thiếu phụ kiện', color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800' },
    { value: 'Cần sửa/Hỏng', label: 'Cần sửa / Hỏng', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' },
];
