# Theo dõi dung lượng Google Drive

## Vấn đề

Trang `/tools/drive-storage` hiện tại gọi Google Drive API **N+1 lần** mỗi lần vào trang:
- 1 lần lấy danh sách folder
- N lần tính dung lượng từng folder (mỗi lần duyệt toàn bộ subfolder)

Với 42+ khóa học, mỗi khóa ~20 buổi, tổng cộng **~200+ request Drive API**. Khi scale lên 100+ khóa, page load càng chậm.

## Giải pháp: 2 Layer

### Layer 1 — Lưu `size` vào MongoDB ngay khi upload

**Trước đây:** Chỉ lưu `{ id, type, create }` — không biết file dung lượng bao nhiêu.

**Sau khi sửa:**
```js
// Schema mới
DetailImage: [{
  id: String,      // Drive file ID
  type: String,    // "image" | "video" | "file"
  size: Number,    // bytes ← THÊM MỚI
  create: Date
}]
```

Mỗi route upload đều ghi `fileBuffer.length` hoặc `file.size` vào trường `size`.

**Các route đã sửa:**

| Route | Phương thức | File sửa |
|-------|------------|----------|
| `/api/updateimage` | POST, PUT | `src/app/api/(course)/updateimage/route.js` |
| `/api/image` | POST, PUT | `src/app/api/(image)/image/route.js` |
| `/api/updateimagestudent` | POST | `src/app/calendar/[id]/ui/formimages/index.js` (client) |
| `/api/student` | POST | `src/app/api/(student)/student/route.js` |
| `/api/student/[id]` | PUT | `src/app/api/(student)/student/[id]/route.js` |
| `/api/book` | POST, PUT | `src/app/api/(course)/book/route.js` |

### Layer 2 — API mới `/api/drive-storage/summary`

**Không gọi Drive API.** Aggregate trực tiếp từ MongoDB:

```
GET /api/drive-storage/summary
→ 1 query MongoDB duy nhất
→ Trả về ngay trong <100ms
→ Không chậm khi scale
```

**Response mẫu:**
```json
{
  "summary": {
    "totalSize": 1234567890,
    "totalFiles": 4567,
    "courseSize": 1100000000,
    "courseFiles": 4500,
    "avatarSize": 50000000,
    "avatarFiles": 35,
    "bookSize": 20000000,
    "bookFiles": 22,
    "trialSize": 60000000,
    "trialFiles": 10
  },
  "courses": [
    { "id": "...", "name": "25FZ1005", "totalSize": 123456789, "fileCount": 45 },
    ...
  ],
  "lastUpdated": "2026-07-30T..."
}
```

### Layer 3 — Cron reconcile hàng đêm (tùy chọn)

Nếu có file được thêm/xóa thủ công trên Drive (không qua app), dữ liệu `size` trong MongoDB sẽ lệch với thực tế.

Cron job chạy 3h sáng mỗi ngày dùng script `src/script/backfill-drive-sizes.js` để đồng bộ:

```bash
# crontab -e
0 3 * * * cd /path/to/project && npx tsx src/script/backfill-drive-sizes.js >> /var/log/drive-backfill.log 2>&1
```

---

## Các file đã thay đổi

### Schema
| File | Thay đổi |
|------|---------|
| `src/models/course.js` | Thêm `size` vào `DetailImage` và `Learn.Image` |
| `src/models/coursetry.js` | Thêm `size` vào `ImageSchema` |
| `src/models/student.js` | Thêm field `AvtSize` |
| `src/models/book.js` | Thêm field `ImageSize`, `BadgeSize` |

### Routes
| File | Thay đổi |
|------|---------|
| `src/app/api/(course)/updateimage/route.js` | POST: thêm `size` vào newMediaObject; PUT: thêm `size` khi replace |
| `src/app/api/(image)/image/route.js` | POST: thêm `size` vào newMediaObject; PUT: thêm `size` khi replace |
| `src/app/api/(student)/student/route.js` | POST: lưu `AvtSize` khi tạo học sinh |
| `src/app/api/(student)/student/[id]/route.js` | PUT: lưu `AvtSize` khi update avatar |
| `src/app/api/(course)/book/route.js` | POST/PUT: lưu `ImageSize`, `BadgeSize` |
| `src/app/calendar/[id]/ui/formimages/index.js` | Client: pass `size` trong `newImages` |

### API mới
| File | Mô tả |
|------|-------|
| `src/app/api/drive-storage/summary/route.js` | Aggregate size từ MongoDB, không gọi Drive API |

### Script
| File | Mô tả |
|------|-------|
| `src/script/backfill-drive-sizes.js` | Backfill size cho dữ liệu cũ + cron reconcile |
| `src/app/tools/drive-storage/page.js` | Updated: dùng API summary mới |

---

## Backfill dữ liệu cũ

Chạy 1 lần để lấy size cho các file đã upload trước khi thêm field:

```bash
npx tsx src/script/backfill-drive-sizes.js
```

Script này sẽ:
1. Quét tất cả `DetailImage` không có `size` → gọi Drive API lấy size → update
2. Quét tất cả `Learn.Image` không có `size` → tương tự
3. Quét tất cả `TrialCourse` images → tương tự
4. Quét `Student.Avt` không có `AvtSize` → tương tự
5. Quét `Book.Image`/`Badge` không có `ImageSize`/`BadgeSize` → tương tự

> ⚠️ Script gọi Drive API cho từng file, có thể chạy lâu nếu có nhiều dữ liệu cũ. Nên chạy vào giờ thấp điểm.

---

## Drive usage API cũ

- `GET /api/drive-storage` — giữ nguyên, trả về danh sách folder trên Drive
- `GET /api/drive-storage/size?id=xxx` — giữ nguyên, tính size 1 folder (gọi Drive API)
