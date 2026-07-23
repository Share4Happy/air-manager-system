# Phiên bản 2.0.1 — Các chức năng mới & Thay đổi

## Tổng quan

Phiên bản này tập trung vào cải thiện giao diện login, tổ chức lại sidebar, bổ sung các trang quản lý mới, và tối ưu trải nghiệm người dùng.

---

## 1. Thiết kế lại trang Đăng nhập

### Giao diện
- Nền: màu xám xanh nhạt `#E0E8F0`
- Card login: `min(92vw, 1400px)` × `780px` (to hơn so với phiên bản trước)
- Hai cột: trái là hình ảnh `banner_wellcome.png`, phải là form
- Bo góc card `16px`, shadow lớn

### Kích thước form (tăng đồng bộ)
| Thành phần | Cũ | Mới |
|---|---|---|
| Title | 35px | 42px |
| Chiều cao input | 42px | 52px |
| Font input | 13px | 15px |
| Font label | 12px | 14px |
| Chiều cao button | 42px | 52px |
| Icon input | 16px | 20px |

### Nút mạng xã hội
- Facebook + Website, nền cyan `#08A9DF`, chữ trắng
- Dạng `flex-1` nằm cạnh nhau
- Icon 20px

### Nút ĐĂNG NHẬP
- Đổi từ "LOGIN" → "ĐĂNG NHẬP"
- Hiệu ứng loading (spinner)

---

## 2. Tổ chức lại Sidebar

### Thứ tự mới
1. Thống kê
2. Lịch dạy
3. Khóa học
4. **Công cụ** (mới)
5. Học sinh
6. Eportfolio
7. Học vụ
8. Chăm sóc
9. Người dùng

### Eportfolio
- Đổi tên từ "Tìm kiếm" → "Eportfolio"
- Icon: `Svg_Profile`

### Mục "Công cụ" (mới)
- Route: `/tools`
- Icon: hình cờ lê (wrench)
- Xem chi tiết ở mục 4

### Học vụ — sắp xếp lại
1. Báo cáo chuyên cần
2. Quản lý chương trình học
3. Quản lý phòng học
4. Quản lý học phí
5. Quản lý học bù

### Đổi tên các mục Học vụ
| Cũ | Mới |
|---|---|
| Học bù | Quản lý học bù |
| Phòng học | Quản lý phòng học |

### Thu gọn sidebar
- Khi thu gọn: tooltip popup chỉ hiển thị tên các mục con, **không hiển thị tên parent** "Học vụ"
- Thêm đường phân cách (`border-t white/20`) giữa các item con trong tooltip

---

## 3. Trang Quản lý chương trình học

### Route: `/academic/program`

- Dùng lại component `ProgramList` từ Course (`@/app/course/ui/book-item`)
- Dùng lại component `CourseManagementPage` để thêm chương trình mới
- Nút **"Làm mới dữ liệu"**: gọi `reloadBook()` + `router.refresh()`
- Nút **"Thêm chương trình"**: mở popup tạo chương trình (ID, tên, học phí, ảnh bìa, ảnh huy hiệu, chủ đề)
- Layout: `flex-1 overflow-y-auto p-[16px_3px]` (giống layout Course)

### File
- `src/app/academic/program/page.js` — server component, gọi `book_data()`
- `src/app/academic/program/client.js` — client component quản lý UI + buttons

---

## 4. Trang Công cụ

### Route: `/tools`

### Tính năng
- CRUD công cụ với 3 trường: **Tên**, **Mô tả**, **Đường dẫn**
- Dữ liệu lưu vào `localStorage` (dùng chung cho mọi người dùng)
- Hiển thị dạng **card 4 cột**
- Mỗi card có:
  - Tên (link, click mở tab mới)
  - Đường line phân cách
  - Mô tả
  - Đường link hiển thị dạng text xanh nhỏ
  - **Nút 3 chấm** → popup: **Chỉnh sửa** / **Xóa**
- Ô tìm kiếm ở header
- Popup chỉnh sửa dùng lại form thêm (tự động điền dữ liệu)

### File
- `src/app/tools/page.js` — toàn bộ UI CRUD

---

## 5. Tối ưu SVG

- Đã di chuyển 3 SVG inline trong form login vào thư viện chung:
  - `EnvelopeIcon` → `Svg_Envelope`
  - `LockIcon` → `Svg_Lock`
  - `CitySkyline` → `Svg_CitySkyline`
- File: `src/components/(icon)/svg/index.js`
- Tuân thủ pattern `({ w, h, c })` như các icon khác

---

## 6. Chỉnh sửa Layout tổng thể

### File: `src/app/layout.js`

### Trước (v2.0.0)
```jsx
w-[calc(100%-var(--sidebar-w,240px)-32px)]
h-[calc(100%-32px)]
p-4
```

### Sau (v2.0.1)
```jsx
w-[calc(100%-var(--sidebar-w,240px))]
h-full
p-2
```

- Content fill **toàn bộ màn hình**, không còn khoảng trắng thừa bên phải và dưới
- Padding `p-2` tạo khoảng cách đều 4 phía, nền xám `bg-[var(--bg-secondary)]` phủ toàn bộ

---

## 7. Các cải tiến khác

### Giới hạn đăng nhập (Rate Limiting)
- 5 lần sai → khóa 15 phút
- Sai tiếp sau khi hết 15 phút → khóa 24 giờ
- Lưu trong memory Map, key theo email (lowercased)
- File: `src/app/api/(auth)/login/route.js`

### Xóa `force-dynamic`
Đã xóa `export const dynamic = 'force-dynamic'` khỏi 5 file:
1. `src/app/layout.js`
2. `src/utils/fetchApi.js`
3. `src/utils/checkuser.js`
4. `src/app/api/(auth)/logout/route.js`
5. `src/app/api/(course)/updateimage/route.js`

---

## Danh sách file thay đổi

| File | Loại thay đổi |
|---|---|
| `src/app/(auth)/login.js` | Sửa — giao diện login, màu nền, kích thước card |
| `src/components/(layout)/login/index.js` | Sửa — form login lớn hơn, import SVG |
| `src/components/(layout)/nav/index.js` | Sửa — thêm mục Công cụ, sắp xếp, đổi tên, tooltip |
| `src/components/(icon)/svg/index.js` | Sửa — thêm Svg_Envelope, Svg_Lock, Svg_CitySkyline |
| `src/app/academic/program/page.js` | **Mới** — trang Quản lý chương trình học |
| `src/app/academic/program/client.js` | **Mới** — client component |
| `src/app/tools/page.js` | **Mới** — trang Công cụ |
| `src/app/layout.js` | Sửa — fix layout full màn hình |
| `src/app/api/(auth)/login/route.js` | Sửa — thêm rate limiting |
| `src/app/page.js` | Sửa — redirect sau login |
| `src/app/dashboard/page.js` | Sửa — dashboard route |
| `src/components/dashboard/overview.js` | Sửa — stat cards, loading skeleton |
| `src/app/api/dashboard/overview/route.js` | Sửa — ranking, total students |
| `src/app/student/list/layout/main/index.js` | Sửa — student filters |
| `src/utils/fetchApi.js` | Sửa — xóa force-dynamic |
| `src/utils/checkuser.js` | Sửa — xóa force-dynamic |
| `src/app/api/(auth)/logout/route.js` | Sửa — xóa force-dynamic |
| `src/app/api/(course)/updateimage/route.js` | Sửa — xóa force-dynamic |
| `src/styles/font.css` | Sửa — unlayered CSS workaround |
| `public/images/banner_wellcome.png` | Sửa — ảnh banner login |
