# Report: Makeup & Tools

## 1. Trang Quản lý học bù (`/academic/makeup`)

### Giao diện 3 tab
- **Cần bù**: danh sách phiên bù pending/required/scheduled, có filter trạng thái, nút "+ Tạo yêu cầu học bù" dạng popup modal
- **Khóa cần bù**: khóa đã kết thúc (`Status: true`) nhưng học sinh còn thiếu buổi (`Checkin = 0` hoặc không có Learn entry). Hiển thị dạng accordion: khóa → học sinh → danh sách buổi thiếu (Ngày, Giờ, Chủ đề). Có ô tìm kiếm + nút "Xem khóa học"
- **Lịch sử bù**: các phiên bù completed/absent/expired/cancelled, có filter trạng thái

### API
- `GET /api/academic/makeup-sessions` — thêm `scope=need` (lọc pending/required/scheduled) và `scope=history` (lọc completed/absent/expired/cancelled)
- `GET /api/academic/makeup-sessions/incomplete` — API mới: query course `Status: true`, so sánh `Detail` với `Student.Learn`, trả về các khóa còn thiếu buổi (có search `q`)

## 2. Công cụ (`/tools`)

### Authorization
- Xóa check role `Admin`/`Manager` khỏi tất cả route tools (POST, PUT, DELETE label, DELETE tool) — tất cả user đều có quyền

### Sort
- Tools sắp xếp theo `createdAt: -1` (mới nhất lên đầu)

### UI
- Thu nhỏ thanh tìm kiếm (`w-48` thay vì `flex-1`)
- Form thêm/sửa công cụ thành popup modal (có sẵn)
