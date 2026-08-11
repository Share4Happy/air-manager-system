# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.17] - 2026-08-10

### Changed
- **Chuyển toàn bộ gửi tin Zalo từ Google Apps Script sang ZaloLite Gateway** — loại bỏ hoàn toàn 3 URL `script.google.com/macros/...` (`SEND_MESSAGE`, `GET_UID`, `ACTION`):
  - `src/function/drive/appscript.js` (chứa `senMesByPhone`, `getZaloUid`, `actionZalo`) đã bị **xoá**
  - Gateway tự resolve phone → UID khi gửi, nên không còn luồng tìm UID đồng bộ khi thêm/sửa học sinh
- **`src/function/zalolite.js`**: thêm helper dùng chung cho các route gửi:
  - `getActiveZaloAccount()` — chọn tài khoản Zalo `is_active:true` (ưu tiên cũ nhất) có `botId`
  - `extractSendUid(resp)`, `sendResponseOk(resp)`, `sendResponseError(resp)` — chuẩn hoá đọc kết quả từ gateway
- **`src/app/api/(zalo)/senduser/route.js`**: bỏ `senMesByPhone` + URL Script, gửi qua `sendByPhone(zalo.botId, ...)`; sau khi gửi thành công tự ghi lại `Uid` (nếu gateway trả về) vào học sinh. Yêu cầu học sinh có SĐT (gateway gửi theo SĐT)
- **`src/app/api/(ai)/cmt/route.js`** (gửi nhận xét buổi học): bỏ `senMesByPhone`, gửi qua `sendByPhone`, lưu lại `Uid` khi gateway resolve
- **`src/app/api/(client)/sendmes/route.js`**: giữ nguyên logic đọc/ghi Google Sheets (UID, label, row), thay khối gửi AppScript bằng `sendByPhone`
- **Thêm học sinh không còn phụ thuộc `getZaloUid`**:
  - `POST /api/student` — bỏ block gọi `getZaloUid(phone)`; không còn lỗi/cảnh báo "lấy uid thất bại" khi tạo học sinh
  - `PUT /api/student/[id]` — khi đổi SĐT chỉ cập nhật `Phone`, `Uid` được điền khi gửi tin đầu tiên
  - `customer.actions.js` (chuyển KH → học sinh) — bỏ `getZaloUid`, giữ logic còn lại

### Removed
- **Scheduler hành động `findUid` / `checkFriend`**:
  - Bỏ khỏi danh sách action trong `src/app/client/ui/run/index.js` (mặc định `sendMessage`)
  - `src/app/api/(zalo)/action/route.js`: bỏ `actionZalo` (AppScript) + `LEGACY_ACTIONS`; `processSingleTask` chỉ còn "drain" các job cũ với log giải thích rõ (gateway tự resolve uid / trạng thái bạn bè khi gửi), không gọi Script nữa
- File `src/function/drive/appscript.js` (toàn bộ URL Google Apps Script và `senMesByPhone` / `getZaloUid` / `actionZalo`)

### Notes
- Các route gửi (`senduser`, `cmt`, `sendmes`) cần tài khoản Zalo `is_active:true` có `botId` + `ZALOLITE_API_KEY` trong Cài đặt → tab ZaloLite; nếu thiếu sẽ trả lỗi rõ ràng
- `Uid` học sinh giờ được điền tự động sau lần gửi tin nhắn đầu tiên qua gateway (thay vì tìm trước khi tạo)
- Job lịch trình `findUid`/`checkFriend` còn đang chạy sẽ tự hoàn tất nhanh mà không gửi tin nhắn không mong muốn

### Verification
- `npx next build` passes successfully (✓ Compiled successfully)
- `rg "appscript|script.google.com|getZaloUid|senMesByPhone|actionZalo" src` — không còn tham chiếu nào trong mã nguồn
- Response `/api/senduser` giữ đúng hợp đồng với UI bell/cmt: thành công `{ status: 2, data: { name, uid } }` (HTTP 200), lỗi `{ status: 1, message }` (HTTP 500)

---
