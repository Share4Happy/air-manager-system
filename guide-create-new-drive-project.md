# Hướng Dẫn Tạo Project & Service Account Google Drive Mới

## 1. Tạo project mới
- Vào [console.cloud.google.com](https://console.cloud.google.com)
- Đăng nhập tài khoản Google của bạn (có quyền tạo project)
- Trên thanh header → click **Select a resource** → **NEW PROJECT**
- Đặt tên ví dụ: `air-manager-system` (hoặc tên bạn muốn)
- Click **CREATE**

## 2. Bật Google Drive API
- Vào **APIs & Services** → **Library**
- Tìm "Google Drive API" → **ENABLE**

## 3. Tạo Service Account
- Vào **APIs & Services** → **Credentials**
- Click **+ CREATE CREDENTIALS** → **Service Account**
- Đặt tên: `air-service`
- Click **DONE**

## 4. Tạo key (Private Key)
- Trong danh sách Service Account, click vào email vừa tạo
- Vào tab **Keys** → **ADD KEY** → **Create New Key**
- Chọn **JSON** → **CREATE**
- File JSON sẽ tự động tải về — **giữ file này cẩn thận**, trong đó có `private_key` và `client_email`

## 5. Thêm Service Account vào Shared Drive
- Vào [drive.google.com](https://drive.google.com)
- Mở shared drive **DATA AIR SYSTEM** (hoặc shared drive bạn muốn dùng)
- Click tên shared drive → **Quản lý thành viên**
- Thêm email service account (vd: `air-service@...gserviceaccount.com`) với quyền **Thành viên** (Content Manager)

## 6. Cập nhật file `.env.development`
Sao chép các giá trị từ file JSON vừa tải về vào `.env.development`:

```
GOOGLE_PROJECT_ID=<project_id từ JSON>
GOOGLE_CLIENT_EMAIL=<client_email từ JSON>
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Lưu ý: private key trong file JSON có dạng `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` — copy nguyên chuỗi đó (giữ nguyên `\n`).

## 7. Tạo folder cha trên Drive
- Vào shared drive → tạo folder `sys.airobotic.edu.vn`
- Copy folder ID (chuỗi trong URL)
- Set vào `DRIVE_COURSE_FOLDER_ID` trong `.env.development`

## 8. Khởi động lại server
```bash
npm run dev
```
