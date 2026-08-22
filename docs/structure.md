# Cấu trúc dự án chuẩn - AI Robotic Manager System

> Tài liệu chuẩn hóa kiến trúc mã nguồn dự án dựa trên Next.js 16 (App Router) + React 19.

---

## 1. Kiến trúc tổng quan thư mục

```text
air-manager-system/
│
├── src/
│   ├── instrumentation.js            # Hook khởi động Next.js (Khởi chạy Background Scheduler)
│   │
│   ├── app/                          # Next.js App Router (Giao diện & API Endpoints)
│   │   ├── layout.js                 # Root layout & Authentication check (/api/check)
│   │   ├── page.js                   # Trang chủ điều hướng
│   │   ├── actions/                  # Server Actions (Xử lý Form & Mutations chuẩn)
│   │   ├── academic/                 # Route /academic (Học vụ, điểm danh, báo cáo, phòng học)
│   │   │   └── report/               # Module Báo cáo học vụ
│   │   │       ├── report-config-tab.js     # Component điều phối tab cấu hình báo cáo
│   │   │       └── ui/report-config/        # Subcomponents độc lập (Bảng, Biểu đồ, 7 Popups)
│   │   ├── calendar/                 # Route /calendar (Lịch dạy & Điểm danh)
│   │   ├── client/                   # Route /client (Khách hàng & Báo hủy buổi học)
│   │   ├── course/                   # Route /course & /course/trycourse (Khóa học & Học thử)
│   │   ├── student/                  # Route /student (Danh sách & Hồ sơ học viên)
│   │   ├── teacher/                  # Route /teacher (Giáo viên)
│   │   ├── tools/                    # Route /tools (Công cụ quản trị & Dung lượng Drive)
│   │   └── api/                      # API Routes nội bộ & Webhook
│   │
│   ├── components/                   # UI Components dùng chung toàn hệ thống
│   │   ├── (features)/               # Feature Popups & Notifications (FlexiblePopup, Noti)
│   │   ├── (layout)/                 # Thanh điều hướng (Nav), Header, Sidebar
│   │   └── (ui)/                     # Base Atomic UI Components (Input, Select, Button, Loading)
│   │
│   ├── lib/                          # Core Business Logic & Orchestrators
│   │   └── scheduler/                # In-Process Background Scheduler chạy ngầm
│   │       ├── index.js              # Orchestrator (Tick 60s, Lock bảo vệ, Interval bảo vệ)
│   │       └── jobs/                 # Các tác vụ ngầm độc lập
│   │           ├── report.job.js            # Tự động gửi báo cáo Zalo theo lịch
│   │           ├── zalo-campaign.job.js     # Gửi tin nhắn Zalo Marketing hàng loạt
│   │           ├── care-lesson.job.js       # Chăm sóc học viên hủy buổi
│   │           └── poll-campaign.job.js     # Kiểm tra tiến độ chiến dịch Zalo
│   │
│   ├── config/                       # Kết nối Database (connectDB.js) & cấu hình hệ thống
│   ├── data/                         # Data layer (Mongoose queries, Server actions data fetcher)
│   ├── function/                     # Các hàm tiện ích (Google Drive, Zalo Lite, Compress, Format)
│   ├── models/                       # Mongoose Schemas & Models
│   └── script/                       # Script bảo trì & chẩn đoán (diag-drive-folders, backfill)
│
├── public/                           # Static assets (Logo, Favicon, SVG)
├── docs/                             # Tài liệu kỹ thuật & kiến trúc hệ thống
└── .env.development                  # Biến môi trường (Chứa JWT_SECRET, Mongo_URI, Drive creds)
```

---

## 2. Quy chuẩn thiết kế Giao diện (Component-Driven Architecture)

### 2.1. Phân tầng Component (Atomic Design)
1. **Tầng Base UI (`src/components/(ui)/`):**
   - Các thành phần nguyên tử dùng chung: `<FormInput>`, `<FormSelect>`, `<FormTextarea>`, `<Button>`, `<Badge>`, `<Loading>`.
   - Phải hỗ trợ đầy đủ: `label`, `error`, `className`, `...props`, `ref` (`forwardRef`), và thuộc tính `name` để tương thích Server Actions.
2. **Tầng Layout & Feature Containers (`src/components/(features)/`):**
   - `<FlexiblePopup>`: Khung popup trượt phải chuẩn của toàn hệ thống.
   - `<Noti>`: Toast thông báo kết quả thao tác.
3. **Tầng Màn hình nghiệp vụ (Feature Pages / Tabs):**
   - Không viết các file đơn khối (monolithic) > 300 dòng.
   - Luôn tách các Popup, Bảng, Biểu đồ thành các file riêng trong thư mục con `ui/[tên-tính-năng]/`.

---

## 3. Quy chuẩn Background Scheduler (In-Process Job Engine)

1. **Khởi động:** Được kích hoạt tự động qua `src/instrumentation.js` khi Next.js Node.js runtime khởi động.
2. **Múi giờ:** Ép cứng `TZ = 'Asia/Ho_Chi_Minh'` để lịch hẹn chạy chuẩn xác theo giờ Việt Nam.
3. **Chống trùng lặp (Concurrency & Idempotency):**
   - Sử dụng cờ `globalThis.__air_scheduler_interval` chống timer trùng khi Hot-reload trong môi trường Dev.
   - Sử dụng biến `isTickRunning` chống chồng lấn tác vụ (overlapping ticks) khi job trước chạy lâu hơn 60s.
   - Sử dụng nguyên tử `findOneAndUpdate` trong MongoDB để claim lock giữa các container/cluster.

---

## 4. Quy ước kiểm tra & Triển khai
- Kiểm tra hợp lệ duy nhất của toàn hệ thống: `npx next build`.
- Chạy môi trường phát triển: `npm run dev`.
