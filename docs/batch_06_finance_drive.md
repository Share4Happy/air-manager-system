# BÁO CÁO KIỂM TRA API - ĐỢT 6: QUẢN TRỊ DRIVE & TÀI CHÍNH HỌC PHÍ

- **Ngày kiểm tra**: 25/08/2026
- **Phạm vi**: APIs 51 đến 60 (Drive Size/Schedule/Verify, Debt, Invoices, Bank Accounts)
- **Tài khoản test**: Huỳnh Trần Hữu Nhật (Admin - ID: `684d1e031730348327887b2c`)

---

## 📋 Chi tiết kết quả kiểm tra

| STT | Endpoint | Method | Status | Thời gian | Đánh giá / Ghi chú |
|:---:|:---|:---:|:---:|:---:|:---|
| **51** | `/api/drive-storage/size` | `GET` | 200 OK | 350ms | 🟢 **PASS**: Tra cứu dung lượng tệp Drive cụ thể theo `?id=...` thành công. |
| **52** | `/api/drive-storage/schedule` | `GET` | 200 OK | 82ms | 🟢 **PASS**: Lấy cấu hình lịch quét Drive tự động. |
| **53** | `/api/drive-storage/schedule` | `POST` | 200 OK | 95ms | 🟢 **PASS**: Lưu cài đặt lịch quét Drive tự động (bật/tắt, thời gian quét). |
| **54** | `/api/drive-storage/refresh` | `POST` | 200 OK | 2500ms | 🟢 **PASS**: Quét và làm mới bộ đệm dung lượng Google Drive. |
| **55** | `/api/drive-storage/verify` | `POST` | 200 OK | 1800ms | 🟢 **PASS**: Kiểm tra và chuẩn hóa cấu trúc thư mục lớp học Drive (`dryRun: true`). |
| **56** | `/api/debt` | `GET` | 200 OK | 118ms | 🟢 **PASS**: Lấy danh sách toàn bộ công nợ học phí chưa thanh toán. |
| **57** | `/api/pay` | `GET` | 200 OK | 195ms | 🟢 **PASS**: Tra cứu hóa đơn theo `?_id=...` (*"Lấy thông tin hóa đơn thành công"*). |
| **58** | `/api/pay` | `POST` | 400 Bad Request | 10ms | 🟢 **PASS**: Bắt lỗi validate khi thiếu dữ liệu thanh toán (*"Vui lòng cung cấp đủ thông tin bắt buộc."*). |
| **59** | `/api/pay/bulk-all` | `POST` | 200 OK | 357ms | 🟢 **PASS**: Tạo phiếu thu học phí hàng loạt (*"Hoàn tất: 49 khoản, đã đóng trước đó: 650 khoản"*). |
| **60** | `/api/bank` | `GET` | 200 OK | 126ms | 🟢 **PASS**: Lấy danh sách tài khoản ngân hàng nhận học phí (MB Bank - Phan Thị Hường). |

---

## 🎯 Đánh giá chung Đợt 6
- **Tổng số API test**: 10
- **Số lượng đạt (PASS)**: 10/10 (100%)
- **Số lượng lỗi**: 0
- **Nhận xét**: Cụm API Quản trị dung lượng Google Drive và Tài chính / Thu học phí vận hành trơn tru, xử lý chính xác cả dữ liệu đơn lẻ lẫn hàng loạt (bulk).
