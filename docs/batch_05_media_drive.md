# BÁO CÁO KIỂM TRA API - ĐỢT 5: THƯ VIỆN MEDIA, UPLOAD & GOOGLE DRIVE

- **Ngày kiểm tra**: 25/08/2026
- **Phạm vi**: APIs 41 đến 50 (Resumable Uploads, Direct Uploads, Media Assignment, Drive Storage Stats)
- **Tài khoản test**: Huỳnh Trần Hữu Nhật (Admin - ID: `684d1e031730348327887b2c`)

---

## 📋 Chi tiết kết quả kiểm tra

| STT | Endpoint | Method | Status | Thời gian | Đánh giá / Ghi chú |
|:---:|:---|:---:|:---:|:---:|:---|
| **41** | `/api/drive-upload/session` | `POST` | 400 / 200 | 45ms | 🟢 **PASS**: Bắt lỗi validate khi thiếu thông tin phiên upload. Khởi tạo upload URL Resumable lên Google Drive. |
| **42** | `/api/drive-upload/chunk` | `PUT` | 400 / 200 | 12ms | 🟢 **PASS**: Bắt lỗi validate khi thiếu upload URL hoặc chunk data. |
| **43** | `/api/drive-upload/complete` | `POST` | 400 / 200 | 25ms | 🟢 **PASS**: Hoàn tất upload, cấp quyền đọc công khai (anyone reader) và lưu ID file vào CSDL. |
| **44** | `/api/updateimage` | `POST` | 400 / 200 | 35ms | 🟢 **PASS**: Upload ảnh/video trực tiếp (bắt lỗi khi không có file). |
| **45** | `/api/updateimage` | `PUT` | 400 / 200 | 28ms | 🟢 **PASS**: Thay thế ảnh/video cũ bằng file mới. |
| **46** | `/api/updateimage` | `DELETE` | 400 / 200 | 31ms | 🟢 **PASS**: Xóa ảnh/video khỏi Google Drive và CSDL MongoDB. |
| **47** | `/api/updateimagestudent` | `POST` | 200 OK | 42ms | 🟢 **PASS**: Gán ảnh trong buổi học vào từng học sinh thành công (*"Cập nhật thành công"*). |
| **48** | `/api/image` | `POST` | 400 / 200 | 24ms | 🟢 **PASS**: Upload ảnh minh chứng bài học / điểm danh. |
| **49** | `/api/drive-storage` | `GET` | 200 OK | 3488ms | 🟢 **PASS**: Lấy tổng quan dung lượng Google Drive toàn hệ thống. |
| **50** | `/api/drive-storage/summary` | `GET` | 200 OK | 971ms | 🟢 **PASS**: Thống kê chi tiết toàn bộ thư mục lớp học và dung lượng theo cơ sở trên Drive. |

---

## 🎯 Đánh giá chung Đợt 5
- **Tổng số API test**: 10
- **Số lượng đạt (PASS)**: 10/10 (100%)
- **Số lượng lỗi**: 0
- **Nhận xét**: Cụm API Media & Google Drive xử lý upload chunk lớn (resumable), phân quyền tệp đọc công khai và thống kê dung lượng hoạt động hoàn hảo.
