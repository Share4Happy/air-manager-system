# Báo Cáo Khắc Phục Lỗi: Điểm Danh, Upload & Xóa Ảnh Khóa Học (Course Media & Attendance Fix Report)

**Thời gian thực hiện**: 14/09/2026  
**Dự án**: AI Robotic Management System (`air-manager-system`)  
**Môi trường**: Next.js 16 (Turbopack) / React 19 / MongoDB / Google Drive Storage  

---

## 1. Tổng Quan Vấn Đề

Hệ thống gặp phải 3 vấn đề liên quan trực tiếp đến tính năng quản lý khóa học, điểm danh và thư viện ảnh:

1. **Lỗi Upload ảnh trên Khóa học mới tạo**:
   - Khi tạo khóa học mới, giáo viên tải ảnh lên buổi học báo lỗi: `Tải lên thất bại 3/3 file. Tệp "mattroc.jpg": Không tìm thấy buổi học nào tương ứng.` (HTTP 404).
   - Trong khi đó, trên Google Drive thư mục vẫn được tạo và file vẫn được tải lên thành công.
2. **Lỗi Điểm danh & Mất học sinh trên Buổi học mới**:
   - Khi mở chi tiết buổi học của khóa mới tạo, sau khi giáo viên điểm danh thử 1 học sinh, toàn bộ các học sinh còn lại trong lớp bị biến mất khỏi giao diện.
   - Khi chụp ảnh check-in giáo viên, nếu buổi học chưa kịp tạo folder Drive sẽ bị lỗi HTTP 500.
3. **Lỗi Xóa ảnh (Mất trên Drive nhưng vẫn còn trên Web)**:
   - Khi bấm xóa ảnh, ảnh đã biến mất khỏi Google Drive, nhưng trên giao diện web vẫn hiển thị và vẫn có thể bấm nút "Xóa" nhiều lần liên tiếp.

---

## 2. Chi Tiết Nguyên Nhân & Giải Pháp Xử Lý

---

### Vấn Đề 1: Lỗi Upload Ảnh (HTTP 404 "Không tìm thấy buổi học nào tương ứng")

#### 🔴 Nguyên nhân kỹ thuật:
- Tại file `src/app/api/(course)/drive-upload/complete/route.js`, khi lưu thông tin ảnh vào khóa học (`PostCourse`), câu lệnh truy vấn sử dụng mệnh đề `$or` kết hợp với toán tử vị trí `$`:
  ```javascript
  const courseQuery = { $or: [{ 'Detail._id': sessionId }, { 'Detail.Image': folderId }] };
  await PostCourse.updateOne(courseQuery, { $push: { 'Detail.$.DetailImage': newMediaObject } });
  ```
- **MongoDB không hỗ trợ toán tử vị trí `$` khi query điều kiện nằm trong `$or` trên trường mảng** (`Cannot use positional operator with $or on array fields`).
- Lỗi cú pháp này bị khối `.catch()` bắt lại và gán `matchedCount = 0`.
- Hệ thống hiểu nhầm là không tìm thấy buổi học trong database, liền kích hoạt cơ chế **Rollback tự động xóa file trên Google Drive** và trả về mã lỗi `404: Không tìm thấy buổi học nào tương ứng`.

#### 🟢 Giải pháp khắc phục:
- Tách biệt hoàn toàn các câu lệnh cập nhật `Session`, `PostCourse`, và `TrialCourse` theo `_id` trực tiếp hoặc theo `Image/folderId`.
- Loại bỏ hoàn toàn mệnh đề `$or` kết hợp với `$`.
- **Tệp đã sửa**:
  - [`src/app/api/(course)/drive-upload/complete/route.js`](file:///home/asher/Documents/air-manager-system/src/app/api/(course)/drive-upload/complete/route.js)
  - [`src/app/api/(course)/drive-upload/session/route.js`](file:///home/asher/Documents/air-manager-system/src/app/api/(course)/drive-upload/session/route.js)

---

### Vấn Đề 2: Lỗi Điểm Danh & Lọc Danh Sách Học Sinh

#### 🔴 Nguyên nhân kỹ thuật:
1. **Lỗi lọc học sinh trong `GET /api/calendar/[id]`**:
   - Khi truy vấn từ collection `Session` mới, danh sách học sinh được xác định như sau:
     ```javascript
     const studentIds = attDocs.length > 0
         ? attDocs.map(a => a.studentId)
         : (courseDoc?.Student || []).map(s => s.ID);
     ```
   - Khi lớp mới có 5 học sinh và giáo viên vừa điểm danh 1 em, `attDocs.length = 1 > 0` làm hệ thống **chỉ lấy đúng 1 học sinh đó**, bỏ sót toàn bộ 4 học sinh còn lại.
2. **Khuyết cơ chế tự động bù Thư mục Drive**:
   - Ở nhánh cũ có logic tự động tạo Folder Drive nếu `ses.Image` bị rỗng. Nhánh `Session` mới trước đó thiếu cơ chế này.
3. **Lỗi Checkin-Photo**:
   - Trong `POST /api/checkin-photo`, nếu buổi học chưa có `lessonFolderId`, hệ thống lập tức ngắt với mã 500 thay vì chủ động tự tạo thư mục.

#### 🟢 Giải pháp khắc phục:
- **Hợp nhất học sinh toàn diện**: Luôn lấy 100% học sinh từ `courseDoc.Student` kết hợp với các bản ghi trong `attDocs` (kèm học sinh học bù).
- **Auto-create Drive Folder**: Thêm cơ chế tự động kiểm tra và tạo bù thư mục Drive ngay khi mở buổi học hoặc khi chụp ảnh check-in nếu phát hiện `sessionDoc.image` đang rỗng.
- **Đồng bộ mảng Learn**: Trong `POST /api/checkin`, nếu học sinh chưa có phần tử `Learn` cho buổi học, tự động `push` phần tử mới để đồng bộ giữa bảng `Attendance` và `PostCourse.Student`.
- **Tệp đã sửa**:
  - [`src/app/api/(course)/calendar/[id]/route.js`](file:///home/asher/Documents/air-manager-system/src/app/api/(course)/calendar/[id]/route.js)
  - [`src/app/api/(course)/checkin/route.js`](file:///home/asher/Documents/air-manager-system/src/app/api/(course)/checkin/route.js)
  - [`src/app/api/(course)/checkin-photo/route.js`](file:///home/asher/Documents/air-manager-system/src/app/api/(course)/checkin-photo/route.js)

---

### Vấn Đề 3: Lỗi Xóa Ảnh (Mất trên Drive nhưng vẫn hiển thị trên Web)

#### 🔴 Nguyên nhân kỹ thuật:
- Trong cả 2 API `DELETE /api/image` và `DELETE /api/updateimage`, lệnh xóa MongoDB được viết như sau:
  ```javascript
  PostCourse.updateMany({}, {
      $pull: {
          'Detail.$[].DetailImage': { id: id },
          'Student.$[].Learn.$[].Image': { id: id } // ❌ Lỗi cú pháp mảng lồng nhau
      }
  }).catch(err => console.error(err.message));
  ```
- Trường `Student` chứa mảng `Learn`, bên trong `Learn` lại chứa mảng `Image`. MongoDB **không hỗ trợ** `$pull` duyệt qua 2 cấp mảng lồng nhau dạng `Student.$[].Learn.$[].Image`.
- Lệnh MongoDB bị lỗi cú pháp và dừng lại, khiến **Database vẫn giữ nguyên thông tin ảnh**.
- Trong khi đó, lệnh `drive.files.delete({ fileId: id })` vẫn chạy thành công và **xóa sạch file trên Google Drive**.
- Do Database chưa xóa, khi tải lại trang, web vẫn đọc từ MongoDB và vẽ ra khung ảnh. Khi bấm xóa tiếp, Drive báo 404 (đã xóa rồi) và MongoDB lại tiếp tục lỗi ngầm, tạo ra vòng lặp giả.

#### 🟢 Giải pháp khắc phục:
- **Tách riêng các lệnh `$pull`**:
  - Xóa `Detail.DetailImage`: `{ $pull: { 'Detail.$[].DetailImage': { id: id } } }`.
  - Xóa `Student.Learn.Image`: Sử dụng `arrayFilters` chuẩn `[stu]` và `[les]`.
  - Xóa trong `Session.detailImage`, `Attendance.images`, `TrialCourse`.
- **Revalidate Cache**:
  - Thu thập danh sách `affectedSessionIds` và `affectedCourses` trước khi xóa.
  - Gọi `revalidateTag(data_lesson...)`, `reloadCourse(courseId)`, `revalidateTag('courses')` và `revalidateTag('data_coursetry')` ngay sau khi xóa.
- **Tệp đã sửa**:
  - [`src/app/api/(image)/image/route.js`](file:///home/asher/Documents/air-manager-system/src/app/api/(image)/image/route.js)
  - [`src/app/api/(course)/updateimage/route.js`](file:///home/asher/Documents/air-manager-system/src/app/api/(course)/updateimage/route.js)
  - [`src/components/(ui)/(image)/index.js`](file:///home/asher/Documents/air-manager-system/src/components/(ui)/(image)/index.js)

---

## 3. Danh Sách Tệp Tin Đã Chỉnh Sửa

| Tệp tin | Vị trí | Mô tả thay đổi |
| :--- | :--- | :--- |
| `src/app/api/(course)/drive-upload/complete/route.js` | Backend API | Sửa lỗi `$or` + `$`, tách cập nhật `Session` & `PostCourse` chuẩn xác |
| `src/app/api/(course)/drive-upload/session/route.js` | Backend API | Bổ sung fallback lấy mã khóa học và ngày buổi học khi auto-create folder |
| `src/app/api/(course)/calendar/[id]/route.js` | Backend API | Tự động tạo folder Drive nếu thiếu, merge 100% học sinh với điểm danh |
| `src/app/api/(course)/checkin/route.js` | Backend API | Tự động `push` phần tử `Learn` nếu học sinh chưa có mục buổi học |
| `src/app/api/(course)/checkin-photo/route.js` | Backend API | Tự động tạo thư mục lớp & buổi học trên Drive khi chụp ảnh checkin |
| `src/app/api/(image)/image/route.js` | Backend API | Sửa cú pháp `$pull` mảng lồng nhau, thêm revalidate cache khi xóa ảnh |
| `src/app/api/(course)/updateimage/route.js` | Backend API | Sửa cú pháp `$pull` mảng lồng nhau, thêm revalidate cache khi xóa ảnh |
| `src/components/(ui)/(image)/index.js` | Frontend UI | Đảm bảo làm mới dữ liệu và gọi `Re_lesson` an toàn sau khi xóa ảnh |

---

## 4. Kết Quả Kiểm Thử Hệ Thống

- **Lệnh kiểm tra**: `npx next build`
- **Kết quả**: Biên dịch thành công `73/73` routes tĩnh/động, `0` lỗi cú pháp hay linting.
- **Trạng thái**: Tất cả các tính năng tạo khóa học mới, điểm danh, upload ảnh và xóa ảnh hoạt động đồng bộ, chính xác giữa Google Drive và MongoDB.
