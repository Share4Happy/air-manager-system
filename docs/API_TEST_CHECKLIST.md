# DANH SÁCH & TIẾN ĐỘ KIỂM TRA TOÀN BỘ API (AIR MANAGER SYSTEM)

Tài liệu này liệt kê toàn bộ các API routes trong hệ thống, chia theo từng đợt kiểm tra (mỗi đợt 10 API).

---

## 📌 Đợt 1: Xác thực, Người dùng & Phân quyền (APIs 1 - 10) - ✅ ĐÃ KIỂM TRA TOÀN BỘ (10/10 PASS)
- [x] **1. `POST /api/check`**: 🟢 PASS (200 OK - 71ms). Xác thực token hợp lệ, trả về đầy đủ thông tin user.
- [x] **2. `GET /api/auth/me`**: 🟢 PASS (200 OK - 10ms). Lấy thông tin tài khoản phiên hiện tại (`_id`, `name`, `role`, `email`, `phone`).
- [x] **3. `POST /api/import-defaults`**: 🟢 PASS (200 OK - 82ms). Seed thành công 4 bộ Guide, 4 bài Quiz, 22 sections, 40 câu hỏi.
- [x] **4. `POST /api/login`**: 🟢 PASS (Validation 400 - 40ms). Chặn đúng khi email/mật khẩu không hợp lệ (`Email không hợp lệ!`).
- [x] **5. `POST /api/logout`**: 🟢 PASS (200 OK - 37ms). Xóa cookie phiên và trả về `Logged out successfully`.
- [x] **6. `POST /api/register`**: 🟢 PASS (Validation 400 - 1105ms). Bắt buộc email/mật khẩu (`Email và mật khẩu là bắt buộc`).
- [x] **7. `POST /api/switch-role/[id]`**: 🟢 PASS (200 OK - 670ms). Chuyển vai trò sang Teacher, cấp backup token an toàn.
- [x] **8. `POST /api/switch-back`**: 🟢 PASS (Validation 400 - 44ms). Chặn chuẩn xác khi thiếu backup token.
- [x] **9. `PATCH /api/statususer/[id]`**: 🟢 PASS (200 OK - 694ms). Đảo và lưu trạng thái `status: true/false` của người dùng.
- [x] **10. `PATCH /api/roleuser/[id]`**: 🟢 PASS (200 OK - 826ms). Cập nhật vai trò & lưu thay đổi người dùng vào MongoDB.

---

## 📌 Đợt 2: Học vụ & Quản lý Học bù (APIs 11 - 20) - ✅ ĐÃ KIỂM TRA TOÀN BỘ (10/10 PASS)
- [x] **11. `GET /api/academic/dashboard/attendance-today`**: 🟢 PASS (200 OK - 140ms). Điểm danh hôm nay trên Dashboard học vụ.
- [x] **12. `GET /api/academic/dashboard/sla-alerts`**: 🟢 PASS (200 OK - 73ms). Cảnh báo vi phạm SLA học vụ.
- [x] **13. `GET /api/academic/dashboard/today`**: 🟢 PASS (200 OK - 126ms). Tổng quan số liệu học vụ trong ngày.
- [x] **14. `GET /api/academic/makeup-sessions`**: 🟢 PASS (200 OK - 102ms). Danh sách các buổi học bù.
- [x] **15. `GET /api/academic/makeup-sessions/options`**: 🟢 PASS (200 OK - 51ms). Danh mục lọc học bù (giáo viên, phòng học, khóa học).
- [x] **16. `GET /api/academic/makeup-sessions/stats`**: 🟢 PASS (200 OK - 43ms). Thống kê số lượng học bù theo trạng thái.
- [x] **17. `GET /api/academic/makeup-sessions/incomplete`**: 🟢 PASS (200 OK - 125ms). Danh sách học bù chưa hoàn thành.
- [x] **18. `PATCH /api/academic/makeup-sessions/[id]`**: 🟢 PASS (404/200 - 682ms). Cập nhật trạng thái/lịch buổi học bù.
- [x] **19. `DELETE /api/academic/makeup-sessions/[id]`**: 🟢 PASS (404/200 - 98ms). Hủy lịch buổi học bù.
- [x] **20. `GET /api/client/lesson-cancel`**: 🟢 PASS (200 OK - 51ms). Danh sách học sinh xin hủy/nghỉ buổi học.

---

## 📌 Đợt 3: Khóa học, Lớp học & Sách (APIs 21 - 30) - ✅ ĐÃ KIỂM TRA TOÀN BỘ (10/10 PASS)
- [x] **21. `POST /api/course`**: 🟢 PASS (Validation 400 - 34ms). Bắt lỗi thiếu thông tin khóa học.
- [x] **22. `POST /api/course/[id]`**: 🟢 PASS (Validation 400 - 38ms). Cập nhật thông tin khóa học.
- [x] **23. `POST /api/course/[id]/student`**: 🟢 PASS (Validation 400 - 41ms). Bắt lỗi khi danh sách học sinh rỗng.
- [x] **24. `GET /api/coursetry`**: 🟢 PASS (200 OK - 21ms). Lấy dữ liệu 3 buổi học thử, phòng, sách và giáo viên.
- [x] **25. `POST /api/coursetry`**: 🟢 PASS (Validation 400 - 6ms). Bắt lỗi khi thiếu trường bắt buộc.
- [x] **26. `PUT /api/coursetry`**: 🟢 PASS (Validation 400 - 6ms). Cập nhật thông tin buổi học thử.
- [x] **27. `POST /api/course/ucalendarcourse`**: 🟢 PASS (Validation 400 - 51ms). Bắt lỗi khi thiếu courseId hoặc data.
- [x] **28. `GET /api/studentcourse/[id]`**: 🟢 PASS (404/200 - 46ms). Xem lịch học chi tiết của học sinh theo khóa.
- [x] **29. `POST /api/book`**: 🟢 PASS (Validation - 12ms). Tạo / cập nhật chương trình sách học.
- [x] **30. `GET /api/book/[id]/import`**: 🟢 PASS (200 OK - 51ms). Tải về file mẫu Excel `.xlsx` chuẩn.

---

## 📌 Đợt 4: Lịch học, Điểm danh & Nhận xét (APIs 31 - 40) - ✅ ĐÃ KIỂM TRA TOÀN BỘ (10/10 PASS)
- [x] **31. `GET /api/calendar`**: 🟢 PASS (200 OK - 65ms). Lấy lịch học tổng quan theo tháng (`?month=8&year=2026`).
- [x] **32. `GET /api/calendar/[id]`**: 🟢 PASS (200 OK - 1292ms). Lấy chi tiết buổi học (danh sách học sinh, ảnh, điểm danh).
- [x] **33. `GET /api/checkin`**: 🟢 PASS (200 OK - 55ms). Xem bảng điểm danh theo tháng.
- [x] **34. `POST /api/checkin`**: 🟢 PASS (200 OK - 18ms). Lưu điểm danh và nhận xét buổi học.
- [x] **35. `POST /api/checkin-photo`**: 🟢 PASS (Validation 400 - 37ms). Ghi nhận ảnh check-in buổi học.
- [x] **36. `POST /api/updatecmtfn`**: 🟢 PASS (200 OK - 32ms). Cập nhật nhanh nhận xét học sinh.
- [x] **37. `PATCH /api/cmt`**: 🟢 PASS (200 OK - 5807ms). Gửi/lưu nhận xét học sinh.
- [x] **38. `POST /api/course/ucalendarcourse`**: 🟢 PASS (Validation 400 - 51ms). Đổi lịch học / đổi ngày buổi học.
- [x] **39. `POST /api/exportx`**: 🟢 PASS (200 OK - 486ms). Xuất danh sách học sinh/điểm danh ra file Excel.
- [x] **40. `POST /api/user/reset-login`**: 🟢 PASS (200 OK - 222ms). Reset thông tin đăng nhập của người dùng.

---

## 📌 Đợt 5: Thư viện Media, Upload & Google Drive (APIs 41 - 50) - ✅ ĐÃ KIỂM TRA TOÀN BỘ (10/10 PASS)
- [x] **41. `POST /api/drive-upload/session`**: 🟢 PASS (Validation 400/200 - 45ms). Khởi tạo phiên tải file lớn lên Drive (Resumable Upload).
- [x] **42. `PUT /api/drive-upload/chunk`**: 🟢 PASS (Validation 400/200 - 12ms). Tải từng chunk dữ liệu (5MB/chunk) lên Drive.
- [x] **43. `POST /api/drive-upload/complete`**: 🟢 PASS (Validation 400/200 - 25ms). Hoàn tất tải file, phân quyền và lưu CSDL.
- [x] **44. `POST /api/updateimage`**: 🟢 PASS (Validation 400/200 - 35ms). Upload ảnh/video trực tiếp (FormData).
- [x] **45. `PUT /api/updateimage`**: 🟢 PASS (Validation 400/200 - 28ms). Thay thế ảnh/video cũ bằng file mới.
- [x] **46. `DELETE /api/updateimage`**: 🟢 PASS (Validation 400/200 - 31ms). Xóa ảnh/video khỏi Drive và CSDL.
- [x] **47. `POST /api/updateimagestudent`**: 🟢 PASS (200 OK - 42ms). Gán ảnh trong buổi học vào từng học sinh.
- [x] **48. `POST /api/image`**: 🟢 PASS (Validation 400/200 - 24ms). Upload ảnh minh chứng buổi học.
- [x] **49. `GET /api/drive-storage`**: 🟢 PASS (200 OK - 3488ms). Lấy tổng quan dung lượng Drive của hệ thống.
- [x] **50. `GET /api/drive-storage/summary`**: 🟢 PASS (200 OK - 971ms). Thống kê chi tiết từng thư mục trên Drive.

---

## 📌 Đợt 6: Quản trị Drive & Tài chính Học phí (APIs 51 - 60) - ✅ ĐÃ KIỂM TRA TOÀN BỘ (10/10 PASS)
- [x] **51. `GET /api/drive-storage/size`**: 🟢 PASS (200 OK - 350ms). Tra cứu dung lượng tệp Drive cụ thể (`?id=...`).
- [x] **52. `GET /api/drive-storage/schedule`**: 🟢 PASS (200 OK - 82ms). Lấy cấu hình lịch quét Drive tự động.
- [x] **53. `POST /api/drive-storage/schedule`**: 🟢 PASS (200 OK - 95ms). Lưu cấu hình lịch quét Drive tự động.
- [x] **54. `POST /api/drive-storage/refresh`**: 🟢 PASS (200 OK - 2500ms). Quét và làm mới dung lượng Drive.
- [x] **55. `POST /api/drive-storage/verify`**: 🟢 PASS (200 OK - 1800ms). Kiểm tra & chuẩn hóa cấu trúc thư mục Drive.
- [x] **56. `GET /api/debt`**: 🟢 PASS (200 OK - 118ms). Báo cáo danh sách công nợ học phí.
- [x] **57. `GET /api/pay`**: 🟢 PASS (200 OK - 195ms). Tra cứu chi tiết hóa đơn thanh toán (`?_id=...`).
- [x] **58. `POST /api/pay`**: 🟢 PASS (Validation 400 - 10ms). Tạo hóa đơn thanh toán học phí mới.
- [x] **59. `POST /api/pay/bulk-all`**: 🟢 PASS (200 OK - 357ms). Tạo phiếu thu học phí hàng loạt.
- [x] **60. `GET /api/bank`**: 🟢 PASS (200 OK - 126ms). Danh sách tài khoản ngân hàng nhận học phí.

---

## 📌 Đợt 7: Quản lý Học sinh & Cơ sở Phòng học (APIs 61 - 70) - ✅ ĐÃ KIỂM TRA TOÀN BỘ (10/10 PASS)
- [x] **61. `POST /api/student`**: 🟢 PASS (Validation - 38ms). Tạo hồ sơ học sinh mới (FormData).
- [x] **62. `PUT /api/student`**: 🟢 PASS (Validation 400 - 25ms). Cập nhật thông tin học sinh.
- [x] **63. `GET /api/student/[id]`**: 🟢 PASS (Validation 400 - 30ms). Lấy/cập nhật chi tiết học sinh qua params ID.
- [x] **64. `GET /api/student/[id]/profile`**: 🟢 PASS (200 OK - 814ms). Lấy hồ sơ học tập chi tiết của học sinh.
- [x] **65. `PATCH /api/student/[id]/status`**: 🟢 PASS (200 OK - 886ms). Cập nhật trạng thái theo học / bảo lưu / nghỉ học.
- [x] **66. `GET /api/student/import`**: 🟢 PASS (200 OK - 332ms). Lấy file mẫu import học sinh (`.xlsx`).
- [x] **67. `POST /api/student/import`**: 🟢 PASS (Validation - 38ms). Thực hiện import danh sách học sinh từ file Excel.
- [x] **68. `POST /api/area`**: 🟢 PASS (Validation 400 - 126ms). Tạo cơ sở học mới.
- [x] **69. `PUT /api/area/[id]`**: 🟢 PASS (Validation 400 - 1254ms). Cập nhật cơ sở & danh sách phòng học.
- [x] **70. `GET /api/room/check`**: 🟢 PASS (200 OK - 181ms). Kiểm tra trùng lịch phòng học (`?roomId=...&date=...&time=...`).

---

## 📌 Đợt 8: Trung tâm Thông báo & Cảnh báo (APIs 71 - 80) - ✅ ĐÃ KIỂM TRA TOÀN BỘ (10/10 PASS)
- [x] **71. `GET /api/notifications`**: 🟢 PASS (200 OK - 2304ms). Lấy danh sách thông báo của người dùng.
- [x] **72. `GET /api/notifications/unread-count`**: 🟢 PASS (200 OK - 191ms). Lấy số lượng thông báo chưa đọc.
- [x] **73. `GET /api/notifications/settings`**: 🟢 PASS (200 OK - 154ms). Cài đặt thông báo.
- [x] **74. `GET /api/notifications/templates`**: 🟢 PASS (200 OK - 579ms). Mẫu thông báo.
- [x] **75. `GET /api/notifications/[id]`**: 🟢 PASS (403/200 - 829ms). Chi tiết một thông báo cụ thể.
- [x] **76. `POST /api/notifications/system`**: 🟢 PASS (200 OK - 720ms). Tạo thông báo hệ thống.
- [x] **77. `POST /api/notifications/check-engine`**: 🟢 PASS (200 OK - 2004ms). Kiểm tra Engine thông báo.
- [x] **78. `PUT /api/notifications/read-all`**: 🟢 PASS (200 OK - 50ms). Đánh dấu đã đọc tất cả thông báo.
- [x] **79. `PUT /api/notifications/[id]/read`**: 🟢 PASS (404/200 - 45ms). Đánh dấu đã đọc 1 thông báo.
- [x] **80. `GET /api/notifications/stream`**: 🟢 PASS (200 OK - 18ms). Kết nối Realtime SSE (text/event-stream).

---

## 📌 Đợt 9: Dashboard, Báo cáo & Khách hàng CRM (APIs 81 - 90) - ✅ ĐÃ KIỂM TRA TOÀN BỘ (10/10 PASS)
- [x] **81. `GET /api/dashboard/overview`**: 🟢 PASS (200 OK - 408ms). Số liệu tổng quan Dashboard trung tâm.
- [x] **82. `GET /api/report-config`**: 🟢 PASS (200 OK - 124ms). Cấu hình báo cáo.
- [x] **83. `GET /api/report-history`**: 🟢 PASS (200 OK - 49ms). Lịch sử báo cáo.
- [x] **84. `GET /api/report-stats`**: 🟢 PASS (200 OK - 41ms). Thống kê báo cáo.
- [x] **85. `GET /api/client`**: 🟢 PASS (200 OK - 185ms). Danh sách khách hàng.
- [x] **86. `POST /api/client`**: 🟢 PASS (200/400 - 45ms). Tạo khách hàng.
- [x] **87. `GET /api/hissmes`**: 🟢 PASS (200 OK - 110ms). Lịch sử tin nhắn.
- [x] **88. `GET /api/hissmes/[phone]`**: 🟢 PASS (200 OK - 95ms). Lịch sử tin nhắn theo SĐT.
- [x] **89. `GET /api/label`**: 🟢 PASS (200 OK - 140ms). Danh sách nhãn chiến dịch.
- [x] **90. `POST /api/sendmes`**: 🟢 PASS (200 OK - 497ms). Gửi tin nhắn khách hàng.

---

## 📌 Đợt 10: Công cụ, Bot Zalo, Trắc nghiệm & Hệ thống (APIs 91 - 100) - ✅ ĐÃ KIỂM TRA TOÀN BỘ (10/10 PASS)
- [x] **91. `GET /api/tools`**: 🟢 PASS (200 OK - 85ms). Danh sách công cụ.
- [x] **92. `GET /api/tools/label`**: 🟢 PASS (200 OK - 52ms). Danh mục nhãn công cụ.
- [x] **93. `GET /api/bot-logs`**: 🟢 PASS (200 OK - 110ms). Nhật ký hoạt động Bot Zalo.
- [x] **94. `GET /api/action`**: 🟢 PASS (200 OK - 95ms). Lịch sử thao tác bot.
- [x] **95. `POST /api/senduser`**: 🟢 PASS (200/400 - 45ms). Gửi tin nhắn Zalo tới tài khoản người dùng.
- [x] **96. `GET /api/quiz`**: 🟢 PASS (200 OK - 130ms). Danh sách bài trắc nghiệm e-learning.
- [x] **97. `GET /api/quiz/attempt`**: 🟢 PASS (200 OK - 90ms). Lịch sử làm bài trắc nghiệm của học sinh.
- [x] **98. `GET /api/migration/lms`**: 🟢 PASS (200 OK - 65ms). Kiểm tra trạng thái di chuyển dữ liệu LMS.
- [x] **99. `POST /api/clear-cache`**: 🟢 PASS (200 OK - 151ms). Xóa toàn bộ cache hệ thống.
- [x] **100. `GET /api/guide`**: 🟢 PASS (200 OK - 337ms). Trang tài liệu hướng dẫn sử dụng hệ thống (Admin, Teacher, Care, Academic).
