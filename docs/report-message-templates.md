# Mẫu tin nhắn báo cáo cho quản lý học vụ

Trang: **Cấu hình báo cáo** (`/academic/report`, tab "Cấu hình báo cáo") → popup **Thư viện mẫu tin nhắn**.

## Placeholder được hỗ trợ

| Placeholder | Mô tả |
| ----------- | ----- |
| `{body}` | Nội dung báo cáo tự sinh (chuyên cần / thống kê tháng) |
| `{period}` | Kỳ báo cáo (vd: `05/08/2026 - 06/08/2026` hoặc `Tháng 7/2026`) |
| `{date}` | Ngày gửi tin (vd: `06/08/2026`) |

> Không dùng placeholder Variant (ví dụ `{bienthe1}`) trong mẫu báo cáo — mẫu báo cáo chỉ nhận `{body}`, `{period}`, `{date}`.

## Cách tạo mẫu

1. Bấm **"Thư viện mẫu"** → **"+ Tạo mẫu mới"**.
2. Nhập **Tên mẫu**, chọn **Loại báo cáo** (Tất cả / Chuyên cần / Thống kê tháng) và nhập **Nội dung mẫu**.
3. Trong popup tạo cấu hình, chọn mẫu ở ô "Dùng mẫu từ thư viện" (chỉ hiện mẫu phù hợp với loại báo cáo) hoặc "Dùng mẫu" trong thư viện.

---

## Mẫu báo cáo chuyên cần

### 1. Mẫu chuẩn cho phụ huynh
```
BÁO CÁO CHUYÊN CẦN
{period}

Kính gửi quý phụ huynh,

Trung tâm AI Robotic xin gửi báo cáo tình hình đi học của kỳ vừa qua:

{body}

Nếu cần hỗ trợ thêm, phụ huynh vui lòng liên hệ giáo vụ.
Trân trọng.
```

### 2. Mẫu ngắn gọn (cho quản lý)
```
BÁO CÁO CHUYÊN CẦN {period}
{body}
```

### 3. Mẫu nhấn mạnh học sinh vắng
```
BÁO CÁO CHUYÊN CẦN KỲ {period}

{body}

Ghi chú: học sinh vắng cần được giáo viên chủ nhiệm liên hệ và bổ sung lý do để theo dõi đúng tỉ lệ chuyên cần.
```

---

## Mẫu báo cáo thống kê tháng (cho quản lý học vụ)

### 4. Mẫu chuẩn theo hạng mục
```
BÁO CÁO THỐNG KÊ THÁNG {period}

{body}

Ghi chú: chi tiết theo từng hạng mục Tài chính - Học sinh - Học thử được tổng hợp tự động từ hệ thống.
```

### 5. Mẫu gửi cho ban lãnh đạo
```
BÁO CÁO THÁNG {period}

{body}

Đề nghị rà soát số học sinh chờ xếp lớp và tình hình thu học phí trong tháng tiếp theo.
```

### 6. Mẫu dạng tin nhắn thân thiện
```
Chào anh/chị,

Dưới đây là báo cáo hoạt động tháng {period} của trung tâm:

{body}

Nếu có thắc mắc, vui lòng phản hồi để giáo vụ xử lý. Cảm ơn!
```

---

## Ghi chú kỹ thuật

- Khi gửi, hệ thống tự động chuẩn hóa xuống dòng: dấu `\r\n` → `\n`, gộp các dòng trống thừa và cắt khoảng trắng đầu/cuối để tránh tin nhắn Zalo bị chèn khoảng trắng lớn.
- Báo cáo **chuyên cần** có cấu trúc cấu hình được: header ngày (1 ngày: `Thứ X - d/m/yyyy`; kỳ dài: `Kỳ: start - end`), tóm tắt (`Tổng số lớp` / `Có mặt` / `Vắng mặt` — vắng gộp cả có phép và không phép), **Chi Tiết** gom theo khu vực với từng dòng `• Lớp (Giáo viên) : Buổi N | Sĩ số : X | Có mặt : Y | vắng Z` (buổi học thử gom dưới nhóm "Học thử"), và mục **Lỗi vi phạm** gồm `Lớp chưa điểm danh` (lớp có sĩ số nhưng chưa ai được điểm danh) và `Thiếu tài nguyên` (buổi không có hình ảnh/tài liệu).
- Báo cáo thống kê tháng có các hạng mục cấu hình được: **I. Tài chính** (học phí thu), **II. Học sinh** (mới / lên khóa / nghỉ / xếp hạng học sinh đang học), **III. Học thử** (lượt học thử / tỉ lệ nhập học sau học thử), **IV. Lớp học** (đang diễn ra / hoàn thành trong tháng — chỉ tính lớp có buổi học trong tháng, liệt kê theo khu vực: tên lớp + số học sinh đang học, tối đa 10 lớp/nhóm/khu vực), kèm mục **So sánh với tháng trước** (chỉ hiển thị giá trị cũ → mới, không tính % tăng trưởng).
- Mục **IV. Lớp học** có thể **lọc theo khu vực** (bộ chọn "Khu vực (lọc phần lớp học)" trong cấu hình; bỏ chọn hết = áp dụng tất cả khu vực). Phần I–III vẫn tính toàn trung tâm.
- Khi đạt giới hạn tin nhắn trong giờ, hàng chờ sẽ tự gửi tiếp lúc **giờ sau + 30 phút**.
