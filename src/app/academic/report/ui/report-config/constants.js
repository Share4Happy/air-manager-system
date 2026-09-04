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

export const DEFAULT_REPORT_OPTIONS = {
    attendance: { classes: true, present: true, absent: true, unchecked: true, lessonCount: true, studentTurns: true, perClass: true, violations: true, checkinLate: true },
    monthly: { tuition: true, enrollments: true, upgrades: true, quits: true, classesByArea: true, studentRank: true, trialCount: true, trialRate: true, comparePrevMonth: true },
}

export const COMMON_PLACEHOLDERS = [
    { tag: '{period}', label: 'Kỳ báo cáo', desc: 'VD: Thứ 6 - 04/09/2026 hoặc Tháng 8/2026' },
    { tag: '{date}', label: 'Ngày gửi', desc: 'VD: 04/09/2026' },
    { tag: '{body}', label: 'Báo cáo đầy đủ', desc: 'Toàn bộ nội dung báo cáo tự sinh' },
]

export const ATTENDANCE_PLACEHOLDERS = [
    { tag: '{tong_so_lop}', label: 'Tổng số lớp', desc: 'VD: 8' },
    { tag: '{so_lop_hoc}', label: 'Số lớp học', desc: 'VD: 7' },
    { tag: '{so_lop_nghi}', label: 'Số lớp báo nghỉ', desc: 'VD: 1' },
    { tag: '{so_lop_hoc_thu}', label: 'Số lớp học thử', desc: 'VD: 1' },
    { tag: '{tong_buoi}', label: 'Tổng số buổi', desc: 'VD: 8' },
    { tag: '{tong_luot_hs}', label: 'Tổng lượt HS', desc: 'VD: 48' },
    { tag: '{co_mat}', label: 'Có mặt', desc: 'VD: 45 Học sinh' },
    { tag: '{xin_nghi}', label: 'Xin nghỉ (có phép)', desc: 'VD: 2 Học sinh' },
    { tag: '{vang_mat}', label: 'Vắng mặt', desc: 'VD: 1 Học sinh' },
    { tag: '{chua_diem_danh}', label: 'Chưa điểm danh', desc: 'VD: 0 Học sinh' },
    { tag: '{chi_tiet_lop}', label: 'Chi tiết từng lớp học', desc: 'Danh sách lớp đang học' },
    { tag: '{chi_tiet_lop_nghi}', label: 'Chi tiết lớp báo nghỉ', desc: 'Danh sách lớp báo nghỉ kèm lý do' },
    { tag: '{chi_tiet_hoc_thu}', label: 'Chi tiết lớp học thử', desc: 'Danh sách lớp học thử' },
    { tag: '{vi_pham}', label: 'Lỗi vi phạm', desc: 'Lớp chưa điểm danh, thiếu ảnh' },
    { tag: '{checkin_tre}', label: 'Checkin trễ', desc: 'Lớp checkin muộn' },
    { tag: '{checkin_dung_gio}', label: 'Checkin đúng giờ', desc: 'Lớp checkin đúng giờ' },
]

export const MONTHLY_PLACEHOLDERS = [
    { tag: '{hoc_phi}', label: 'Học phí thu', desc: 'VD: 185.000.000 đ' },
    { tag: '{hs_moi}', label: 'Học sinh mới', desc: 'VD: 24' },
    { tag: '{hs_len_khoa}', label: 'Lên khóa mới', desc: 'VD: 15' },
    { tag: '{hs_nghi}', label: 'Học sinh nghỉ', desc: 'VD: 2' },
    { tag: '{xep_hang_hs}', label: 'Xếp hạng HS', desc: 'Kim Cương, Vàng, Bạc...' },
    { tag: '{luot_hoc_thu}', label: 'Lượt học thử', desc: 'VD: 30' },
    { tag: '{nhap_hoc_thu}', label: 'Nhập học thử', desc: 'VD: 21' },
    { tag: '{ti_le_hoc_thu}', label: 'Tỉ lệ học thử', desc: 'VD: 70%' },
    { tag: '{lop_theo_khu_vuc}', label: 'Lớp theo khu vực', desc: 'Lớp đang học / hoàn thành' },
    { tag: '{so_sanh_thang_truoc}', label: 'So với tháng trước', desc: 'Biến động so với tháng trước' },
]

export function getPlaceholderGroups(reportType = 'attendance') {
    if (reportType === 'attendance') {
        return [
            { title: 'Chung', items: COMMON_PLACEHOLDERS },
            { title: 'Chuyên cần', items: ATTENDANCE_PLACEHOLDERS },
        ]
    }
    if (reportType === 'monthly') {
        return [
            { title: 'Chung', items: COMMON_PLACEHOLDERS },
            { title: 'Thống kê tháng', items: MONTHLY_PLACEHOLDERS },
        ]
    }
    return [
        { title: 'Chung', items: COMMON_PLACEHOLDERS },
        { title: 'Chuyên cần', items: ATTENDANCE_PLACEHOLDERS },
        { title: 'Thống kê tháng', items: MONTHLY_PLACEHOLDERS },
    ]
}

export const PRESET_TEMPLATES = [
    {
        id: 'att_daily_main',
        name: '1. Báo cáo Chuyên Cần (Hàng ngày)',
        reportType: 'attendance',
        content: `BÁO CÁO CHUYÊN CẦN NGÀY {period}
==============================
I. TỔNG QUAN LỚP HỌC
• Tổng số lớp: {tong_so_lop} lớp ({so_lop_hoc} lớp học | {so_lop_nghi} báo nghỉ | {so_lop_hoc_thu} học thử)
• Điểm danh: {co_mat} có mặt | {xin_nghi} xin nghỉ | {vang_mat} vắng mặt | {chua_diem_danh} chưa điểm danh

II. DANH SÁCH LỚP HỌC CHI TIẾT
{chi_tiet_lop}

III. LỚP BÁO NGHỈ
{chi_tiet_lop_nghi}

IV. LỚP HỌC THỬ
{chi_tiet_hoc_thu}

V. KIỂM SOÁT VI PHẠM & CHECKIN
{vi_pham}
• Checkin trễ: {checkin_tre}
• Checkin đúng giờ: {checkin_dung_gio}
==============================
(Thời gian tạo: {date})`,
    },
    {
        id: 'att_weekly_main',
        name: '2. Báo cáo Tổng Kết Tuần',
        reportType: 'attendance',
        content: `BÁO CÁO TỔNG KẾT TUẦN {period}
==============================
I. TỔNG QUAN HOẠT ĐỘNG TRONG TUẦN
• Tổng số lớp theo lịch: {tong_so_lop} lớp ({tong_buoi} buổi học)
• Lớp học thực tế: {so_lop_hoc} lớp ({tong_luot_hs} lượt học sinh)
• Lớp báo nghỉ: {so_lop_nghi} lớp
• Lớp học thử: {so_lop_hoc_thu} lớp

II. TÌNH HÌNH CHUYÊN CẦN & ĐIỂM DANH
• Có mặt: {co_mat}
• Xin nghỉ (có phép): {xin_nghi}
• Vắng mặt (không phép): {vang_mat}
• Chưa hoàn tất điểm danh: {chua_diem_danh}

III. CHI TIẾT CÁC LỚP THEO CƠ SỞ
{chi_tiet_lop}

IV. TÌNH HÌNH LỚP BÁO NGHỈ TRONG TUẦN
{chi_tiet_lop_nghi}

V. LỚP HỌC THỬ TRONG TUẦN
{chi_tiet_hoc_thu}

VI. TỔNG HỢP VI PHẠM & CHECKIN
{vi_pham}
• Checkin trễ: {checkin_tre}
• Checkin đúng giờ: {checkin_dung_gio}
==============================
(Thời gian tạo: {date})`,
    },
    {
        id: 'mon_monthly_main',
        name: '3. Báo cáo Thống Kê Tổng Hợp Tháng',
        reportType: 'monthly',
        content: `BÁO CÁO THỐNG KÊ TỔNG HỢP THÁNG {period}
==============================
I. TÀI CHÍNH & DOANH THU
• Doanh thu học phí thu được: {hoc_phi}

II. BIẾN ĐỘNG HỌC SINH
• Học sinh mới: {hs_moi}
• Học sinh lên khóa / tái tục: {hs_len_khoa}
• Học sinh nghỉ: {hs_nghi}
• Phân bổ xếp hạng học sinh: {xep_hang_hs}

III. HOẠT ĐỘNG HỌC THỬ & CHUYỂN ĐỔI
• Lượt học thử: {luot_hoc_thu}
• Học sinh đăng ký sau học thử: {nhap_hoc_thu}
• Tỉ lệ chuyển đổi: {ti_le_hoc_thu}

IV. QUẢN LÝ LỚP HỌC THEO KHU VỰC
{lop_theo_khu_vuc}

V. SO SÁNH BIẾN ĐỘNG VỚI THÁNG TRƯỚC
{so_sanh_thang_truoc}
==============================
(Thời gian tạo: {date})`,
    },
    {
        id: 'att_compact',
        name: 'Chuyên cần - Rút gọn nhanh',
        reportType: 'attendance',
        content: `BÁO CÁO NHANH CHUYÊN CẦN {period}
- Tổng số lớp: {tong_so_lop} (Học: {so_lop_hoc} | Nghỉ: {so_lop_nghi} | Học thử: {so_lop_hoc_thu})
- Có mặt: {co_mat} | Xin nghỉ: {xin_nghi} | Vắng: {vang_mat}
- Vi phạm: {vi_pham}
- Checkin trễ: {checkin_tre}
(Ngày gửi: {date})`,
    },
    {
        id: 'att_detailed',
        name: 'Chuyên cần - Chi tiết từng lớp',
        reportType: 'attendance',
        content: `DANH SÁCH ĐIỂM DANH CÁC LỚP {period}
==========================
Tổng cộng: {co_mat} có mặt | {xin_nghi} xin nghỉ | {vang_mat} vắng mặt

CHI TIẾT THEO CƠ SỞ:
{chi_tiet_lop}

LỚP BÁO NGHỈ:
{chi_tiet_lop_nghi}

TÌNH HÌNH VI PHẠM & CHECKIN:
- Vi phạm: {vi_pham}
- Checkin trễ: {checkin_tre}
- Đúng giờ: {checkin_dung_gio}
==========================
(Ngày gửi: {date})`,
    },
    {
        id: 'mon_finance',
        name: 'Thống kê tháng - Tài chính & Tuyển sinh',
        reportType: 'monthly',
        content: `BÁO CÁO TÀI CHÍNH & HỌC SINH THÁNG {period}
--------------------------
1. Doanh thu học phí: {hoc_phi}
2. Học sinh mới nhập học: {hs_moi}
3. Học sinh lên khóa: {hs_len_khoa}
4. Học sinh nghỉ học: {hs_nghi}
5. Chuyển đổi học thử: {nhap_hoc_thu}/{luot_hoc_thu} ({ti_le_hoc_thu})
--------------------------
(Ngày gửi: {date})`,
    },
    {
        id: 'mon_compact',
        name: 'Thống kê tháng - Tóm tắt nhanh',
        reportType: 'monthly',
        content: `TỔNG KẾT THÁNG {period}
- Học phí: {hoc_phi}
- HS mới: {hs_moi} | Lên khóa: {hs_len_khoa} | Nghỉ: {hs_nghi}
- Học thử: {luot_hoc_thu} (Chuyển đổi {ti_le_hoc_thu})
- Xếp hạng: {xep_hang_hs}
(Ngày gửi: {date})`,
    },
]

export const DEFAULT_CUSTOM_TEMPLATES = {
    attendance: PRESET_TEMPLATES[0].content,
    monthly: PRESET_TEMPLATES[2].content,
}

export const SAMPLE_PREVIEW_VARS = {
    attendance: {
        tong_so_lop: '8',
        so_lop: '8',
        total_classes: '8',
        so_lop_hoc: '7',
        active_classes: '7',
        so_lop_nghi: '1',
        lop_bao_nghi: '1',
        cancelled_classes: '1',
        so_lop_hoc_thu: '1',
        lop_hoc_thu: '1',
        trial_classes: '1',
        co_mat: '45 Học sinh',
        co_mat_so: '45',
        present: '45 Học sinh',
        xin_nghi: '2 Học sinh',
        xin_nghi_so: '2',
        excused: '2 Học sinh',
        vang_mat: '1 Học sinh',
        vang_mat_so: '1',
        absent: '1 Học sinh',
        chua_diem_danh: '0 Học sinh',
        chua_diem_danh_so: '0',
        unchecked: '0 Học sinh',
        tong_buoi: '8',
        lesson_count: '8',
        so_buoi_hoc: '7',
        so_buoi_nghi: '1',
        tong_luot_hs: '48',
        student_turns: '48',
        chi_tiet_lop: `Cơ sở Quận 1:
• 24FZ2007 (Thầy Nam) : Buổi 5 | Sĩ số : 6 | Có mặt : 5 | Xin nghỉ : 1 | Vắng : 0
• 25SA1002 (Cô Lan) : Buổi 12 | Sĩ số : 8 | Có mặt : 7 | Vắng : 1
Học thử:
• HT-20260904 (Thầy Bình) : Buổi 1 | Sĩ số : 5 | Có mặt : 5 | Vắng : 0`,
        class_details: `Cơ sở Quận 1:
• 24FZ2007 (Thầy Nam) : Buổi 5 | Sĩ số : 6 | Có mặt : 5 | Xin nghỉ : 1 | Vắng : 0
• 25SA1002 (Cô Lan) : Buổi 12 | Sĩ số : 8 | Có mặt : 7 | Vắng : 1`,
        chi_tiet_lop_nghi: `Cơ sở Quận 1:
• 24FZ2008 (Thầy Hùng) : Buổi 3 - Lý do: Lễ nghỉ bù`,
        cancelled_class_details: `Cơ sở Quận 1:
• 24FZ2008 (Thầy Hùng) : Buổi 3 - Lý do: Lễ nghỉ bù`,
        chi_tiet_hoc_thu: `Học thử:
• HT-20260904 (Thầy Bình) : Buổi 1 | Sĩ số : 5 | Có mặt : 5 | Vắng : 0`,
        trial_class_details: `Học thử:
• HT-20260904 (Thầy Bình) : Buổi 1 | Sĩ số : 5 | Có mặt : 5 | Vắng : 0`,
        vi_pham: `Lớp chưa điểm danh: 0
Thiếu tài nguyên: 1 (Cô Lan)`,
        violations: `Lớp chưa điểm danh: 0
Thiếu tài nguyên: 1 (Cô Lan)`,
        checkin_tre: '1 (Cô Lan)',
        checkin_late: '1 (Cô Lan)',
        checkin_dung_gio: '7',
        checkin_ontime: '7',
        period: 'Thứ 6 - 04/09/2026',
        date: '04/09/2026',
        body: `[Toàn bộ báo cáo chuyên cần mặc định sinh tự động]`,
    },
    monthly: {
        hoc_phi: '185.000.000 đ',
        tuition: '185.000.000 đ',
        hs_moi: '24',
        enrollments: '24',
        hs_len_khoa: '15',
        upgrades: '15',
        hs_nghi: '2',
        quits: '2',
        xep_hang_hs: 'Kim Cương 12 | Vàng 28 | Bạc 45 | Đồng 60',
        student_rank: 'Kim Cương 12 | Vàng 28 | Bạc 45 | Đồng 60',
        luot_hoc_thu: '30',
        trial_count: '30',
        nhap_hoc_thu: '21',
        trial_enrolled: '21',
        ti_le_hoc_thu: '70%',
        trial_rate: '70%',
        lop_theo_khu_vuc: `• Tổng: 14 lớp đang diễn ra, 6 lớp đã hoàn thành
Khu vực Quận 1:
• 24FZ2007 (6 hs) [đang diễn ra]
• 24FZ1001 (8 hs) [hoàn thành]`,
        classes_by_area: `• Tổng: 14 lớp đang diễn ra, 6 lớp đã hoàn thành
Khu vực Quận 1:
• 24FZ2007 (6 hs) [đang diễn ra]
• 24FZ1001 (8 hs) [hoàn thành]`,
        so_sanh_thang_truoc: `SO SÁNH VỚI THÁNG TRƯỚC
• Học phí thu: 160.000.000 đ → 185.000.000 đ
• Học sinh mới: 18 → 24
• Học sinh lên khóa: 10 → 15
• Học sinh nghỉ: 4 → 2
• Lượt học thử: 25 → 30
• Nhập học sau học thử: 15 → 21
• Học sinh xếp hạng (đang học): 130 → 145
• Lớp đang diễn ra: 12 → 14`,
        compare_prev_month: `SO SÁNH VỚI THÁNG TRƯỚC
• Học phí thu: 160.000.000 đ → 185.000.000 đ
• Học sinh mới: 18 → 24
• Học sinh lên khóa: 10 → 15
• Học sinh nghỉ: 4 → 2
• Lượt học thử: 25 → 30
• Nhập học sau học thử: 15 → 21
• Học sinh xếp hạng (đang học): 130 → 145
• Lớp đang diễn ra: 12 → 14`,
        period: 'Tháng 8/2026',
        date: '04/09/2026',
        body: `[Toàn bộ báo cáo tháng mặc định sinh tự động]`,
    },
}

export function renderPreviewTemplate(template, reportType = 'attendance') {
    if (!template) return ''
    const specificSample = SAMPLE_PREVIEW_VARS[reportType] || {}
    const sample = {
        ...SAMPLE_PREVIEW_VARS.attendance,
        ...SAMPLE_PREVIEW_VARS.monthly,
        ...specificSample,
    }
    let message = template
    Object.entries(sample).forEach(([k, v]) => {
        const reg = new RegExp(`{${k}}`, 'gi')
        message = message.replace(reg, String(v))
    })
    return message
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
    skipIfNoClasses: true,
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
