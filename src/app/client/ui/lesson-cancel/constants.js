export const MESSAGE_TYPE_LABELS = {
    notice: 'Thông báo',
    reminder: 'Nhắc nhở',
    celebration: 'Chúc mừng',
    other: 'Khác',
};

export const SEND_VARIABLES = [
    { key: 'HoTen', label: 'Tên học sinh' },
    { key: 'TenPH', label: 'Tên phụ huynh' },
    { key: 'Lop', label: 'Tên lớp' },
    { key: 'Ngay', label: 'Ngày buổi học' },
    { key: 'GiaoVien', label: 'Giáo viên' },
    { key: 'DiemDanh', label: 'Điểm danh' },
    { key: 'HinhAnh', label: 'Link hình ảnh' },
    { key: 'NhanXetGV', label: 'Nhận xét giáo viên' },
    { key: 'LinkEportfolio', label: 'Link e-portfolio' },
];

export const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded bg-white text-sm outline-none text-gray-700 focus:border-[var(--main_d)]';
export const labelCls = 'block text-sm font-medium text-[var(--text-primary)] mb-1';

export function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '—';
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

export function fmtTime(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

export function logRecipients(l) {
    if (l?._recipientNames?.length) return l._recipientNames;
    if (l?._recipients?.length) return l._recipients;
    const r = l?.status?.data?.recipients;
    return Array.isArray(r) ? r : [];
}

export function logContent(l) {
    return l?.status?.data?.message || l?.message || '';
}

export function progressBadge(count, total) {
    if (!total) return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-[var(--text-secondary)]">—</span>;
    const full = count >= total;
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${full ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{count}/{total}</span>;
}

export function kindBadge(item) {
    if (item.kind === 'today') return <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 whitespace-nowrap">Buổi hôm nay</span>;
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-600 whitespace-nowrap">Lớp nghỉ</span>;
}

export function checkinText(code) {
    if (code === 1) return 'Có mặt';
    if (code === 2) return 'Xin nghỉ';
    if (code === 3) return 'Vắng mặt';
    return 'Chưa điểm danh';
}

export function careBadge(item) {
    const students = item.students || [];
    const handled = students.filter(s => s.notifyStatus === 'done' || s.notifyStatus === 'failed').length;
    return progressBadge(handled, students.length);
}

export function zaloBadge(item) {
    const students = item.students || [];
    const sent = students.filter(s => s.zaloStatus === 'sent').length;
    return progressBadge(sent, students.length);
}
