# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.16] - 2026-08-07

### Added
- **Tab "Chăm sóc lớp học"** trên trang Chăm sóc khách hàng (`/client`) — `src/app/client/ui/lesson-cancel/index.js`:
  - Danh sách buổi học hôm nay + buổi **Báo nghỉ** (badge Loại buổi, bộ lọc ngày, xem lịch sử)
  - Cột tiến độ buổi: Sĩ số / Đã điểm danh / Có hình ảnh / Có nhận xét
  - Bảng học sinh từng buổi: trạng thái điểm danh (Có mặt / Xin nghỉ / Vắng mặt / Chưa điểm danh), ảnh, nhận xét `CmtFn`
  - Popup gửi thông báo nghỉ qua ZaloLite với chip biến mẫu: `{HoTen}` `{TenPH}` `{Lop}` `{Ngay}` `{GiaoVien}` `{DiemDanh}` `{HinhAnh}` `{NhanXetGV}` `{LinkEportfolio}`
  - Cập nhật trạng thái chăm sóc từng học sinh / hàng loạt (`pending`/`done`/`failed`)
  - Thư viện mẫu tin nhắn chăm sóc (lưu/sửa/xóa, phân loại `messageType`)
- **API `GET/POST /api/client/lesson-cancel`** — lấy buổi hôm nay + báo nghỉ (`?date=`, `?history=1`, `?templates=1`), tổng hợp tiến độ buổi, trạng thái chăm sóc/Zalo từng HS; cập nhật `LessonNotify`
- **Model mới**: `src/models/lessonNotify.js` (theo dõi thông báo nghỉ: `status`, `method` zalo/care, `notifiedBy/At`, `confirmations`, trạng thái + zaloStatus/zaloAt từng HS), `src/models/careTemplate.js` (thư viện mẫu chăm sóc)
- **`sendCancelNotificationAction`** (server action) — gửi thông báo nghỉ qua `sendByPhone`, render biến từng HS, tuân theo giới hạn gửi tin (stagger + giới hạn theo giờ), chạy nền, ghi `Logs` (`type: 'sendCare'`) + cập nhật `zaloStatus`/`zaloAt`
- **Tab "Đồng bộ Drive"** trong Cài đặt (`POST /api/drive-storage/verify`, SSE) — chuẩn hoá cấu trúc folder Drive:
  - Tạo folder lớp `{MãLớp}` trong `DRIVE_COURSE_FOLDER_ID` khi thiếu; folder buổi `{MãLớp}-{YYYY-MM-DD}` nằm **bên trong** lớp
  - Khôi phục folder bị thùng rác, di chuyển folder buổi đang ở sai vị trí (kể cả ở shared-drive root) vào đúng lớp, đổi tên theo chuẩn
  - Tạo mới + cập nhật DB cho folder ở drive cũ / không tồn tại; retry khi Google rate-limit / lỗi OAuth token
  - Báo cáo chi tiết: `ok / restored / moved / renamed / recreated / createdClass / dbUpdated / failed`
- **Tab "ZaloLite"** trong Cài đặt — cấu hình `ZALOLITE_BASE_URL` + `ZALOLITE_API_KEY` lưu vào DB (`notificationSetting`), không cần biến môi trường:
  - `src/utils/zalolite-config.js`: `getZaloLiteConfig()` đọc DB (cache 60s, fallback env), `clearZaloLiteConfigCache()`
- **Helper `lessonFolderName(code, day)`** trong `src/function/drive/folder.js` (đặt tên chuẩn folder buổi)
- **Docker dùng file env**: `.env.production.sample` (mẫu placeholder), `docker-compose.yml` thêm `env_file: .env.production`, `.dockerignore` chặn `.env*`

### Changed
- **`src/function/zalolite.js`**: bỏ `const BASE_URL/API_KEY` lấy từ env lúc import → đọc config động từ DB mỗi lần gọi
- **`/api/notifications/settings` (PUT)**: xoá cache ZaloLite khi lưu key `ZALOLITE_*`
- **`course/route.js`, `ucalendarcourse/route.js`, `coursetry/route.js`**: folder buổi tạo mới đặt tên chuẩn `{MãLớp}-{YYYY-MM-DD}` (trước đây dùng `toISOString()`)
- **`src/app/client/index.js`**: thêm tab "Chăm sóc lớp học" (mặc định mở tab này)
- **`src/function/report.js`**: export `sleep`, `countHourlySent`; đếm cả `type: 'sendCare'` vào giới hạn gửi theo giờ
- **`src/models/log.js`**: enum `type` thêm `sendCare`
- **`src/components/(layout)/nav/index.js`**: đổi tên menu "Báo cáo chuyên cần" → "Báo cáo & Thông báo"
- **`Dockerfile`**: bỏ hardcode `MONGODB_URI`/`JWT_SECRET`/`token`/`URL` và bỏ hoàn toàn credential Google SA cũ (`air-900@systemair-441909`) — env truyền lúc chạy qua file
- **`AGENTS.md`**: ghi chuẩn cấu trúc folder Drive (folder lớp trong `DRIVE_COURSE_FOLDER_ID`, không tạo ở shared-drive root)

### Fixed
- **Bug đồng bộ Drive**: folder bị thùng rác được khôi phục nhưng không được di chuyển vào lớp (return sớm) — giờ khôi phục rồi tiếp tục move + rename
- **Bug đồng bộ Drive**: `ensureContainer` từng nhận nhầm chính folder buổi (tên trùng mã lớp, vd buổi "Báo nghỉ" `25ET2001`) làm folder lớp → "Bad Request" khi move vào chính nó — giờ loại trừ mọi folder buổi khỏi tìm kiếm folder lớp

### Removed
- `docs/report-drive.md`, `diag6.mjs` (tham chiếu drive/SA cũ)
- Các biến `ZALOLITE_BASE_URL`, `ZALOLITE_API_KEY` khỏi `.env.development` (đã chuyển sang Cài đặt → tab ZaloLite)

### Notes
- Chuẩn Drive: `DRIVE_COURSE_FOLDER_ID` (`1syIZ0XYkmnYCYnQ6TRw1eCTgvKTuBZtR`, "AIR_data_course") chứa folder lớp `{MãLớp}`; folder buổi `{MãLớp}-{YYYY-MM-DD}` nằm trong lớp. Không tạo folder trực tiếp ở shared-drive root (`0AK_Z4-cveE6dUk9PVA`).
- Di chuyển/đổi tên folder Drive giữ nguyên `fileId` nên DB không cần đổi, ảnh vẫn hiển thị.
- Deploy Docker: tạo `.env.production` từ `.env.production.sample` (bắt buộc `token=sys1`) rồi `docker compose up -d --build`.

### Verification
- `npx next build` passes successfully
- Đồng bộ Drive chạy thực tế: 868 folder ref → 854 OK / 0 lỗi; **0 folder buổi còn ở shared-drive root**, ~120 folder lớp nằm trong `1syIZ0XY`; folder buổi đều tên chuẩn `{MãLớp}-{YYYY-MM-DD}` bên trong lớp
- `getZaloLiteConfig()` trả đúng base URL + API key từ DB khi đã gỡ env
- `GET /api/client/lesson-cancel` trả đúng buổi hôm nay + báo nghỉ, có dữ liệu điểm danh/ảnh/nhận xét từng học sinh

---
