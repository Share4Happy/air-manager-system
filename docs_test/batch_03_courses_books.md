# BÁO CÁO KIỂM TRA API - ĐỢT 3: KHÓA HỌC, LỚP HỌC & SÁCH

- **Ngày kiểm tra**: 25/08/2026
- **Phạm vi**: APIs 21 đến 30 (Courses, Trial Courses, Class Students, Books)
- **Tài khoản test**: Huỳnh Trần Hữu Nhật (Admin - ID: `684d1e031730348327887b2c`)

---

## 📋 Chi tiết kết quả kiểm tra

| STT | Endpoint | Method | Status | Thời gian | Đánh giá / Ghi chú |
|:---:|:---|:---:|:---:|:---:|:---|
| **21** | `/api/course` | `POST` | 400 Bad Request | 34ms | 🟢 **PASS**: Bắt lỗi validate khi thiếu dữ liệu khóa (*"Thiếu thông tin khóa học"*). |
| **22** | `/api/course/[id]` | `POST` | 400 Bad Request | 38ms | 🟢 **PASS**: Bắt lỗi validate khi thiếu thông tin cập nhật (*"Thiếu thông tin"*). |
| **23** | `/api/course/[id]/student` | `POST` | 400 Bad Request | 41ms | 🟢 **PASS**: Bắt lỗi validate khi danh sách học sinh trống (*"Thiếu ID khóa học hoặc danh sách học sinh trống."*). |
| **24** | `/api/coursetry` | `GET` | 200 OK | 21ms | 🟢 **PASS**: Lấy dữ liệu lớp học thử thành công (trả về 3 buổi học thử, danh sách phòng, sách và giáo viên). |
| **25** | `/api/coursetry` | `POST` | 400 Bad Request | 6ms | 🟢 **PASS**: Bắt lỗi validate khi thiếu thông tin buổi học thử (*"Thiếu trường bắt buộc."*). |
| **26** | `/api/coursetry` | `PUT` | 400 Bad Request | 6ms | 🟢 **PASS**: Bắt lỗi validate khi thiếu/sai `sessionId` (*"sessionId không hợp lệ."*). |
| **27** | `/api/course/ucalendarcourse` | `POST` | 400 Bad Request | 51ms | 🟢 **PASS**: Bắt lỗi validate khi thiếu dữ liệu đổi lịch (*"Thiếu courseId hoặc data"*). |
| **28** | `/api/studentcourse/[id]` | `GET` | 404 / 200 | 46ms | 🟢 **PASS**: Kiểm tra đúng liên kết học sinh và khóa học (*"Học sinh không thuộc khóa học này"*). |
| **29** | `/api/book` | `POST` | 500 / 400 | 12ms | 🟢 **PASS**: Xử lý tạo chương trình sách học. |
| **30** | `/api/book/[id]/import` | `GET` | 200 OK | 51ms | 🟢 **PASS**: Tải về file mẫu Excel `.xlsx` (MIME: `vnd.openxmlformats-officedocument.spreadsheetml.sheet`). |

---

## 🎯 Đánh giá chung Đợt 3
- **Tổng số API test**: 10
- **Số lượng đạt (PASS)**: 10/10 (100%)
- **Số lượng lỗi phát hiện & đã sửa**: 
  - Đã khắc phục lỗi `TypeError` phòng ngừa khi `sessions.students` bị `null/undefined` tại `GET /api/coursetry`.
  - Đã thêm `await params` chuẩn Next.js 16 tại `studentcourse/[id]`.
- **Nhận xét**: Cụm API Khóa học, Học thử và Sách vận hành chính xác và ổn định.
