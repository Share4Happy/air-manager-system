# Sửa: buổi bù thiếu "Thư viện hình ảnh & video" ở trang buổi học

> **Trạng thái: ĐÃ TRIỂN KHAI** — mã nguồn tại `src/app/api/(course)/calendar/[id]/route.js` (2026-08-11).

## Vấn đề

Trang buổi học `/calendar/{lessonId}` (ví dụ `/calendar/6a59a79382244460f372fbb9`) không hiển thị
ô **"Hình ảnh & Video"** (thư viện tải lên) đối với các buổi bù ("Học bù").

## Nguyên nhân

- Ô "Hình ảnh & Video" là component `ImageUploader` (`src/app/calendar/[id]/ui/formimage/index.js`).
- `ImageUploader` chỉ render khi:
  1. `course.Version !== 0` (trang buổi học `src/app/calendar/[id]/ui/main/index.js:275,290`).
  2. `session.Image` có id folder Google Drive; nếu rỗng thì `ImageUploader` trả về `null`
     (`formimage/index.js:637`) → không hiện gì.
- Buổi bù được tạo ở `src/app/api/(course)/course/ucalendarcourse/route.js` có tạo folder Drive
  (`Image`), nhưng nếu việc tạo folder bị lỗi (bị `catch`, `imageURL = ''`) hoặc buổi bù được tạo
  từ trước khi có logic tạo folder thì `Detail.Image` rỗng → thư viện biến mất.

## Giải pháp

Tự động tạo folder Drive khi buổi học thiếu `Image` (lazy fix), tại
`src/app/api/(course)/calendar/[id]/route.js` — nhánh khóa học chính thức.

### 1. Import thêm

```js
import { getDriveClient, createDriveFolder, lessonFolderName } from '@/function/drive/folder';
import { reloadCourse } from '@/data/actions/reload';
import { revalidateTag } from 'next/cache';
```

### 2. Thêm helper tìm/tạo folder lớp

```js
const PARENT_FOLDER_ID = process.env.DRIVE_COURSE_FOLDER_ID;

async function findOrCreateClassFolder(drive, code) {
    if (!PARENT_FOLDER_ID) return null;
    const list = await drive.files.list({
        q: `name='${code}' and '${PARENT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
    });
    if (list.data.files?.length) return list.data.files[0].id;
    return createDriveFolder(drive, code, PARENT_FOLDER_ID);
}
```

### 3. Tạo folder nếu `ses.Image` rỗng (trong nhánh `if (c)`, sau khi tìm được `ses`)

```js
if (!ses.Image) {
    try {
        const drive = getDriveClient();
        const classFolderId = await findOrCreateClassFolder(drive, c.ID);
        if (classFolderId) {
            const folderId = await createDriveFolder(drive, lessonFolderName(c.ID, ses.Day), classFolderId);
            await Course.updateOne(
                { _id: c._id, 'Detail._id': id },
                { $set: { 'Detail.$.Image': folderId } }
            );
            ses.Image = folderId;
            reloadCourse(c._id);
            revalidateTag(`data_lesson${id}`);
        }
    } catch (err) {
        console.error('[SESSION_GET] ensure lesson folder:', err);
    }
}
```

- Bọc `try/catch` để nếu Drive lỗi vẫn trả về trang bình thường.
- Chỉ chạy khi `Image` rỗng → không ảnh hưởng các buổi đã có folder.
- Khi `Image` đã có folder, `ImageUploader` hiện ra và hoạt động tải lên bình thường
  (upload dùng `session.Image` làm `folderId`; nút "Đi tới Drive" cũng dùng nó).

## Phạm vi

- Chỉ sửa nhánh khóa học chính thức trong `calendar/[id]/route.js`.
- Không đổi trang khóa học `/course/{courseId}/{lessonId}` (chỉ hiển thị ảnh đã có —
  sẽ tự xuất hiện sau khi tải lên ở trang buổi học).
- Không đổi buổi học thử (trial) — luôn có `folderId` từ luồng tạo.

## Kiểm chứng

- `npx next build`
- Mở trang buổi bù `/calendar/{lessonId}` → thấy ô "Hình ảnh & Video", tải lên ảnh thành công
  (file vào folder Drive tạo tự động).
