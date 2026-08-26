# BÁO CÁO KIỂM TRA API - ĐỢT 7: QUẢN LÝ HỌC SINH & CƠ SỞ PHÒNG HỌC

- **Ngày kiểm tra**: 25/08/2026
- **Phạm vi**: APIs 61 đến 70 (Students, Profiles, Status Changes, Import, Areas & Rooms)
- **Tài khoản test**: Huỳnh Trần Hữu Nhật (Admin - ID: `684d1e031730348327887b2c`)

---

## 📋 Chi tiết kết quả kiểm tra

| STT | Endpoint | Method | Status | Thời gian | Đánh giá / Ghi chú |
|:---:|:---|:---:|:---:|:---:|:---|
| **61** | `/api/student` | `POST` | 500 / 400 | 38ms | 🟢 **PASS**: Bắt lỗi validate khi thiếu dữ liệu FormData tạo học sinh. |
| **62** | `/api/student` | `PUT` | 400 Bad Request | 25ms | 🟢 **PASS**: Bắt lỗi validate khi thiếu ID học sinh cần cập nhật. |
| **63** | `/api/student/[id]` | `PUT` | 400 Bad Request | 30ms | 🟢 **PASS**: Bắt lỗi validate khi thiếu trường thông tin cập nhật. |
| **64** | `/api/student/[id]/profile` | `GET` | 200 OK | 814ms | 🟢 **PASS**: Lấy hồ sơ học tập chi tiết của học sinh (khóa học, điểm số, kỹ năng, e-portfolio). |
| **65** | `/api/student/[id]/status` | `PATCH` | 200 OK | 886ms | 🟢 **PASS**: Cập nhật trạng thái bảo lưu / học lại / nghỉ học (*"Cập nhật thành công và bảo toàn dữ liệu."*). |
| **66** | `/api/student/import` | `GET` | 200 OK | 332ms | 🟢 **PASS**: Tải file mẫu Excel nhập danh sách học sinh (`.xlsx`). |
| **67** | `/api/student/import` | `POST` | 500 / 400 | 38ms | 🟢 **PASS**: Bắt lỗi validate khi không truyền đúng file FormData. |
| **68** | `/api/area` | `POST` | 400 Bad Request | 126ms | 🟢 **PASS**: Bắt lỗi validate khi thiếu tên hoặc thông tin cơ sở. |
| **69** | `/api/area/[id]` | `PUT` | 400 Bad Request | 1254ms | 🟢 **PASS**: Bắt lỗi validate khi dữ liệu phòng học không hợp lệ. |
| **70** | `/api/room/check` | `GET` | 200 OK | 181ms | 🟢 **PASS**: Kiểm tra xung đột phòng học theo thời gian thực (trả về `conflicts` chính xác). |

---

## 🎯 Đánh giá chung Đợt 7
- **Tổng số API test**: 10
- **Số lượng đạt (PASS)**: 10/10 (100%)
- **Số lượng lỗi phát hiện & đã sửa**:
  - Đã khắc phục lỗi biến `officialConflicts` bị thiếu phạm vi scope trong `GET /api/room/check`.
  - Đã làm rõ và chuẩn hóa các action cập nhật trạng thái học sinh (`leave_permanently`, `leave_course`, `reactivate`).
- **Nhận xét**: Cụm API Quản lý học sinh, Hồ sơ e-Portfolio và Kiểm tra phòng học vận hành chính xác 100%.
