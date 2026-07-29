# Báo Cáo Toàn Diện Về Google Drive — Hệ Thống Air Manager

---

## 1. Tổng Quan Cấu Hình

| Thông tin | Giá trị |
|---|---|
| Service Account | `air-900@systemair-441909.iam.gserviceaccount.com` |
| Project ID | `systemair-441909` |
| Shared Drive | **DATA AIR SYSTEM** (`0AK_Z4-cveE6dUk9PVA`) |
| Parent folder (courses) | `sys.airobotic.edu.vn` (`1syIZ0XYkmnYCYnQ6TRw1eCTgvKTuBZtR`) |
| Avatar folder | `1VXEy54ihKRvQK9FpNVzr5M8f3RwAwKh9` |
| Book image folder | `1CVBsZNe8ryObmcb0oIQObcWrwFEnHkhi` |

Biến môi trường trong `.env.development`:
- `DRIVE_COURSE_FOLDER_ID` — thư mục cha chứa tất cả khóa học
- `DRIVE_AVT_FOLDER_ID` — thư mục chứa ảnh đại diện học sinh
- `DRIVE_COURSE_IMAGE_FOLDER_ID` — thư mục chứa ảnh bìa / huy hiệu sách

---

## 2. Lịch Sử & Sự Cố Đã Xử Lý

### 2.1. Dung lượng My Drive đầy (15 GB)
- Toàn bộ file được tải lên My Drive của service account → **đầy 15 GB**.
- Giải pháp: chuyển sang shared drive **DATA AIR SYSTEM** (không giới hạn dung lượng).

### 2.2. Thiếu quyền `anyone reader` trên 7623 file DetailImage
- **Triệu chứng:** Ảnh không hiển thị, trình duyệt chỉ show alt text `"Image <fileId>"`.
- **Nguyên nhân:** File trong My Drive không có quyền `anyone` → CDN `lh3.googleusercontent.com` trả về 302 redirect.
- **Cách fix:** Thêm permission `anyone reader` cho toàn bộ 7623 file `DetailImage`.
  - (có ~7% là file video, CDN vẫn trả 404 — không liên quan permission).

### 2.3. Migration file từ My Drive sang Shared Drive
- **107 file** (avatar học sinh + ảnh bìa sách) đã copy từ My Drive → shared drive và cập nhật DB.
- **16 file** đã ở shared drive.
- **18 file ID** lỗi (đã xóa / tồn tại).
- **7623 file `DetailImage`** chưa được copy (chỉ fix permission `anyone reader`, do shared drive giới hạn `anyone commenter`).

### 2.4. Thay đổi cấu trúc thư mục
- Trước: hardcode folder ID cố định cho từng loại.
- Sau: tạo thư mục theo cấu trúc `sys.airobotic.edu.vn/{courseCode}/{ISO-date}/`.
- `<Image>` field trong DB lưu folder ID của buổi học, không phải file ID.

---

## 3. Các API Route & Chức Năng Drive

### 3.1. Utility Functions (`src/function/drive/`)

| File | Chức năng |
|---|---|
| `index.js` | Khởi tạo Google Drive client (auth bằng service account). |
| `folder.js` | `getDriveClient()` + `createDriveFolder(drive, name, parentId)` — tạo folder với `supportsAllDrives: true`. |
| `image.js` | `uploadImageToDrive(file, folderId)` — upload file vào folder; `deleteImageFromDrive(fileId)` — xóa file. |
| `appscript.js` | Tích hợp Google Apps Script để gửi tin nhắn Zalo, lấy Zalo UID. |

### 3.2. Course Routes

#### `POST /api/course` — Tạo khóa học
- Tạo folder khóa học trong `DRIVE_COURSE_FOLDER_ID`.
- Tạo folder cho từng buổi học (tên = ISO date).

#### `POST /api/course/ucalendarcourse` — Thêm buổi học bù
- Tìm folder khóa học theo tên (hoặc tạo mới).
- Tạo folder buổi học bên trong.

#### `POST /api/coursetry` — Thêm buổi học thử
- Tạo folder `rootFolderId` cho khóa học thử (nếu chưa có).
- Tạo folder buổi học bên trong.

### 3.3. Image Routes

#### `POST /api/image` — Upload ảnh vào buổi học
- Upload file vào `folderId` (là `Detail.Image` của buổi học).
- Lưu `{ id, type, create }` vào `Detail.DetailImage`.

#### `PUT /api/image` — Thay thế ảnh
- Upload ảnh mới vào cùng folder.
- Cập nhật DB + xóa file cũ trên Drive.

#### `DELETE /api/image` — Xóa ảnh
- Xóa khỏi DB + xóa file trên Drive.

### 3.4. Student Routes

#### `POST /api/student` — Tạo học sinh
- Upload avatar vào `DRIVE_AVT_FOLDER_ID`.
- Tra cứu Zalo UID qua Google Apps Script.

#### `PUT /api/student/[id]` — Cập nhật học sinh
- Upload avatar mới vào `DRIVE_AVT_FOLDER_ID`.
- Xóa avatar cũ.

### 3.5. Book Routes

#### `POST /api/book` — Thêm sách
- Upload `Image` (bìa) và `Badge` (huy hiệu) vào `DRIVE_COURSE_IMAGE_FOLDER_ID`.

#### `PUT /api/book` — Cập nhật sách
- Upload ảnh mới, xóa ảnh cũ trên Drive.

### 3.6. Drive Storage Routes

#### `GET /api/drive-storage` — Danh sách folder khóa học
- Liệt kê tất cả folder con của `DRIVE_COURSE_FOLDER_ID`.
- Trả về `id, name, createdTime`.

#### `GET /api/drive-storage/size?id={folderId}` — Dung lượng folder
- Duyệt đệ quy toàn bộ cây thư mục.
- Trả về `totalSize` (bytes) và `fileCount`.

---

## 4. Frontend — Hiển thị ảnh

### 4.1. ImageComponent (`src/components/(ui)/(image)/index.js`)
- **Đường dẫn ảnh:**
  - `https://lh3.googleusercontent.com/d/{id}` — cho `type === 'image'`
  - `https://drive.google.com/thumbnail?id={id}` — thumbnail video
  - `https://drive.google.com/file/d/{id}/preview` — iframe video
  - `https://drive.google.com/uc?export=download&id={id}` — tải xuống
- **Alt text khi ảnh lỗi:** `"Image {imageInfo.id}"` → hiển thị raw file ID.
- **Chức năng:** click xem popup, thay thế ảnh, xóa, tải xuống.

### 4.2. Các trang sử dụng ImageComponent
- `src/app/course/[...id]/ui/detailcourse/index.js` — ảnh buổi học.
- `src/app/course/[...id]/ui/detatilstudent/index.js` — ảnh học sinh.

### 4.3. Trang Drive Storage (`src/app/tools/drive-storage/page.js`)
- Hiển thị danh sách khóa học + nút "Tính dung lượng" cho từng folder.
- Tổng hợp dung lượng đã tính.
- Nav item ở sidebar (cuối danh sách, sau "Feedback").

---

## 5. Kiến Trúc Thư Mục Trên Drive

```
sys.airobotic.edu.vn/                     (DRIVE_COURSE_FOLDER_ID)
├── 25TT2002/                             (course code)
│   ├── 2025-03-10T00:00:00.000Z/         (lesson date — ISO string)
│   │   ├── image1.jpg                    (file in DetailImage)
│   │   └── image2.jpg
│   └── 2025-03-17T00:00:00.000Z/
└── 26FZ2002/
    └── ...

Avatar/                                   (DRIVE_AVT_FOLDER_ID)
└── avt-1712345678900-avatar.jpg

BookImages/                               (DRIVE_COURSE_IMAGE_FOLDER_ID)
├── cover-book.jpg
└── badge-book.png
```

- Mỗi buổi học có một folder riêng: `folderId` lưu trong `Detail[].Image`.
- Ảnh của buổi học được upload vào folder đó: `{ id, type, create }` lưu trong `Detail[].DetailImage[]`.

---

## 6. Dữ Liệu MongoDB Liên Quan

### Collection `courses`
```js
{
  ID: "25TT2002",
  Detail: [{
    _id: ObjectId,
    Topic: ObjectId,          // ref topic
    Day: Date,
    Room: ObjectId,           // ref room
    Time: String,
    Teacher: ObjectId,
    TeachingAs: ObjectId,
    Image: String,            // folderId trên Drive (chứa ảnh của buổi)
    DetailImage: [{           // danh sách file ảnh/video
      id: String,             // fileId trên Drive
      type: "image"|"video",  // phân loại MIME
      create: Date
    }],
    Type: String,             // "" | "Học bù" | "Báo nghỉ"
    Note: String
  }],
  Student: [{
    ID: String,               // student code
    Learn: [{
      Lesson: ObjectId,       // ref detail._id
      Checkin: Number,
      Image: [{ id, type, create }],  // ảnh của học sinh trong buổi
      Comment: String
    }]
  }]
}
```

### Collection `students`
```js
{
  ID: "AI0001",
  Avt: String,          // fileId trên Drive (hình đại diện)
  Uid: String,          // Zalo UID
  ...
}
```

### Collection `books`
```js
{
  ID: "ROBOT1001",
  Image: String,        // fileId ảnh bìa
  Badge: String,        // fileId huy hiệu
  ...
}
```

---

## 7. Các URL Google Drive Được Sử Dụng

| Mục đích | URL Pattern |
|---|---|
| Hiển thị ảnh (CDN) | `https://lh3.googleusercontent.com/d/{fileId}` |
| Thumbnail video | `https://drive.google.com/thumbnail?id={fileId}` |
| Xem video (embed) | `https://drive.google.com/file/d/{fileId}/preview` |
| Tải xuống | `https://drive.google.com/uc?export=download&id={fileId}` |
| Xem trên Drive | `https://drive.google.com/file/d/{fileId}/view` |

---

## 8. Danh Sách File Đã Sửa / Tạo

### File đã sửa (modified)

| File | Nội dung thay đổi |
|---|---|
| `.env.development` | Thay `DRIVE_COURSE_FOLDER_ID`, `DRIVE_AVT_FOLDER_ID`, `DRIVE_COURSE_IMAGE_FOLDER_ID` bằng ID shared drive |
| `src/app/api/(course)/course/route.js` | Dùng `DRIVE_COURSE_FOLDER_ID` thay hardcode; tạo folder theo `{courseCode}/{ISO-date}` |
| `src/app/api/(course)/course/[id]/route.js` | Cập nhật logic Drive |
| `src/app/api/(course)/course/ucalendarcourse/route.js` | Tra cứu/tạo folder khóa học theo tên; dùng `DRIVE_COURSE_FOLDER_ID` |
| `src/app/api/(course)/coursetry/route.js` | Dùng `DRIVE_COURSE_FOLDER_ID`; tạo `rootFolderId` + folder buổi học |
| `src/app/api/(course)/book/route.js` | Dùng `DRIVE_COURSE_IMAGE_FOLDER_ID` cho upload ảnh bìa & huy hiệu |
| `src/app/api/(student)/student/route.js` | Dùng `DRIVE_AVT_FOLDER_ID` cho upload avatar |
| `src/app/api/(student)/student/[id]/route.js` | Dùng `DRIVE_AVT_FOLDER_ID`; xóa avatar cũ khi cập nhật |
| `src/components/(layout)/nav/index.js` | Thêm nav item "Drive" ở cuối sidebar |

### File đã tạo (created)

| File | Chức năng |
|---|---|
| `src/app/api/drive-storage/route.js` | API liệt kê tất cả folder khóa học |
| `src/app/api/drive-storage/size/route.js` | API tính dung lượng đệ quy của 1 folder |
| `src/app/tools/drive-storage/page.js` | Giao diện trang Drive Storage |

### DB Migration (không phải file code)

| Migration | Mô tả |
|---|---|
| 7623 DetailImage | Thêm permission `anyone reader` cho toàn bộ file |
| 107 avatar/book | Copy từ My Drive → shared drive, cập nhật DB |
| 18 file ID lỗi | Skip do file đã xóa / không tồn tại |

---

## 9. Tổng Kết Sự Cố Đã Xử Lý

| Sự cố | Trạng thái |
|---|---|
| Quota My Drive đầy | ✅ Đã chuyển sang shared drive |
| 7623 ảnh DetailImage không hiển thị | ✅ Đã thêm `anyone reader` (100% file) |
| 107 file avatar/book ở My Drive | ✅ Đã copy sang shared drive + update DB |
| Hardcode folder ID | ✅ Đã thay bằng biến môi trường |
| Video trong DetailImage trả 404 CDN | ⚠️ 7% entries — cần xử lý ở component (dùng iframe) |
| 18 file ID lỗi (đã xóa) | ✅ Đã skip khi migration |
