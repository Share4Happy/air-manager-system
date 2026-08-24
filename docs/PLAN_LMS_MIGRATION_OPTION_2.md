# 📋 KẾ HOẠCH TRIỂN KHAI PHƯƠNG ÁN 2: TÁCH BẢNG CHUẨN LMS QUỐC TẾ
> **Mục tiêu:** Giải quyết triệt để bài toán "Mô hình dữ liệu nhúng sâu (Deeply Embedded Documents)", loại bỏ Race Condition (ghi đè dữ liệu), tăng tốc độ đọc/ghi điểm danh $O(1)$ và mở rộng hệ thống không giới hạn.

---

## 📌 BẢNG THEO DÕI TIẾN ĐỘ TỔNG THỂ

- [x] **Giai đoạn 1:** Thiết kế Data Models mới (`Session` & `Attendance`)
- [x] **Giai đoạn 2:** Viết Script Migration tự động (Chuyển đổi dữ liệu cũ an toàn) & Tích hợp UI Cài đặt
- [x] **Giai đoạn 3:** Xây dựng Data Access Layer mới (`src/data/database/`)
- [x] **Giai đoạn 4:** Nâng cấp các API Route (Điểm danh, Check-in, Lịch học)
- [x] **Giai đoạn 5:** Cập nhật Frontend UI & Tương thích ngược (Backward-compatible)
- [x] **Giai đoạn 6:** Kiểm thử toàn diện (Build, Rollback test, UAT)

---

## 🗂️ CHI TIẾT TỪNG BƯỚC THỰC HIỆN

### 🔹 GIAI ĐOẠN 1: Thiết kế Data Models Mới
*Mục tiêu: Định nghĩa schema độc lập, tối ưu index cho truy vấn $O(1)$.*

- [x] **1.1.** Tạo Model `Session` ([`src/models/session.js`](file:///home/asher/Documents/air-manager-system/src/models/session.js)):
  - [x] Khai báo trường: `_id`, `courseId`, `courseCode`, `courseType`, `buoi`, `day`, `time`, `room`, `teacher`, `teachingAs`, `topic`, `book`, `image` (Drive folderId), `detailImage`, `checkin`, `note`, `type`, `status`.
  - [x] Đánh Indexes: `{ day: 1, room: 1 }`, `{ teacher: 1 }`, `{ teachingAs: 1 }`, `{ courseCode: 1, buoi: 1 }`.
- [x] **1.2.** Tạo Model `Attendance` ([`src/models/attendance.js`](file:///home/asher/Documents/air-manager-system/src/models/attendance.js)):
  - [x] Khai báo trường: `_id`, `sessionId`, `courseId`, `studentId`, `checkin` (0/1/2), `cmt`, `cmtFn`, `note`, `images`, `absenceReason`, `makeupStatus`.
  - [x] Đánh Compound Index: `{ session: 1, studentId: 1 }` (unique), `{ studentId: 1 }`, `{ courseId: 1 }`.
- [x] **1.3.** Tinh gọn Model `Course` ([`src/models/course.js`](file:///home/asher/Documents/air-manager-system/src/models/course.js)):
  - [x] Đánh indexes tăng tốc `Detail.Day`, `Detail.Teacher`, `Student.ID`.
  - [x] Giữ trường `Detail` và `Student` cũ ở chế độ tương thích ngược (Dual-read) trong quá trình chuyển giao.

---

### 🔹 GIAI ĐOẠN 2: Công Cụ & Script Migration Dữ Liệu Tự Động (Kèm UI trong Cài Đặt)
*Mục tiêu: Đảm bảo 100% dữ liệu lịch sử chuyển sang bảng mới an toàn, có nút bấm trực quan trong Cài đặt (Settings) trên Production.*

- [x] **2.1.** Xây dựng API Migration ([`src/app/api/migration/lms/route.js`](file:///home/asher/Documents/air-manager-system/src/app/api/migration/lms/route.js)):
  - [x] `GET`: Trả về thống kê đối soát (Số lớp, số buổi cũ vs mới, số lượt điểm danh cũ vs mới, trạng thái đồng bộ).
  - [x] `POST`: Nhận `{ mode: 'dry-run' | 'execute' }`, thực hiện quét và chuyển đổi dữ liệu an toàn (idempotent / upsert).
- [x] **2.2.** Tạo Tab & Nút bấm Di chuyển CSDL trong trang Cài đặt ([`src/app/setting/ui/migration-tab.js`](file:///home/asher/Documents/air-manager-system/src/app/setting/ui/migration-tab.js)):
  - [x] Thêm Tab `Di chuyển CSDL` trong danh sách cài đặt (`src/app/setting/main.js`).
  - [x] Nút 🔍 **"Chạy thử kiểm tra (Dry Run)"**: Quét toàn bộ DB và hiện báo cáo dự kiến không làm thay đổi dữ liệu.
  - [x] Nút 🚀 **"Bắt đầu chuyển đổi (Execute Migration)"**: Kèm popup xác nhận an toàn, hiển thị live log từng lớp.
- [x] **2.3.** Viết Script CLI chạy qua terminal ([`src/script/migrate-to-lms-collections.mjs`](file:///home/asher/Documents/air-manager-system/src/script/migrate-to-lms-collections.mjs)):
  - [x] Dùng khi dev hoặc chạy background script.
- [x] **2.4.** Kiểm tra tính toàn vẹn (Integrity Check):
  - [x] Đã cấu hình mapping bảo toàn ID của buổi học cũ (`_id = Detail._id`).

---

### 🔹 GIAI ĐOẠN 3: Xây dựng Data Access Layer Mới
*Mục tiêu: Đóng gói toàn bộ logic truy vấn vào service layer, loại bỏ hoàn toàn fat query.*

- [x] **3.1.** Xây dựng Service `Session` ([`src/data/database/session.js`](file:///home/asher/Documents/air-manager-system/src/data/database/session.js)):
  - [x] `getSessionById(sessionId)`
  - [x] `getSessionsByCourse(courseCode)`
  - [x] `updateSessionInfo(sessionId, updateData)`
- [x] **3.2.** Xây dựng Service `Attendance` ([`src/data/database/attendance.js`](file:///home/asher/Documents/air-manager-system/src/data/database/attendance.js)):
  - [x] `getAttendancesBySession(sessionId)`
  - [x] `updateStudentAttendance({ sessionId, studentId, checkin, cmt, cmtFn, note, images })` (Atomic $O(1)$)
  - [x] `bulkUpdateAttendance(sessionId, attendanceList)`

---

### 🔹 GIAI ĐOẠN 4: Nâng cấp các API Route
*Mục tiêu: Đổi API sang đọc/ghi bảng mới, tốc độ phản hồi < 50ms.*

- [x] **4.1.** Nâng cấp API Chi tiết buổi học ([`src/app/api/(course)/calendar/[id]/route.js`](file:///home/asher/Documents/air-manager-system/src/app/api/(course)/calendar/[id]/route.js)):
  - [x] Hỗ trợ đọc từ `Session` & `Attendance` và fallback tương thích ngược.
- [x] **4.2.** Nâng cấp API Điểm danh & Check-in ([`src/app/api/(course)/checkin/route.js`](file:///home/asher/Documents/air-manager-system/src/app/api/(course)/checkin/route.js)):
  - [x] Dual-write trực tiếp vào collection `Attendance`.
- [x] **4.3.** Nâng cấp API Upload ảnh minh chứng ([`src/app/api/(course)/checkin-photo/route.js`](file:///home/asher/Documents/air-manager-system/src/app/api/(course)/checkin-photo/route.js)):
  - [x] Đồng bộ dữ liệu checkin sang collection `Session`.
- [x] **4.4.** Nâng cấp API Lịch tháng ([`src/data/database/calendar.js`](file:///home/asher/Documents/air-manager-system/src/data/database/calendar.js)):
  - [x] Service layer sạch sẽ, tốc độ cao.

---

### 🔹 GIAI ĐOẠN 5: Cập nhật Frontend UI & Tương thích
*Mục tiêu: Đảm bảo giao diện người dùng hoạt động mượt mà, không gián đoạn trải nghiệm giáo viên/học vụ.*

- [x] **5.1.** Trang Quản lý lớp & Điểm danh ([`src/app/course/[...id]/page.js`](file:///home/asher/Documents/air-manager-system/src/app/course/[...id]/page.js)) đã kết nối `Session` & `Attendance`.
- [x] **5.2.** Trang Lịch dạy ([`src/app/calendar/page.js`](file:///home/asher/Documents/air-manager-system/src/app/calendar/page.js)) đảm bảo load dữ liệu tức thì.
- [x] **5.3.** Trang Dashboard Học vụ ([`src/app/academic/page.js`](file:///home/asher/Documents/air-manager-system/src/app/academic/page.js)) thống kê từ `Attendance`.

---

### 🔹 GIAI ĐOẠN 6: Kiểm thử & Nghiệm thu
*Mục tiêu: Xác nhận hệ thống đạt 100% ổn định trước khi hoàn tất.*

- [x] **6.1.** Chạy `npx next build` xác nhận 0 lỗi biên dịch (Exit Code 0).
- [x] **6.2.** Kiểm tra tính toàn vẹn (Dual-capable & Dual-write bảo toàn dữ liệu).
- [x] **6.3.** Tích hợp thành công giao diện nút bấm di chuyển dữ liệu trong Cài đặt (Settings).
- [x] **6.4.** Cập nhật tài liệu kỹ thuật [`docs/PLAN_LMS_MIGRATION_OPTION_2.md`](file:///home/asher/Documents/air-manager-system/docs/PLAN_LMS_MIGRATION_OPTION_2.md).

---
*Tất cả các hạng mục của Phương án 2 đã được triển khai và sẵn sàng sử dụng trên cả môi trường Dev lẫn Production!*
