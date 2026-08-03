# Zalo Message Handling Audit & Implementation Plan

**Ngày:** 03/08/2026  
**Phiên bản:** 2.1.14 (proposed)  
**Trạng thái:** Kế hoạch (plan)

---

## Tóm Tắt Điều Điện

Tài liệu này ghi nhận kết quả audit toàn bộ codebase về khả năng xử lý tin nhắn Zalo, dựa trên cấu trúc API Gateway "ZaloLite" do người dùng cung cấp. 

**Kết quả chính:** Hệ thống hiện tại **chỉ gửi** tin nhắn Zalo (qua Google Apps Script). **Không có** webhook receiver, **không có** logic parse `content.type`, và **không có** component nào render nhiều loại tin nhắn khác nhau. Toàn bộ nội dung tin nhắn (messageTemplate, log.message) được lưu và render dưới dạng **chuỗi văn bản thuần**.

---

## 1. Files Import Module Zalo Liên Quan

**Kết quả: KHÔNG CÓ** `zalo-sdk`, `zalosdk`, `ZaloApi`, `ZaloOa`, `ZaloClient` hay bất kỳ SDK Zalo chính thức nào được import. Các import "zalo" duy nhất trong hệ thống:

| File | Dòng | Import |
|---|---|---|
| `src/models/users.js` | 1 | `import Zalo from '@/app/client/ui/zalo'` — dead/circular import, never used ⚠️ |
| `src/data/database/zalo.js` | 1 | `import Zalo from '@/models/zalo'` — Mongoose model |
| `src/data/actions/get.js` | 12, 14 | `import { getZaloAll, getZaloOne }` + `import '@/models/zalo'` |
| `src/app/actions/schedule.actions.js` | 4 | `import ZaloAccount from "@/models/zalo"` |
| `src/app/actions/zalo.actions.js` | 6 | `import ZaloAccount from '@/models/zalo'` |
| `src/app/api/zalo/[id]/route.js` | 4 | `import ZaloAccount from '@/models/zalo'` |
| `src/app/api/(zalo)/action/route.js` | 3 | `import ZaloAccount from "@/models/zalo"` |

### Gửi Zalo qua Google Apps Script (Không SDK)
File `src/function/drive/appscript.js` (dòng 1-3) hardcode 3 URL Apps Script:
- `SCRIPT_URL_SEND_MESSAGE` → `senMesByPhone()` (gửi tin nhắn)
- `SCRIPT_URL_GET_UID` → `getZaloUid()` (tìm UID)
- `SCRIPT_URL_ACTION` → `actionZalo()` (hành động khác)

Một URL Apps Script thứ tư được hardcode trong `src/app/actions/zalo.actions.js` (dòng 11) dùng cho việc thêm tài khoản.

---

## 2. Webhook Handler Cho Tin Nhắn Zalo

**Kết quả: KHÔNG CÓ.** Tìm kiếm toàn bộ `webhook`, `message.new`, `messages.new`, `oa.message`, `incoming`, `callback`, `subscribe`, `listen`, `ZaloOa` trả về **0 kết quả**. Không có endpoint nào nhận tin nhắn đến từ Zalo.

### Các Route API Zalo Hiện Có

| File | Phương thức | Mục đích |
|---|---|---|
| `src/app/api/(zalo)/action/route.js` | **GET** | Scheduler tick — xử lý task đúng giờ bằng `actionZalo()` (Apps Script). **Không phải webhook**. |
| `src/app/api/(zalo)/bot-logs/route.js` | **GET** | Lấy log gửi tin từ collection `logmes`. |
| `src/app/api/(zalo)/senduser/route.js` | **POST** | Gửi 1 tin nhắn Zalo cho học sinh theo ID. Gọi `senMesByPhone()`. |
| `src/app/api/zalo/[id]/route.js` | **PATCH/DELETE** | Quản lý cấu hình tài khoản Zalo. |
| `src/app/api/(student)/student/route.js` | **POST** | Tạo học sinh; gọi `getZaloUid()`. |
| `src/app/api/(student)/student/[id]/route.js` | **PUT/PATCH** | Cập nhật học sinh; gọi `getZaloUid()` khi số đổi. |
| `src/app/api/(ai)/cmt/route.js` | **POST** | Gửi bình luận giáo viên qua `senMesByPhone()`. |
| `src/app/api/(client)/sendmes/route.js` | **POST** | Gửi tin Zalo qua Google Sheets lookup + Apps Script. |
| `src/app/api/(client)/hissmes/route.js` | **POST/GET** | Lưu/lấy lịch sử gửi thủ công (`SendHistory`). |
| `src/app/api/(client)/hissmes/[phone]/route.js` | **GET** | Lọc lịch sử gửi theo số điện thoại. |

---

## 3. Components/Utilities Parse `content.type`

**Kết quả: KHÔNG CÓ** cho **message content types**. Không có code nào parse `content.type` như `chat.text`, `chat.photo`, `chat.file`, `chat.voice`, `chat.video`, `chat.link`, `chat.sticker`, v.v. Mỗi message content đều là một chuỗi (`messageTemplate: String`).

Gần nhất là **response parse từ Google Apps Script** trong `src/app/api/(zalo)/action/route.js`:
- `apiResponse.content?.error_code` (dòng 83, 94, 115)
- `apiResponse.content?.error_message` (dòng 84, 120)
- `apiResponse.content.data.avatar` (dòng 98), `.zalo_name` (dòng 99), `.uid` (dòng 103)
- `apiResponse.status` (boolean), `apiResponse.message` (string)

Logic nhánh theo error code trong `processSingleTask` (`src/app/api/(zalo)/action/route.js:94-135`):
- `errorCode === 0` → findUid thành công (cập nhật avatar/name/UID)
- `[216, 212, 219]` → findUid thất bại (set `uid: null`)
- `checkFriend` → parse `Number(apiResponse.content?.error_message)` làm trạng thái bạn bè (1=bạn, 0=không)

---

## 4. Message Type Constants/Enum Hiện Tại

Hai loại "type" enum — **không liên quan** đến content type Zalo:

### Action Type Enums (thao tác, KHÔNG phải content type)

| File | Dòng | Giá trị enum |
|---|---|---|
| `src/models/log.js` | 17 | `["sendMessage", "addFriend", "findUid", "checkFriend"]` |
| `src/models/schedule.js` | 25 | `["sendMessage", "addFriend", "findUid", "checkFriend"]` |
| `src/models/notification.js` | 49 | index `{ type: 1, createdAt: -1 }` — notification type |
| `src/models/historyClient.js` | 14 | `type: { default: 'Khách hàng' }` — recipient label |

Mapping action type → nhãn hiển thị (bị trùng lặp ở 4 file khác nhau — chưa tập trung):

| File | Dòng | Mapping |
|---|---|---|
| `src/app/client/ui/bot-logs/index.js` | 5-10, 12-17 | `sendMessage`→"Gửi tin" (blue), `addFriend`→"Kết bạn" (green), `findUid`→"Tìm UID" (purple), `checkFriend`→"Kiểm tra bạn" (orange) |
| `src/app/client/ui/hisotry/index.js` | 10-17 | `sendMessage`→"Gửi Tin", `addFriend`→"Kết bạn", `findUid`→"Tìm UID" |
| `src/app/client/ui/action/index.js` | 27-33 | Tương tự trên |
| `src/app/client/ui/table/row.js` | 17-24 | `sendMessage`→"Gửi Tin Nhắn", `addFriend`→"Kết Bạn" |
| `src/app/client/ui/run/index.js` | 134-148 | Dropdown: "Tìm kiếm UID", "Gửi tin nhắn Zalo", "Gán người phụ trách", "Kiểm tra bạn bè", "Gửi kết bạn" |

**KHÔNG CÓ constant nào** cho Zalo inbound message content type.

---

## 5. Models Lưu Dữ Liệu Zalo Conversation/Message

| File | Model/Collection | Trường liên quan | Mục đích |
|---|---|---|---|
| `src/models/zalo.js` | `ZaloAccountSchema` / `zaloaccount` | `uid`, `name`, `phone`, `avt`, `rateLimitPerHour`, `action[]`, `roles[]`, `proxy` | Cấu hình tài khoản — **không có conversations/messages** |
| `src/models/log.js` | `logs` / `logmes` | `status` (schema: `{status, message, data}`), `type` (action enum), `createdAt`, `createBy`, `customer`, `student`, `zalo`, `schedule` | Lưu **kết quả của từng cuộc gọi Zalo API**. Gần như là message log nhưng lưu API call results, không lưu inbound conversation threads |
| `src/models/schedule.js` | `ScheduledJobSchema` / `scheduledjob` | `jobName`, `actionType` (enum), `zaloAccount` (ref), `config: {messageTemplate, actionsPerHour}`, `tasks: [{person, history, status, scheduledFor}]`, `statistics` | Lưu **lịch gửi** và tracking per-recipient. `tasks[].person.uid` là mảng `{zalo, uid, isFriend, isReques}` |
| `src/models/historyClient.js` | `sendHistorySchema` / `SendHistory` | `sentAt`, `sentBy` (ref User), `message` (string), `labels`, `type`, `recipients: [{phone, status, error}]` | Lưu **lịch sử gửi thủ công**. Lưu nội dung gửi ra (plain string), không lưu response từ Zalo server |
| `src/models/customer.js` | `FormSchema` / `customer` | `uid: [{zalo (ref user), uid, isFriend, isReques}]`, `zaloavt`, `zaloname`, `care: [{content, createBy, createAt}]`, `status` (0-4) | Lưu **UID Zalo per khách hàng** + ghi chú chăm sóc. `uid` array map mỗi tài khoản Zalo tới UID người nhận |
| `src/models/users.js` | User model | `zalo: {type, ref: 'zaloaccount'}` (30-31) | Liên kết user (nhân viên) tới active Zalo account |
| `src/models/student.js` | Student model | `Uid: String` (theo docs/report-drive.md dòng 203) | Lưu Zalo UID cho học sinh |

### Cấu trúc response từ Google Apps Script đã parse
Trong `src/app/api/(zalo)/action/route.js` (dòng 77-93), `logPayload` lưu:
```
logPayload = {
  message: String,           // nội dung tin nhắn format
  status: {                  // nested RoomSchema
    status: Boolean,         // true=success, false=failed
    message: String,         // thông điệp result
    data: { error_code, error_message }
  },
  type: String,              // actionType enum
  ...
}
```

---

## 6. Components Hiển Thị Nội Dung Tin Nhắn

| File | Component | Render gì | Dòng |
|---|---|---|---|
| `src/app/client/ui/bot-logs/index.js` | `BotLogs` | Table log: thời gian, tài khoản Zalo (avatar/name), action type (badge màu), target (tên+SĐT khách hàng/học sinh), kết quả, **message content** (`log.message`) | 55-155, 102-134 |
| `src/app/client/ui/hisotry/index.js` | `HistoryItem`, `ScheduleDetailsView` | Tóm tắt job: tên, người tạo, Zalo account, action type, thời gian hoàn thành, statistics + `job.config.messageTemplate` dạng blockquote | 19-52, 78-112 |
| `src/app/client/ui/action/index.js` | `ActionDetailItem` | Tiến độ job: tên, người tạo, Zalo account, action type, progress bar (completed/total), thời gian còn lại, **message template** dạng blockquote, nút cancel | 61-93, dòng 86 |
| `src/app/client/ui/table/row.js` | `HistoryLogItem` | Hiển thị message `log.message` (dòng 64-71) chỉ khi type không phải `findUid`/`checkFriend`. Action type name, avatar Zalo, executor, timestamp, status (success/failed + error message) | 16-75 |
| `src/app/course/[...id]/ui/bell/index.js` | `AnnounceStudent` | Gửi thông báo: textarea với placeholder `{namestudent}`/`{nameparents}`, chọn student, progress/send icons | 72-293. Gửi plain text only qua `/api/senduser` với `mes` (string) |
| `src/app/client/ui/run/index.js` | `ActionForm` > `MessageEditor` | Editor textarea với autocomplete `{variant}`, action dropdown | 49-118, 234-238 |

### Quan sát quan trọng
**Mọi component render message content đều dùng plain text** (`<blockquote>`, `<p className='whitespace-pre-line'>`, `<h6>`). **Không có conditional render dựa trên content type** — không có gallery ảnh, video player, file link download, voice player, sticker, hay link preview nào. Các trường `messageTemplate` và `log.message` luôn là chuỗi.

---

## 7. Data Flow Cho Gửi Tin Nhắn Zalo (Kiến trúc hiện tại)

```
Browser/UI → /api/... (route handler) → actionZalo() / senMesByPhone() 
    → Google Apps Script proxy (3 URL hardcode)
    → Zalo qua client nội bộ của Apps Script
    
Response flow:
    Apps Script → JSON {status, mes, data:{error_code, error_message, ...}}
    → src/app/api/(zalo)/action/route.js parse content.error_code, content.error_message, content.data
    → Lưu result vào collection 'logmes' (model log.js)
    → Hiển thị trên BotLogs / HistoryLogItem / ActionDetailItem
```

---

## 8. Thiếu Gì Cho Cấu Trúc "ZaloLite API Gateway"

Dựa trên thorough search, những thứ **hoàn toàn bị thiếu** và cần xây dựng:

1. **Webhook receiver endpoint** — `src/app/api/(zalo)/webhook/route.js` với handler `POST` (không route nào xử lý Zalo OA callback inbound)
2. **Message type constants/enums** — không file nào định nghĩa `chat.text`, `chat.photo`, `chat.video`, `chat.voice`, `chat.file`, `chat.link`, `chat.sticker`, `chat.location`. Cần tạo mới (ví dụ: `src/constants/zaloMessageType.js`)
3. **`content.type` parsing logic** — không có code parse `content` object với trường `type`
4. **Model lưu conversation/message** — `logmes` lưu API call results, không lưu inbound conversation threads. `historyClient.js` lưu outbound history. Không xử lý inbound messages từ Zalo
5. **Message display components** — UI chỉ render plain text; không component nào xử lý multi-type rendering (ảnh, video, file, sticker)

### Files sẽ bị ảnh hưởng:
- **Models**: `src/models/log.js` (extend để lưu content type) hoặc model mới `zaloMessage.js`
- **API**: Route mới `src/app/api/(zalo)/webhook/route.js`
- **Parsing**: Utility mới `src/function/zaloMessageParser.js`
- **UI**: Logic render mới trong `src/app/client/ui/bot-logs/index.js`, `src/app/client/ui/table/row.js`, `src/app/client/ui/hisotry/index.js`

---

## Kế Hoạch Triển Khai (Phases)

### Phase 1: Constants & Parser (NEW)
1. Tạo `src/constants/zaloMessageType.js` — định nghĩa type values + `getMessageLabel(type)` helper
2. Tạo `src/function/zaloMessageParser.js` — `parseZaloMessage(raw)` normalize struct

### Phase 2: Webhook Receiver (NEW)
1. Tạo `src/app/api/(zalo)/webhook/route.js` — `POST`, verify signature, parse, store
2. Tạo model `src/models/zaloMessage.js`

### Phase 3: UI Components (NEW)
1. Tạo `src/components/(features)/(chat)/MessageRenderer/index.js` — `switch(type)` over 8 payload types

### Phase 4: Integration
- Tích hợp `MessageRenderer` vào conversation view

---

## Câu Hỏi Trước Khi Triển Khai

1. **Webhook delivery**: Zalo gửi webhook trực tiếp tới Next.js API (có public URL) hay Google Apps Script nhận trước?
2. **Storage**: Inbound messages vào collection `logmes` (model `log.js`) hay model mới `zaloMessage.js`?
3. **Scope**: Triển khai parsing/rendering cho **tất cả 8** payload types hay chỉ 3-4 quan trọng nhất (`text`, `chat.photo`, `chat.file`, `voice`)?