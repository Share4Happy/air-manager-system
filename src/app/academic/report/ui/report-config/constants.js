'use client'

import { useFormStatus } from 'react-dom'

export const WEEKDAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
export const FREQ_LABELS = { daily: 'Hàng ngày', weekly: 'Hàng tuần', monthly: 'Hàng tháng' }
export const TYPE_LABELS = { attendance: 'Chuyên cần', monthly: 'Thống kê tháng' }
export const RANGE_LABELS = { day: 'Theo ngày', week: 'Theo tuần', month: 'Theo tháng' }
export const MESSAGE_TYPE_LABELS = {
    periodic_report: 'Báo cáo định kỳ',
    adhoc_report: 'Báo cáo đột xuất',
    notice: 'Thông báo',
    reminder: 'Nhắc nhở',
    celebration: 'Chúc mừng',
    other: 'Khác',
}

export const ATTENDANCE_OPTIONS = [
    ['classes', 'Tổng số lớp'],
    ['present', 'Có mặt'],
    ['absent', 'Vắng mặt'],
    ['unchecked', 'Chưa điểm danh'],
    ['lessonCount', 'Tổng số buổi học'],
    ['studentTurns', 'Tổng lượt học sinh'],
    ['perClass', 'Chi tiết theo lớp (theo khu vực)'],
    ['violations', 'Lỗi vi phạm'],
    ['checkinLate', 'Checkin trễ (điểm danh sau giờ bắt đầu)'],
]

export const MONTHLY_OPTIONS = [
    ['tuition', 'Học phí thu'],
    ['enrollments', 'Học sinh mới'],
    ['upgrades', 'Học sinh lên khóa'],
    ['quits', 'Học sinh nghỉ'],
    ['classesByArea', 'Lớp theo khu vực (đã hoàn thành / đang diễn ra)'],
    ['studentRank', 'Học sinh theo xếp hạng (đang học)'],
    ['trialCount', 'Lượt học thử'],
    ['trialRate', 'Tỉ lệ nhập học sau học thử'],
]

export const DEFAULT_REPORT_OPTIONS = {
    attendance: { classes: true, present: true, absent: true, unchecked: false, lessonCount: false, studentTurns: false, perClass: true, violations: true, checkinLate: true },
    monthly: { tuition: true, enrollments: true, upgrades: true, quits: true, classesByArea: true, studentRank: true, trialCount: true, trialRate: true, comparePrevMonth: false },
}

export const emptyConfigForm = {
    _id: '',
    name: '',
    recipientUserIds: [],
    zaloAccountId: '',
    reportType: 'attendance',
    messageTemplate: '',
    reportOptions: JSON.parse(JSON.stringify(DEFAULT_REPORT_OPTIONS)),
    frequency: 'daily',
    sendTime: '08:00',
    weekday: 1,
    monthDay: 1,
    areas: [],
}

export function fmtDate(d) {
    if (!d) return '—'
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return '—'
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

export function logContent(l) {
    return l?.status?.data?.message || l?.message || ''
}

export function SubmitButton({ text = 'Lưu', disabled = false }) {
    const { pending } = useFormStatus()
    return (
        <button type="submit" disabled={pending || disabled}
            className="px-4 py-2 rounded bg-[var(--main_d)] text-white text-sm font-medium flex items-center gap-2 justify-center whitespace-nowrap border-none cursor-pointer transition-colors hover:bg-[var(--main_b)] disabled:opacity-50">
            {text}
        </button>
    )
}

export const inputCls = "w-full px-3 py-2 border border-gray-300 rounded bg-white text-sm outline-none text-gray-700 focus:border-[var(--main_d)]"
export const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1"
