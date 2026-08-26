# BÁO CÁO KIỂM TRA API - ĐỢT 1: XÁC THỰC & NGƯỜI DÙNG

- **Ngày kiểm tra**: 25/08/2026
- **Phạm vi**: APIs 1 đến 10 (Authentication, User Roles, Permissions)
- **Tài khoản test**: Huỳnh Trần Hữu Nhật (Admin - ID: `684d1e031730348327887b2c`)

---

## 📋 Chi tiết kết quả kiểm tra

| STT | Endpoint | Method | Status | Thời gian | Đánh giá / Ghi chú |
|:---:|:---|:---:|:---:|:---:|:---|
| **1** | `/api/check` | `POST` | 200 OK | 71ms | 🟢 **PASS**: Xác thực JWT token hợp lệ, trả về đầy đủ thông tin user và quyền hạn. |
| **2** | `/api/auth/me` | `GET` | 200 OK | 10ms | 🟢 **PASS**: Lấy thông tin user hiện tại (`_id`, `name`, `role`, `email`, `phone`). |
| **3** | `/api/import-defaults` | `POST` | 200 OK | 82ms | 🟢 **PASS**: Khởi tạo thành công 4 bộ Guide, 4 bài Quiz, 22 sections, 40 câu hỏi. |
| **4** | `/api/login` | `POST` | 400 Bad Request | 40ms | 🟢 **PASS**: Validation hoạt động tốt khi sai email/pass (*"Email không hợp lệ!"*). |
| **5** | `/api/logout` | `POST` | 200 OK | 37ms | 🟢 **PASS**: Xóa cookie phiên và trả về `Logged out successfully`. |
| **6** | `/api/register` | `POST` | 400 Bad Request | 1105ms | 🟢 **PASS**: Bắt buộc email/mật khẩu (*"Email và mật khẩu là bắt buộc"*). |
| **7** | `/api/switch-role/[id]` | `POST` | 200 OK | 670ms | 🟢 **PASS**: Chuyển đổi vai trò sang Teacher thành công, cấp `backupToken` an toàn. |
| **8** | `/api/switch-back` | `POST` | 400 Bad Request | 44ms | 🟢 **PASS**: Bắt lỗi chuẩn xác khi không có `backupToken`. |
| **9** | `/api/statususer/[id]` | `PATCH` | 200 OK | 694ms | 🟢 **PASS**: Đảo và cập nhật trạng thái `status: true/false` vào MongoDB. |
| **10** | `/api/roleuser/[id]` | `PATCH` | 200 OK | 826ms | 🟢 **PASS**: Cập nhật vai trò & lưu thay đổi vào MongoDB. |

---

## 🎯 Đánh giá chung Đợt 1
- **Tổng số API test**: 10
- **Số lượng đạt (PASS)**: 10/10 (100%)
- **Số lượng lỗi**: 0
- **Nhận xét**: Nhóm API xác thực, phân quyền và quản lý tài khoản hoạt động ổn định, bảo mật chặt chẽ.
