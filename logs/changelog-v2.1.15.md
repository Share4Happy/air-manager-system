# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.15] - 2026-08-04

### Added
- **Tab "Cấu hình báo cáo"** trên trang Báo cáo chuyên cần (`/academic/report`):
  - Chọn người nhận (dropdown user có SĐT + đang hoạt động)
  - Chọn tài khoản Zalo gửi (dropdown bot ZaloLite có `botId`)
  - Chọn loại báo cáo: Chuyên cần / Thống kê tháng
  - Mẫu tin nhắn: thư viện mẫu riêng + nhập trực tiếp (hỗ trợ `{body}`, `{period}`, `{date}`, `{Tên biến thể}`)
  - Cấu hình gửi định kỳ: Hàng ngày / Hàng tuần (chọn thứ) / Hàng tháng (chọn ngày) + giờ gửi HH:MM
  - Nút "Gửi ngay" (test), bật/tắt, sửa, xóa cấu hình; danh sách hiển thị lần gửi tới / lần gửi cuối
- **Báo cáo tự sinh số liệu** (`src/function/report.js`):
  - `generateAttendanceReport({ start, end })` — tổng hợp điểm danh từ `Course.Student[].Learn[].Checkin` (0/1/2/3) + trial `coursetry.sessions[].students[].checkin`: tổng buổi, tổng lớp, lượt HS, có mặt, vắng có/không phép, chưa điểm danh, tỉ lệ chuyên cần, chi tiết theo lớp
  - `generateMonthlyReport({ year, month })` — từ `Invoice.amountPaid`, `Student.Status`/`Course`, trial: học phí thu, HS mới, chờ xếp lớp, chuyển theo học, hoàn thành, lượt học thử
  - `computeNextRunAt(freq, sendTime, weekday, monthDay)` — tính lịch gửi kế tiếp
  - `renderReportTemplate` — thay placeholder + biến thể
  - `executeReportConfig` — sinh + gửi qua `sendBatch` (1 SĐT người nhận) + ghi `logmes`
- **Model mới**: `src/models/reportConfig.js` (collection `reportconfigs`), `src/models/reportTemplate.js` (thư viện mẫu)
- **Server actions**: `src/app/actions/reportConfig.actions.js` (Admin/Sale) — save/toggle/delete config, sendReportNow, save/delete template
- **API**: `GET /api/report-config` — danh sách configs (populate người nhận + Zalo) và templates
- **Scheduler**: `processPendingReports()` trong `GET /api/(zalo)/action` — tự gửi báo cáo đến hạn, cập nhật `lastSentAt`/`nextRunAt`

### Changed
- **`src/app/academic/report/client.js`**: thêm tab "Cấu hình báo cáo" (state `'config'`)
- **`src/app/academic/report/page.js`**: fetch thêm `user_data({})` + `zalo_data()` truyền xuống tab
- **`src/app/api/(zalo)/action/route.js`**: gọi `processPendingReports()` mỗi tick scheduler

### Notes
- Báo cáo gửi qua ZaloLite Gateway (`sendBatch`), gateway tự resolve phone→UID; người nhận cần có SĐT hợp lệ
- Báo cáo lỗi → ghi log thất bại, giữ nguyên `nextRunAt` để tick sau thử lại
- Kỳ báo cáo: Chuyên cần = hôm qua (daily) / 7 ngày (weekly) / tháng trước (monthly); Thống kê tháng = tháng trước

### Verification
- `npx next build` passes successfully
- `GET /api/report-config` trả đúng configs/templates populated
- Scheduler `/api/action` chạy không lỗi (không gửi khi chưa đến hạn)
- Aggregation sinh báo cáo chuyên cần validate với data thật (30 buổi, 63 lượt HS trong 7 ngày)

---
