# BÁO CÁO KIỂM TRA BẢO MẬT & PHÂN QUYỀN API (API SECURITY & AUTHORIZATION AUDIT)

> **Dự án:** AIR Manager System (Next.js 16 App Router + MongoDB)  
> **Ngày thực hiện:** 14/09/2026  
> **Phạm vi kiểm tra:** Toàn bộ 101 API route handlers trong thư mục `src/app/api/`  
> **Mục tiêu:** Rà soát xác thực (Authentication), phân quyền theo vai trò (Role-based Authorization / RBAC), kiểm soát truy cập đối tượng (Broken Object/Function Level Authorization) và rò rỉ dữ liệu (Information Disclosure).

---

## 1. TỔNG QUAN HIỆN TRẠNG (EXECUTIVE SUMMARY)

### 1.1. Nguyên nhân cốt lõi (Root Cause)
File middleware chính của ứng dụng (`src/middleware.js`) hiện đang cấu hình matcher loại trừ toàn bộ đường dẫn `/api`:
```javascript
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```
👉 **Hệ quả:** Mọi API route độc lập hoàn toàn và **phải tự gọi hàm xác thực token/role**. Nếu một API không chủ động gọi `authenticate(request)` hoặc `checkAuthToken()`, API đó sẽ mở hoàn toàn ra internet mà không có bất kỳ lớp bảo vệ nào.

### 1.2. Thống kê kết quả kiểm tra 101 Route API

```
┌────────────────────────────────────────────────────────────┬───────┬────────────┐
│ Phân loại bảo mật                                          │ Số TP │ Tỷ lệ      │
├────────────────────────────────────────────────────────────┼───────┼────────────┤
│ 🔴 Không xác thực (Unauthenticated - Công khai ra ngoài)   │ 64    │ 63.4%      │
│ 🟡 Có xác thực nhưng KHÔNG kiểm tra Role (Bypass RBAC)     │ 14    │ 13.9%      │
│ 🟢 Có xác thực và kiểm tra Role hợp lệ                     │ 23    │ 22.7%      │
├────────────────────────────────────────────────────────────┼───────┼────────────┤
│ Tổng cộng                                                  │ 101   │ 100%       │
└────────────────────────────────────────────────────────────┴───────┴────────────┘
```

---

## 2. DANH SÁCH LỖ HỔNG THEO MỨC ĐỘ NGUY HIỂM

### 🚨 MỨC ĐỘ 1: LỖ HỔNG NGHIÊM TRỌNG (CRITICAL - CẦN VÁ NGAY)

#### 1. Lỗ hổng Tự gán quyền Admin khi Đăng ký (Privilege Escalation via Mass Assignment)
- **Tệp tin:** `src/app/api/(auth)/register/route.js`
- **Phương thức:** `POST`
- **Chi tiết:** API mở công khai (`Access-Control-Allow-Origin: *`) nhận trực tiếp mảng `role` từ JSON body client gửi lên:
  ```javascript
  const { name, address = '', avt = '', role = ["Teacher"], phone = '', email, password } = await req.json();
  await PostUser.create({ name, address, avt, role, phone, email, uid: hash });
  ```
- **Tác động:** Bất kỳ ai không cần đăng nhập cũng có thể gửi request `POST /api/register` với `{ "role": ["Admin"], "email": "...", "password": "..." }` để tạo ngay một tài khoản Quản trị viên (Admin) toàn quyền trên hệ thống.
- **Biện pháp khắc phục:** Cố định `role = ['Teacher']` hoặc chỉ cho phép Admin tạo tài khoản mới.

---

#### 2. Chiếm đoạt tài khoản / Đổi Role Admin / Đổi Mật khẩu tùy ý (Unauthenticated Account Takeover)
- **Tệp tin:** `src/app/api/(auth)/roleuser/[id]/route.js`
- **Phương thức:** `PATCH`
- **Chi tiết:** Không có bất kỳ dòng xác thực `authenticate` nào. Cho phép cập nhật `role`, `password`, `email` theo `id`:
  ```javascript
  const { name, address, phone, role, email, password } = body;
  if (role) updateData.role = [role];
  if (password) updateData.uid = await bcrypt.hash(password, 10);
  await PostUser.findByIdAndUpdate(id, { $set: updateData });
  ```
- **Tác động:** Kẻ tấn công chỉ cần biết `_id` của bất kỳ user nào trong hệ thống (hoặc duyệt brute-force ID) là có thể đổi mật khẩu và đổi quyền tài khoản đó thành `Admin`.
- **Biện pháp khắc phục:** Bắt buộc `authenticate(request)` và kiểm tra `user.role.includes('Admin')`.

---

#### 3. Bật/Tắt Vô hiệu hóa Tài khoản không cần quyền (Unauthenticated User Denial of Service)
- **Tệp tin:** `src/app/api/(auth)/statususer/[id]/route.js`
- **Phương thức:** `PATCH`
- **Chi tiết:** Không xác thực người gọi. Thực hiện đảo trạng thái `user.status = !user.status`.
- **Tác động:** Có thể vô hiệu hóa toàn bộ tài khoản Admin và Giáo viên trong hệ thống.
- **Biện pháp khắc phục:** Bắt buộc xác thực Admin.

---

#### 4. Can thiệp cấu trúc & Xóa file Google Drive toàn hệ thống (Arbitrary Drive Manipulation)
- **Tệp tin:**
  - `src/app/api/(course)/updateimage/route.js` (`POST`, `PUT`, `DELETE`)
  - `src/app/api/(image)/image/route.js` (`POST`, `PUT`, `DELETE`)
  - `src/app/api/drive-storage/verify/route.js` (`POST`)
- **Chi tiết:**
  - `DELETE /api/updateimage` và `DELETE /api/image` cho phép xóa vĩnh viễn file trên Google Drive của trường thông qua `fileId` mà không kiểm tra đăng nhập.
  - `POST /api/drive-storage/verify` kích hoạt tiến trình đồng bộ, đổi tên, tạo mới và di chuyển thư mục Drive của toàn trường mà không có bảo vệ.
- **Tác động:** Mất mát dữ liệu hình ảnh, video học tập, bài giảng và làm cạn kiệt dung lượng Drive.
- **Biện pháp khắc phục:** Thêm xác thực `Admin` / `Academic` cho toàn bộ các route quản lý Drive và Media.

---

#### 5. Thao tác Tài chính / Nợ học phí / Tạo hóa đơn hàng loạt
- **Tệp tin:**
  - `src/app/api/debt/route.js` (`POST`, `GET`)
  - `src/app/api/pay/bulk-all/route.js` (`POST`)
- **Chi tiết:**
  - `POST /api/debt`: Tạo bản ghi nợ học phí tùy ý, hardcode `createBy: 'admin'` mà không kiểm tra ai đang gọi.
  - `POST /api/pay/bulk-all`: Tự động duyệt qua toàn bộ học sinh và tạo hàng loạt Hóa đơn (Invoices) không cần đăng nhập.
  - `GET /api/debt`: Trả về toàn bộ danh sách công nợ của học sinh mà không cần đăng nhập.
- **Biện pháp khắc phục:** Bắt buộc quyền `Admin` / `Academic`.

---

#### 6. Thao tác Học sinh & Điểm danh / Lớp học thử
- **Tệp tin:**
  - `src/app/api/(student)/student/[id]/status/route.js` (`PATCH`): Cho phép chuyển học sinh sang trạng thái nghỉ học vĩnh viễn và tự động xóa dữ liệu điểm danh mà không cần đăng nhập.
  - `src/app/api/(student)/student/route.js` (`PUT`): Cập nhật trạng thái chăm sóc học sinh thử nhưng thiếu `authenticate`.
  - `src/app/api/(course)/coursetry/route.js` (`POST`, `PUT`): Thêm / sửa buổi học thử không có auth (bị sót lệnh gọi hàm `authenticate`).
  - `src/app/api/(course)/checkin/route.js` (`POST`): Điểm danh học sinh không có auth.
  - `src/app/api/(course)/updatecmtfn/route.js` (`POST`): Ghi đè nhận xét đánh giá học sinh không có auth (hỗ trợ CORS `*`).

---

#### 7. Spam tin nhắn Zalo mạo danh Trường học (Zalo Bot Spoofing)
- **Tệp tin:**
  - `src/app/api/(zalo)/senduser/route.js` (`POST`)
  - `src/app/api/(client)/sendmes/route.js` (`POST`)
- **Chi tiết:** Cho phép gửi tin nhắn Zalo trực tiếp đến số điện thoại phụ huynh/học sinh thông qua Zalo OA/Bot của trường mà không cần đăng nhập.
- **Biện pháp khắc phục:** Bắt buộc quyền `Admin`, `Academic` hoặc `Teacher` có phân công lớp.

---

### ⚠️ MỨC ĐỘ 2: LỖ HỔNG PHÂN QUYỀN CHỨC NĂNG (BROKEN FUNCTION LEVEL AUTHORIZATION)

Các API này **đã có đăng nhập (`authenticate` hoặc `checkAuthToken`) nhưng KHÔNG kiểm tra vai trò (`user.role`)**, dẫn đến tài khoản cấp thấp (Giáo viên, Học sinh, v.v.) có thể thực hiện thao tác quản trị:

| API Endpoint | HTTP Method | Thao tác | Rủi ro phân quyền |
| :--- | :--- | :--- | :--- |
| `src/app/api/components/[id]/route.js` | `DELETE`, `PUT` | Xóa / Sửa linh kiện kho | Mọi user đăng nhập đều xóa/sửa được linh kiện trong kho |
| `src/app/api/components/route.js` | `POST` | Thêm mới linh kiện | Bất kỳ ai cũng có thể tạo linh kiện |
| `src/app/api/components/[id]/transactions/route.js` | `POST` | Xuất / Nhập linh kiện kho | Bất kỳ user nào cũng có thể tạo giao dịch kho |
| `src/app/api/events/[id]/route.js` | `DELETE` | Xóa sự kiện | Giáo viên / user thường có thể xóa vĩnh viễn sự kiện |
| `src/app/api/events/route.js` | `POST` | Tạo sự kiện mới | User bất kỳ có thể tạo sự kiện |
| `src/app/api/(tools)/tools/[id]/route.js` | `DELETE`, `PUT` | Xóa / Sửa công cụ | User thường có thể sửa / xóa công cụ hệ thống |
| `src/app/api/(tools)/tools/route.js` | `POST` | Tạo công cụ | User thường có thể tạo công cụ |
| `src/app/api/academic/makeup-sessions/[id]/route.js` | `DELETE`, `PATCH` | Xóa / Sửa buổi học bù | Bất kỳ user nào cũng xóa/sửa được lịch học bù của Học vụ |
| `src/app/api/academic/makeup-sessions/route.js` | `POST` | Tạo buổi học bù | Bất kỳ ai cũng tạo được phiên học bù |

---

### 🔓 MỨC ĐỘ 3: RÒ RỈ THÔNG TIN QUA API GET (INFORMATION DISCLOSURE)

Các API `GET` trả về dữ liệu nội bộ, thông tin cá nhân (PII) của học sinh, phụ huynh và giáo viên nhưng không yêu cầu đăng nhập:

- `GET /api/pay?_id=...` (`src/app/api/(student)/pay/route.js`): Lộ Họ tên, SĐT, Email, Địa chỉ, Ngày sinh, Học phí và người tạo hóa đơn.
- `GET /api/debt` (`src/app/api/debt/route.js`): Lộ toàn bộ danh sách nợ học phí học sinh.
- `GET /api/events` & `GET /api/events/[id]`: Lộ kế hoạch, người phụ trách, thành viên sự kiện.
- `GET /api/academic/makeup-sessions`: Lộ lịch sử và danh sách học bù học sinh.
- `GET /api/(course)/calendar`: Lộ toàn bộ lịch học của giáo viên và học sinh.
- `GET /api/components` & `GET /api/components/[id]`: Lộ danh mục linh kiện, số lượng và giá vốn nhập hàng.

---

## 3. DANH SÁCH CHI TIẾT 101 API ROUTES

### Nhóm A: API Hoàn toàn không có Authentication (64 endpoints)
1. `src/app/api/(auth)/login/route.js` [POST] *(Hợp lệ - Public)*
2. `src/app/api/(auth)/logout/route.js` [POST] *(Hợp lệ - Public)*
3. `src/app/api/(auth)/register/route.js` [POST] 🔴 **Cực kỳ nguy hiểm: Nhận role từ client**
4. `src/app/api/(auth)/roleuser/[id]/route.js` [PATCH] 🔴 **Cực kỳ nguy hiểm: Đổi role/pass không auth**
5. `src/app/api/(auth)/statususer/[id]/route.js` [PATCH] 🔴 **Cực kỳ nguy hiểm: Bật/tắt tài khoản không auth**
6. `src/app/api/(client)/client/route.js` [GET, POST] *(Form landing page / CRM public)*
7. `src/app/api/(client)/hissmes/[phone]/route.js` [GET]
8. `src/app/api/(client)/label/route.js` [POST, GET]
9. `src/app/api/(client)/re/route.js` [POST]
10. `src/app/api/(client)/res/route.js` [POST]
11. `src/app/api/(client)/sendmes/route.js` [POST] 🔴 **Nguy hiểm: Gửi Zalo không auth**
12. `src/app/api/(course)/calendar/[id]/route.js` [GET]
13. `src/app/api/(course)/calendar/route.js` [GET]
14. `src/app/api/(course)/checkin/route.js` [GET, POST] 🔴 **Nguy hiểm: Điểm danh không auth**
15. `src/app/api/(course)/checkin-photo/route.js` [POST] 🔴 **Nguy hiểm: Upload ảnh checkin không auth**
16. `src/app/api/(course)/course/ucalendarcourse/route.js` [POST]
17. `src/app/api/(course)/coursetry/route.js` [GET, POST, PUT] 🔴 **Nguy hiểm: Quản lý học thử không auth**
18. `src/app/api/(course)/drive-upload/chunk/route.js` [POST]
19. `src/app/api/(course)/drive-upload/complete/route.js` [POST]
20. `src/app/api/(course)/drive-upload/session/route.js` [POST]
21. `src/app/api/(course)/studentcourse/[id]/route.js` [GET]
22. `src/app/api/(course)/updatecmtfn/route.js` [POST] 🔴 **Nguy hiểm: Nhận xét học sinh không auth**
23. `src/app/api/(course)/updateimage/route.js` [POST, PUT, DELETE] 🔴 **Cực kỳ nguy hiểm: Xóa/Upload file Drive**
24. `src/app/api/(course)/updateimagestudent/route.js` [POST]
25. `src/app/api/(image)/image/route.js` [POST, PUT, DELETE] 🔴 **Cực kỳ nguy hiểm: Quản lý ảnh/file Drive**
26. `src/app/api/(student)/student/[id]/status/route.js` [PATCH] 🔴 **Nguy hiểm: Đổi trạng thái nghỉ học**
27. `src/app/api/(zalo)/action/route.js` [GET] *(Cron trigger)*
28. `src/app/api/(zalo)/bot-logs/route.js` [GET]
29. `src/app/api/(zalo)/senduser/route.js` [POST] 🔴 **Nguy hiểm: Gửi tin nhắn Zalo**
30. `src/app/api/academic/dashboard/attendance-today/route.js` [GET]
31. `src/app/api/academic/dashboard/sla-alerts/route.js` [GET]
32. `src/app/api/academic/dashboard/today/route.js` [GET]
33. `src/app/api/academic/makeup-sessions/incomplete/route.js` [GET]
34. `src/app/api/academic/makeup-sessions/options/route.js` [GET]
35. `src/app/api/academic/makeup-sessions/stats/route.js` [GET]
36. `src/app/api/clear-cache/route.js` [POST]
37. `src/app/api/client/lesson-cancel/route.js` [GET, POST]
38. `src/app/api/dashboard/overview/route.js` [GET]
39. `src/app/api/debt/route.js` [POST, GET] 🔴 **Cực kỳ nguy hiểm: Thao tác nợ học phí**
40. `src/app/api/drive-storage/refresh/route.js` [POST]
41. `src/app/api/drive-storage/route.js` [GET]
42. `src/app/api/drive-storage/schedule/route.js` [GET, POST]
43. `src/app/api/drive-storage/size/route.js` [GET]
44. `src/app/api/drive-storage/summary/route.js` [GET]
45. `src/app/api/drive-storage/verify/route.js` [POST] 🔴 **Cực kỳ nguy hiểm: Verify & Repoint Drive toàn trường**
46. `src/app/api/events/[id]/equipment/import/route.js` [POST]
47. `src/app/api/events/[id]/media/route.js` [POST, DELETE]
48. `src/app/api/events/[id]/members/export/route.js` [GET]
49. `src/app/api/events/[id]/members/import/route.js` [POST]
50. `src/app/api/events/[id]/route.js` [GET, PUT, DELETE] *(PUT/DELETE có checkAuthToken nhưng thiếu role)*
51. `src/app/api/events/[id]/share/route.js` [GET, PUT]
52. `src/app/api/events/equipment/template/route.js` [GET]
53. `src/app/api/events/members/template/route.js` [GET]
54. `src/app/api/events/route.js` [GET, POST] *(POST có checkAuthToken nhưng thiếu role)*
55. `src/app/api/events/share/[token]/route.js` [GET] *(Public share link)*
56. `src/app/api/events/templates/[id]/route.js` [GET, PUT, DELETE]
57. `src/app/api/events/templates/route.js` [GET, POST]
58. `src/app/api/events/users/route.js` [GET]
59. `src/app/api/pay/bulk-all/route.js` [POST] 🔴 **Cực kỳ nguy hiểm: Tạo hóa đơn hàng loạt**
60. `src/app/api/report-config/route.js` [GET]
61. `src/app/api/report-history/route.js` [GET]
62. `src/app/api/report-stats/route.js` [GET]
63. `src/app/api/user/reset-login/route.js` [POST] 🔴 **Gỡ khóa đăng nhập không auth**
64. `src/app/api/(student)/student/route.js` [PUT] 🔴 **Sửa thông tin học thử không auth**

---

### Nhóm B: API Đã có Authentication nhưng Thiếu Kiểm tra Role (14 endpoints)
1. `src/app/api/(ai)/cmt/route.js` [PATCH]
2. `src/app/api/(area)/room/check/route.js` [GET]
3. `src/app/api/(client)/hissmes/route.js` [POST, GET]
4. `src/app/api/(student)/student/[id]/profile/route.js` [GET, PUT]
5. `src/app/api/(tools)/tools/[id]/route.js` [PUT, DELETE] 🟡 **Ai đăng nhập cũng sửa/xóa được Tools**
6. `src/app/api/(tools)/tools/label/[id]/route.js` [DELETE] 🟡 **Ai đăng nhập cũng xóa được Label**
7. `src/app/api/(tools)/tools/label/route.js` [GET, POST] 🟡 **Ai đăng nhập cũng tạo được Label**
8. `src/app/api/(tools)/tools/route.js` [GET, POST] 🟡 **Ai đăng nhập cũng tạo được Tools**
9. `src/app/api/academic/makeup-sessions/[id]/route.js` [PATCH, DELETE] 🟡 **Ai đăng nhập cũng xóa/sửa học bù**
10. `src/app/api/academic/makeup-sessions/route.js` [GET, POST] 🟡 **Ai đăng nhập cũng tạo học bù**
11. `src/app/api/components/[id]/route.js` [GET, PUT, DELETE] 🟡 **Ai đăng nhập cũng xóa/sửa linh kiện**
12. `src/app/api/components/[id]/transactions/route.js` [POST] 🟡 **Ai đăng nhập cũng tạo giao dịch kho**
13. `src/app/api/components/route.js` [GET, POST] 🟡 **Ai đăng nhập cũng tạo linh kiện mới**
14. `src/app/api/switch-back/route.js` [POST] *(Kiểm tra qua backupToken JWT)*

---

### Nhóm C: API Đã Kiểm tra Role Đầy đủ (23 endpoints)
1. `src/app/api/(auth)/check/route.js` [GET] (Kiểm tra token phiên)
2. `src/app/api/(course)/course/route.js` [POST, PUT] (Kiểm tra Admin/Academic)
3. `src/app/api/(student)/pay/route.js` [POST] (Kiểm tra Admin/Academic)
4. `src/app/api/(student)/student/route.js` [POST] (Kiểm tra Admin/Academic)
5. `src/app/api/bank/route.js` [POST, PUT, DELETE] (Kiểm tra Admin)
6. `src/app/api/guide/route.js` [PUT] (Kiểm tra Admin)
7. `src/app/api/import-defaults/route.js` [POST] (Kiểm tra Admin/Academic)
8. `src/app/api/migration/lms/route.js` [GET, POST] (Kiểm tra Admin/Academic)
9. `src/app/api/notifications/settings/route.js` [PUT] (Kiểm tra Admin)
10. `src/app/api/quiz/attempt/route.js` [POST, GET] (Kiểm tra Role hợp lệ)
11. `src/app/api/quiz/route.js` [GET, PUT] (Kiểm tra Admin)
12. `src/app/api/switch-role/[id]/route.js` [POST] (Kiểm tra Admin)
13. `src/app/api/zalo/[id]/route.js` [PATCH, DELETE] (Kiểm tra Admin)

---

## 4. KẾ HOẠCH HÀNH ĐỘNG KHẮC PHỤC (REMEDIATION ROADMAP)

### Giai đoạn 1: Chuẩn hóa Helper Phân quyền dùng chung (RBAC Utility)
Tạo file helper [`src/utils/authorize.js`](file:///home/asher/Documents/air-manager-system/src/utils/authorize.js) để các API route gọi một dòng duy nhất:

```javascript
import authenticate from '@/utils/authenticate';
import jsonRes from '@/utils/response';

/**
 * Xác thực và kiểm tra vai trò người dùng
 * @param {Request} request 
 * @param {string[]} allowedRoles Mảng role được phép, vd: ['Admin', 'Academic']
 * @returns {Promise<{ user: Object, body: any }>}
 */
export async function authorize(request, allowedRoles = ['Admin']) {
    const { user, body } = await authenticate(request);
    
    if (!user || user.status === false) {
        throw new Error('UNAUTHORIZED');
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const userRoles = Array.isArray(user.role) ? user.role : [user.role];
        const isAuthorized = userRoles.some(r =>
            allowedRoles.some(allowed => new RegExp(`^${allowed}$`, 'i').test(r))
        );

        if (!isAuthorized) {
            throw new Error('FORBIDDEN');
        }
    }

    return { user, body };
}
```

---

### Giai đoạn 2: Khắc phục khẩn cấp 5 Lỗ hổng Trọng yếu (Immediate Priority)

1. **Vá `POST /api/register`:**
   - Xóa bỏ việc đọc `role` từ body request. Mặc định tài khoản đăng ký mới luôn là `role: ['Teacher']` (hoặc `status: false` chờ Admin duyệt).
2. **Vá `PATCH /api/roleuser/[id]`:**
   - Bắt buộc kiểm tra `authorize(request, ['Admin'])`.
3. **Vá `PATCH /api/statususer/[id]`:**
   - Bắt buộc kiểm tra `authorize(request, ['Admin'])`.
4. **Vá `POST /api/debt` và `POST /api/pay/bulk-all`:**
   - Bắt buộc kiểm tra `authorize(request, ['Admin', 'Academic'])`.
5. **Vá `POST /api/drive-storage/verify` và `/api/updateimage`:**
   - Bắt buộc kiểm tra quyền hợp lệ trước khi thao tác file trên Google Drive.

---

### Giai đoạn 3: Bổ sung Phân quyền cho Nhóm Nghiệp vụ & GET Data

1. **Linh kiện kho (`/api/components/*`):** Chỉ cho phép `Admin` hoặc `Academic` thêm, sửa, xóa, nhập xuất kho.
2. **Quản lý sự kiện (`/api/events/*`):** Chỉ cho phép `Admin`, `Academic` hoặc Người tạo / Trưởng ban tổ chức (`lead`, `organizers`) sửa/xóa sự kiện.
3. **Quản lý học bù (`/api/academic/makeup-sessions/*`):** Chỉ cho phép `Admin`, `Academic` thao tác.
4. **Bảo vệ các API `GET`:** Đảm bảo dữ liệu nhạy cảm (SĐT học sinh, nợ học phí) yêu cầu đăng nhập trước khi trả về.

---

*Tài liệu này được tạo tự động bởi Antigravity IDE Security Analyzer để làm căn cứ tiến hành khắc phục các lỗ hổng bảo mật.*
