# ARCH — Tổng quan kiến trúc

## Tech Stack
- **Framework**: Next.js 16 (App Router, Server Components, Turbopack), React 19
- **Ngôn ngữ**: JavaScript (JSX), `@/*` → `src/*` (xem `jsconfig.json`)
- **Database**: MongoDB (`mongodb://127.0.0.1:27017/air`), ODM **Mongoose 8**
- **Xác thực**: JWT (`jsonwebtoken`) + cookie `sys1` (httpOnly), password dùng `bcryptjs`
- **Lưu trữ file/ảnh**: Google Drive (Service Account `GOOGLE_CLIENT_EMAIL`/`GOOGLE_PRIVATE_KEY`), thư viện `googleapis`
- **Biểu đồ**: `chart.js` + `react-chartjs-2`
- **Styling**: Tailwind CSS 4 (+ biến CSS trong `src/styles/all.css`), SVG icon custom
- **Khác**: `exceljs` (xuất Excel), `dayjs`, `cookie`
- **Cấu hình môi trường**: `.env.development` (URL, JWT_SECRET, MongoDB_URI, creds Drive, folder-id Drive, template URL Drive `NEXT_PUBLIC_DRIVE_*`)

## Luồng dữ liệu (Data Flow)

```
Browser (Client Component)
   │  fetch tới internal API
   ▼
Next.js API Route  src/app/api/**/route.js
   │  connectDB(), mongoose, gọi Google Drive (nếu cần)
   ▼
MongoDB (models)  src/models/*.js
```

**Hai cách Server Component lấy dữ liệu:**

1. **Qua internal API + cache tag** — `src/data/course.js` (vd `Data_coursetry()`) dùng `fetchApi` (`src/utils/fetchApi.js`) gọi `/api/...` với `cache: "force-cache"` + `next: { tags }`; khi ghi dữ liệu, route gọi `revalidateTag()` (vd `data_coursetry`) để làm mới.
2. **Trực tiếp qua data layer** — `src/data/actions/get.js` (`*_data()` functions, `'use server'`) gọi `src/data/database/*.js` để query Mongoose trực tiếp từ Server Component/route.

**Luồng đăng nhập:** `POST /api/login` → verify bcrypt → ký JWT → set cookie (`process.env.token` / `sys1`) → `RootLayout` (`src/app/layout.js`) gọi `/api/check` mỗi request để nạp user + hiển thị Nav.

**Luồng upload ảnh:** Client → API route → upload lên Drive (thư mục cấu hình qua `DRIVE_*_FOLDER_ID`) → lưu fileId vào Mongo → ảnh hiển thị bằng template URL Drive (helper trong `src/function/index.js`: `srcImage`, `driveThumbnailUrl`, ...).

**Luồng lớp học thử:** `POST /api/coursetry` tạo buổi học (tạo folder Drive dưới `DRIVE_COURSE_FOLDER_ID`), lưu `sessions` vào `TrialCourse` (`src/models/coursetry.js`); trạng thái chăm sóc học sinh (`0: Không theo / 1: Chưa CS / 2: Theo học`) lưu trong `student.statuses` qua `PUT /api/student`.

## Vị trí các thư mục quan trọng
| Đường dẫn | Vai trò |
|---|---|
| `src/app/` | Các trang (App Router): `course/`, `student/`, `academic/`, `calendar/`, `client/`, `dashboard`, `info`, `feedback`, `setting`, `tools/` |
| `src/app/api/` | Internal API routes, nhóm theo domain: `(course)`, `(student)`, `(area)`, `(auth)`, `(client)`, `(image)`, `(zalo)`, `drive-storage`, `bank`, `notifications` |
| `src/components/` | UI components: `(layout)` (nav, login), `(features)` (popup, noti), `(ui)` (button, image, loading, box/file), `(icon)` (SVG) |
| `src/models/` | Mongoose models (mỗi collection một file) |
| `src/data/` | Server data: `course.js` (Data_*/Re_* + cache), `actions/get.js`, `database/*.js` (query Mongoose), `default/` (seed data) |
| `src/function/` | Helpers: `index.js` (format, drive URL), `drive/` (Google Drive client, folder ops), `notificationEngine.js`, `server.js` |
| `src/utils/` | `env.js` (đọc env config), `fetchApi.js` (fetch nội bộ kèm cookie/Bearer), `response.js` |
| `src/config/` | `connectDB.js` (kết nối MongoDB) |
| `src/lib/` | Logic nghiệp vụ phụ (`login-attempts.js` chặn brute-force) |
| `src/script/` | Script chạy thủ công (vd backfill drive sizes) |
| `docs/` | Tài liệu kỹ thuật/feature |

## Ghi chú quan trọng
- Model `coursetry` hiện gắn cố định trial class id `TRIAL_ID = 6871bc14ada3650715efc786`.
- `sessions.images` của TrialCourse là một `ImageSchema` (object), không phải mảng.
- Khi thêm/sửa dữ liệu, luôn `revalidateTag(tag)` để cache tag tương ứng không trả dữ liệu cũ.
- File/ảnh không lưu binary trong Mongo — chỉ lưu `fileId`, URL xây dựng từ `NEXT_PUBLIC_DRIVE_*` trong env.

---
## Work Log

### Hũy lich suât bài (Báo nghỉ display)
**Ngày:** 03/08/2026

**Vấn đề:** Bài học có `Type === "Báo nghỉ"` bị ẩn hoàn toàn trên trang lịch (`/calendar`) và day view (`lesson_td`).

**Thay đổi:**
1. **`src/app/calendar/page.js` — `DayLessons` (MonthView):** Thay `if (data.type === "Báo nghỉ") return null;` bằng việc hiển thị với:
   - Nền đỏ `#fef2f2`, border đỏ `#fca5a5`
   - Opacity 60% (tạo hiệu ứng mờ)
   - Badge "Báo nghỉ" màu đỏ

2. **`src/app/calendar/page.js` — `MonthList`:** Thêm logic:
   - Dot indicator màu đỏ `#dc2626`
   - Badge "Nghỉ" (red-100 / red-600)
   - Opacity 60%

3. **`src/app/calendar/ui/lesson_td/index.js`:** Thay `if (data.type === "Báo nghỉ") return null;` bằng việc hiển thị với:
   - Left border đỏ `#dc2626`
   - Badge "Báo nghỉ" rõ ràng
   - Opacity 60%
   - Không hiển thị badges "Điểm danh" / "Nhận xét" / "Minh chứng"

**Kiểu dữ liệu mẫu** xem `docs/sample-bao-nghi-data.md`.

### Xóa tab "Logs Bot" trang chăm sóc
**Ngày:** 03/08/2026

**Thay đổi:**
1. **`src/app/client/index.js`:** Xóa import `BotLogs` từ `./ui/bot-logs`
2. **`src/app/client/index.js`:** Xóa nút tab "Logs Bot" (was lines 59-64)
3. **`src/app/client/index.js`:** Xóa nhánh render `<BotLogs>` trong ternary (was line 120)
4. Giữ lại file `src/app/client/ui/bot-logs/index.js` nhưng không còn được tham chiếu
