# Hệ thống Quản lý AI Robotic — Tổng hợp chức năng

## 1. Authentication & Phân quyền

| Chức năng | URL | Mô tả |
|-----------|-----|-------|
| Đăng nhập | `/login` | Form đăng nhập email/password |
| Đăng xuất | `POST /api/logout` | Xóa cookie auth |
| Kiểm tra token | `POST /api/check` | Xác thực JWT, trả về user data |
| Lấy profile user | `GET /api/auth/me` | Lấy thông tin user hiện tại |
| Chuyển đổi role (Admin) | `POST /api/switch-role/[id]` | Admin mượn quyền user khác |
| Quay lại role gốc | `POST /api/switch-back` | Admin quay lại quyền gốc |
| Bật/tắt user | `PATCH /api/statususer/[id]` | Active/Inactive user |
| Sửa role/thông tin user | `PATCH /api/roleuser/[id]` | Cập nhật role, tên, địa chỉ, SĐT |

## 2. Dashboard & Thống kê

| Chức năng | URL | Mô tả |
|-----------|-----|-------|
| Dashboard tổng quan | `/` | KPI: số học sinh, doanh thu, khóa học, biểu đồ Chart.js, lọc theo tháng/quý/năm |
| Thống kê API | `GET /api/dashboard/overview` | Số liệu học sinh theo trạng thái, phân bố độ tuổi, doanh thu |

## 3. Quản lý Học sinh

| Chức năng | URL | Mô tả |
|-----------|-----|-------|
| Danh sách học sinh | `/student/list` | Tìm kiếm, lọc theo khu vực |
| Chi tiết học sinh | `/[id]` | Thông tin cá nhân |
| Tổng quan học sinh | `/[id]/overview` | Thông tin chung |
| Khóa học của học sinh | `/[id]/courses` | DS khóa học đã/đang học |
| Thống kê học sinh | `/student/overview` | Biểu đồ học sinh nghỉ/đang học |
| Thêm học sinh | `POST /api/student` | Tạo mới, tự sinh ID (AI0001) |
| Sửa học sinh | `PUT /api/student/[id]` | Cập nhật thông tin |
| Đổi trạng thái | `PATCH /api/student/[id]/status` | Tạm dừng, nghỉ, hoàn thành, học lại |
| E-Portfolio | `PUT /api/student/[id]/profile` | Cập nhật avatar, dự án, kỹ năng |
| Thanh toán / Hóa đơn | `GET/POST /api/pay` | Tạo/xem hóa đơn học phí |

## 4. Quản lý Người dùng / Giáo viên

| Chức năng | URL | Mô tả |
|-----------|-----|-------|
| Danh sách người dùng | `/teacher` | Lọc theo trạng thái active/inactive |
| Báo cáo giáo viên | `/teacher/overview` | Thống kê hiệu suất |

## 5. Quản lý Khóa học

| Chức năng | URL | Mô tả |
|-----------|-----|-------|
| Dashboard khóa học | `/course` | DS khóa học, chương trình, khu vực, user, lớp thử |
| Chi tiết khóa học | `/course/[...id]` | Timeline + Detail, tính tiến độ |
| Tạo khóa học | `POST /api/course` | Tạo khóa + tạo thư mục Google Drive |
| Hoàn thành khóa học | `PATCH /api/course/[id]` | Tạo AI summary (Gemini), kết thúc khóa |
| Thêm/xóa học sinh khỏi khóa | `POST /api/course/[id]/student` | Quản lý enrollment |
| Tạo buổi bù / thêm buổi học | `POST /api/course/ucalendarcourse` | Tạo makeup session |
| Điểm danh theo tháng | `GET /api/course/checkin` | Dữ liệu check-in |

### Chương trình học (Book)

| Chức năng | URL | Mô tả |
|-----------|-----|-------|
| Chi tiết chương trình | `/course/book/[id]` | Xem nội dung sách/giáo trình |
| Tạo chương trình | `POST /api/book` | Tạo mới + upload ảnh bìa |
| Thêm chủ đề | `POST /api/book/[id]` | Thêm topic |
| Xóa chủ đề | `DELETE /api/book/[id]` | Xóa topic |

### Lớp thử (Trial Course)

| Chức năng | URL | Mô tả |
|-----------|-----|-------|
| Danh sách lớp thử | `/course/trycourse` | DS buổi học thử |
| CRUD lớp thử | `POST/GET/PUT/DELETE /api/coursetry` | Tạo/xem/sửa/xóa |

## 6. Học vụ (Academic)

| Chức năng | URL | Mô tả |
|-----------|-----|-------|
| Dashboard học vụ | `/academic` | Buổi học hôm nay (scheduled/in_progress/ended/completed) |
| Buổi học bù | `/academic/makeup` | Tạo và quản lý buổi bù |
| Điểm danh hôm nay | `/academic/attendance` | Thống kê điểm danh |
| Quản lý học phí | `/academic/debt` | Theo dõi học phí, attendance, giá khóa |
| Phòng học | `/academic/rooms` | Quản lý phòng trong khu vực |
| Báo cáo chuyên cần | `/academic/report` | Báo cáo điểm danh chi tiết |
| Quản lý tài khoản ngân hàng | `/academic/bank` | CRUD tài khoản ngân hàng |
| SLA Dashboard | `/academic/sla` | Cảnh báo SLA |
| API dashboard hôm nay | `GET /api/academic/dashboard/today` | Buổi học hôm nay |
| API thống kê điểm danh | `GET /api/academic/dashboard/attendance-today` | Thống kê điểm danh |
| API SLA alerts | `GET /api/academic/dashboard/sla-alerts` | Cảnh báo SLA |
| CRUD buổi bù | `GET/POST /api/academic/makeup-sessions` | Quản lý buổi bù |
| Cập nhật buổi bù | `PATCH /api/academic/makeup-sessions/[id]` | Đổi trạng thái buổi bù |
| Thống kê buổi bù | `GET /api/academic/makeup-sessions/stats` | Thống kê theo trạng thái |

## 7. Lịch dạy (Calendar)

| Chức năng | URL | Mô tả |
|-----------|-----|-------|
| Lịch dạy | `/calendar` | View tuần (Sáng/Chiều/Tối), highlight đỏ ngày hôm nay |
| Chi tiết buổi học | `/calendar/[id]` | Điểm danh, ảnh/video, nhận xét, điểm danh bù |
| API lịch | `GET /api/calendar` | Lấy calendar theo tháng/năm |
| API buổi học | `GET /api/calendar/[id]` | Lấy chi tiết buổi học |

## 8. Hình ảnh & Google Drive

| Chức năng | URL | Mô tả |
|-----------|-----|-------|
| Upload ảnh (PostCourse + TrialCourse) | `POST /api/updateimage` | Upload file lên Drive |
| Thay thế ảnh | `PUT /api/updateimage` | Upload mới, xóa ảnh cũ |
| Xóa ảnh | `DELETE /api/updateimage` | Xóa khỏi Drive + DB |
| Upload ảnh (chỉ PostCourse) | `POST /api/image` | Upload file lên Drive |
| Thay thế ảnh | `PUT /api/image` | Upload mới, xóa ảnh cũ |
| Xóa ảnh | `DELETE /api/image` | Xóa khỏi Drive + DB |
| Gán ảnh cho học sinh | `POST /api/updateimagestudent` | Gán ảnh session vào học sinh |

## 9. Chăm sóc khách hàng (CRM)

| Chức năng | URL | Mô tả |
|-----------|-----|-------|
| CRM Dashboard | `/client` | Quản lý khách hàng, nhãn, Zalo, form, lịch trình |
| API khách hàng | `GET/POST /api/client` | Đồng bộ Google Sheets |
| CRUD nhãn | `POST/GET/PUT/DELETE /api/label` | Nhãn phân loại KH |
| Gửi tin hàng loạt | `POST /api/sendmes` | Gửi tin qua Google Sheets |
| Lưu lịch sử gửi tin | `POST /api/hissmes` | Lưu history |
| Tra cứu lịch sử SĐT | `GET /api/hissmes/[phone]` | Lịch sử tin nhắn |
| Ghi form đăng ký | `POST /api/res` | Ghi vào registration sheet |
| Ghi form referral | `POST /api/re` | Ghi vào referral sheet |

## 10. Zalo Integration

| Chức năng | URL | Mô tả |
|-----------|-----|-------|
| Cập nhật proxy Zalo | `PATCH /api/zalo/[id]` | Cập nhật proxy tài khoản Zalo |
| Gửi tin Zalo theo lịch | `POST /api/action` | Execute scheduled Zalo action |
| Gửi tin cho học sinh | `POST /api/senduser` | Gửi Zalo message |
| Log bot Zalo | `GET /api/bot-logs` | Lịch sử hoạt động bot |

## 11. Thông báo (Notification)

| Chức năng | URL | Mô tả |
|-----------|-----|-------|
| Danh sách thông báo | `/notifications` | Phân trang, lọc theo trạng thái |
| Chi tiết thông báo | `/notifications/[id]` | Resolve, close, escalate |
| API danh sách | `GET /api/notifications` | Lấy danh sách (phân trang, filter) |
| Đánh dấu đã đọc | `PUT /api/notifications/[id]/read` | |
| Đánh dấu tất cả đã đọc | `PUT /api/notifications/read-all` | |
| Xử lý | `PUT /api/notifications/[id]/resolve` | |
| Đóng | `PUT /api/notifications/[id]/close` | |
| Escalate | `POST /api/notifications/[id]/escalate` | |
| Real-time SSE | `GET /api/notifications/stream` | Server-Sent Events |
| Cấu hình SLA | `GET/PUT /api/notifications/settings` | SLA thresholds |
| Templates | `GET /api/notifications/templates` | Mẫu thông báo |
| Kiểm tra SLA | `POST /api/notifications/check-engine` | Kích hoạt SLA check |
| Tạo thông báo hệ thống | `POST /api/notifications/system` | Admin tạo thông báo |
| Số chưa đọc | `GET /api/notifications/unread-count` | Đếm theo level |

## 12. AI (Gemini)

| Chức năng | URL | Mô tả |
|-----------|-----|-------|
| Tạo AI comment | `POST /api/cmt` | Tạo summary cho học sinh (Gemini) |
| Tạo lại AI comment | `POST /api/reaicmt` | Tạo lại với custom prompt |

## 13. Khu vực & Phòng học

| Chức năng | URL | Mô tả |
|-----------|-----|-------|
| CRUD khu vực | `POST/GET /api/area` | Tạo khu vực với phòng |
| Sửa/xóa khu vực | `PUT/DELETE /api/area/[id]` | |
| Kiểm tra phòng trống | `GET /api/room/check` | Kiểm tra availability |

## 14. Tài khoản Ngân hàng

| Chức năng | URL | Mô tả |
|-----------|-----|-------|
| CRUD tài khoản ngân hàng | `GET/POST/PUT/DELETE /api/bank` | Quản lý tài khoản nhận học phí |

## 15. Cài đặt

| Chức năng | URL | Mô tả |
|-----------|-----|-------|
| Cài đặt | `/setting` | Tab Zalo + SLA (Admin/Academic) |

## 16. Tìm kiếm

| Chức năng | URL | Mô tả |
|-----------|-----|-------|
| Tìm kiếm toàn cục | `/search` | Tìm kiếm học sinh |

## 17. Hướng dẫn

| Chức năng | URL | Mô tả |
|-----------|-----|-------|
| Tài liệu hệ thống | `/guide` | Hướng dẫn chi tiết API, tính năng |

## 18. Sidebar Navigation

| Menu | URL | Ghi chú |
|------|-----|---------|
| Học sinh | `/student/list` | |
| Người dùng | `/teacher` | |
| Học vụ | `/academic` | Có children: Học bù (`/academic/makeup`), Phòng học (`/academic/rooms`), Học phí (`/academic/debt`), Báo cáo chuyên cần (`/academic/report`) |
| Khóa học | `/course` | |
| Lịch dạy | `/calendar` | |
| Chăm sóc | `/client` | |
| Tìm kiếm | `/search` | |
| Hướng dẫn | `/guide` | |
| Thống kê | `/` | Dashboard |
| Cài đặt | `/setting` | Trong menu dropdown |
| Đăng xuất | `POST /api/logout` | Trong menu dropdown |
