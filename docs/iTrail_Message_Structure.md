# Hướng Dẫn Cấu Trúc Tin Nhắn - ZaloLite API Gateway

Tài liệu này mô tả chi tiết cấu trúc JSON chính xác được trả về từ ZaloLite API Gateway khi bạn gọi API `GET /bots/{bot_id}/conversations/{conv_id}/messages` hoặc khi nhận dữ liệu ngầm từ Webhook (`message.new`).

Vì nền tảng Zalo hỗ trợ rất nhiều định dạng tin nhắn phức tạp, hệ thống Frontend / ERP của bạn (Bên thứ 3) cần bắt từng trường hợp cụ thể để tiến hành hiển thị UI cho phù hợp.

---

## 🏗 Cấu Trúc Khung Khối Tin Nhắn (Base Structure)

Mỗi một tin nhắn trả về luôn tuân theo cấu trúc phẳng cơ bản sau:

```json
{
  "message_id": "uuid-...",
  "zalo_msg_id": "1234567890",
  "is_bot": false, // True nếu tin do Bot/API/Nhân viên tự gửi. False nếu từ Khách hàng nhắn tới.
  "api_client_id": null, // Sẽ có ID nếu đây là tin nhắn được kích hoạt từ Dịch vụ API của bạn
  "sent_at": "2026-03-24T12:00:00Z",
  "content": {
     "type": "chat.photo",
     "content": { ... } // (Nội dung chi tiết - Nằm ở phần dưới)
  }
}
```

---

## 🎨 Các Loại Định Dạng Nội Dung (Payload Types)

Dữ liệu lõi được nằm trong tham số `content.content` (hoặc đôi khi là `content.data`). Sử dụng chìa khóa `type` để phân định logic hiển thị.

### 1. Tin nhắn chữ thuần / HTML (`text`, `html`)
Đây là tin nhắn văn bản thông thường.
```json
{
  "type": "text",
  "content": {
    "text": "Xin chào, tôi có thể giúp gì cho bạn?",
    "styles": [] // Dấu hiệu định dạng như (in đậm, in nghiêng) nếu có
  }
}
```

### 2. Hình ảnh (`image`, `chat.photo`)
Gắn kèm hình ảnh. Lưu ý hình ảnh trên Zalo thường đính kèm dòng chú thích (Caption).
```json
{
  "type": "chat.photo",
  "content": {
    "url": "https://s120-ava-talk.zadn.vn/...jpg", // Ảnh gốc
    "thumb": "https://s120-ava-talk.zadn.vn/...jpg", // Ảnh preview mờ (low-res)
    "caption": "Mẫu thiết kế đính kèm", // Ghi chú hình ảnh (Có thể nằm trong tham số "title" hoặc "description")
    "width": 1080,
    "height": 1920
  }
}
```

### 3. Tệp tin / Tài liệu (`file`, `chat.file`)
Các file dạng PDF, DOCX, ZIP files.
```json
{
  "type": "chat.file",
  "content": {
    "url": "https://link-to-download-file...",
    "fileName": "Bao_Cao_Du_An.pdf",
    "extension": "pdf", // Đuôi tập tin
    "fileSize": 1048576 // Kích cỡ tính bằng Bytes (1MB)
  }
}
```

### 4. Ghi âm / Voice Nhắn (`voice`, `audio`)
Tin nhắn giọng nói được thu âm trực tiếp trên ứng dụng Zalo.
```json
{
  "type": "voice",
  "content": {
    "url": "https://audio-cdn.zadn.vn/...",
    "duration": 7000 // Độ dài file ghi âm (tính bằng mili-giây) (vd: 7s)
  }
}
```

### 5. Video (`video`)
```json
{
  "type": "video",
  "content": {
    "url": "https://video-cdn.zadn.vn/...",
    "thumb": "https://video-poster.zadn.vn/...", // Ảnh bìa hiển thị trước khi user bấm Play
    "caption": "Video demo sản phẩm mới"
  }
}
```

### 6. Thẻ Liên Kết (Preview Link / Mini App) (`link`, `chat.recommended`)
Khối Card hiển thị hình ảnh bìa và tiêu đề trang web khi bạn dán 1 đường link vào khung chat.
```json
{
  "type": "link",
  "content": {
    "url": "https://my-website.com/article",
    "title": "Top 10 Xu Hướng AI",
    "description": "Đọc thêm về cách AI thay đổi kỷ nguyên...",
    "thumb": "https://image-preview.com/cover.jpg",
    "params": {
      "src": "my-website.com" // Tên miền cấp 1
    }
  }
}
```

### 7. Nhãn Dán (`sticker`, `chat.sticker`)
Hình động (Sticker) quen thuộc độc quyền trên Zalo.
```json
{
  "type": "chat.sticker",
  "content": {
    "stickerUrl": "https://sticker-cdn.zadn.vn/...",
    "url": "https://sticker-cdn.zadn.vn/..."
  }
}
```

### 8. Danh Thiếp Số / Contact (`chat.recommended`)
Sự kiện diễn ra khi khách hàng chia sẻ một Contact (số điện thoại / hồ sơ cá nhân) của người khác vào đoạn chat. Rất tiện để lấy Lead tự động làm CRM.
```json
{
  "type": "chat.recommended",
  "content": {
    "action": "recommened.user",
    "title": "Nguyễn Văn Chăm Sóc Khách", // Tên người dùng Zalo được chia sẻ
    "thumb": "https://avatar-url...", // Ảnh đại diện
    "descriptionExt": {
      "phone": "0901234567" // Cực kỳ quan trọng: Lấy được số gốc nếu Zalo trả về
    }
  }
}
```

---
**💡 Mẹo Triển Khai UI (Frontend Developer):**  
Hãy luôn bọc cấu trúc Cây Điều Kiện (Switch/Case) của bạn một khối `default` dự phòng. Ví dụ: `[Định dạng tin nhắn mới chưa hỗ trợ trên giao diện này]`. Điều này sẽ ngăn việc ứng dụng của bạn không bị Crash khi Zalo cho ra đời định dạng Media mới.
API Gửi Tin Nhắn & Kết Bạn Batch
Gửi tin nhắn/kết bạn cho nhiều người lạ trong 1 lần gọi API. Hệ thống tự động resolve số điện thoại → UID và xử lý hoàn toàn qua bot được chỉ định.

1
API Nhắn tin cho nhiều người lạ
Endpoint:
POST /bots/{bot_id}/messages/send-batch
Giới hạn:
10 recipients/lần gọi
Cơ chế xử lý
✅ Batch ≤ 5 → Chạy đồng bộ: trả kết quả chi tiết từng recipient ngay lập tức

⏳ Batch 6-10 → Chạy bất đồng bộ: trả campaign_id (HTTP 202), xử lý nền

🤖 Dùng GET /bots/{bot_id}/campaigns/{campaign_id} để poll tiến độ

Retry & Circuit Breaker
Retry 3 lần cho lỗi mạng (timeout, ECONNREFUSED, 502, 503, 504)
❌ Không retry lỗi spam (-201) hoặc lỗi từ khách (-213, -117, blocked)
🛑 Circuit breaker: 3 lỗi spam/mạng liên tiếp → tự động PAUSED campaign
2
API Gửi kết bạn cho nhiều người lạ
Endpoint:
POST /bots/{bot_id}/friends/requests/send-batch
Giới hạn:
5 recipients/lần gọi
Cơ chế xử lý
Tương tự API nhắn tin: ≤5 recipients chạy đồng bộ, >5 chạy bất đồng bộ (nếu tăng limit).

Tính năng bổ sung
alias_prefix — tự động đổi tên (alias) sau khi gửi kết bạn thành công (VD: KH_ → KH_Nguyen Van A)
Tự động sync identity + connection sau khi gửi lời mời
Hỗ trợ resolve số điện thoại → UID tự động
📋 Ví dụ: Gửi tin nhắn cho 2 người (đồng bộ)
POST /api/gateway/v1.0/bots/YOUR_BOT_ID/messages/send-batch
x-api-key: YOUR_API_KEY
Content-Type: application/json

{
  "recipients": [
    { "phone": "0334551531" },
    { "phone": "0946734111" }
  ],
  "content": {
    "type": "text",
    "data": { "text": "Xin chào! Test từ API Batch." }
  },
  "mode": "safe"
}

📥 Response:
{
  "success": true,
  "campaign_id": "95379b1b-4170-...",
  "total": 2,
  "accepted": 2,
  "status": "completed",
  "results": [
    {
      "uid": "5002868751631677765",
      "status": "success",
      "conversation_id": "41a6c708-...",
      "message_id": "7903448726684"
    },
    {
      "uid": "1801874640219556137",
      "status": "success",
      "conversation_id": "a6569b25-...",
      "message_id": "7903448869067"
    }
  ]
}

iTrail API Gateway

Download OpenAPI Document

Download OpenAPI Document
API Gateway Xác thực & Thao tác Zalo Core dành cho các Hệ thống bên ngoài tích hợp.

Server
Server:
https://sms-service.talab.io.vn/api/gateway/v1.0
Máy chủ Production


Authentication
Required
Selected Auth Type:ApiKeyAuth
Khóa bí mật (Secret Key) được cung cấp trong Bảng điều khiển ZaloLite API.
Name
:
x-api-key
Clear Value
Value
:
QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT
Show Password
Client Libraries
Shell Curl
Bots ​Copy link
BotsOperations
get
/bots
get
/bots/{bot_id}
Danh sách Bot được phép truy cập​Copy link

Auth Required
Lấy danh sách tất cả các Bot Zalo mà API Key hiện tại có quyền truy cập.

Responses

200
Thành công
application/json
Request Example forget/bots
Shell Curl
curl https://sms-service.talab.io.vn/api/gateway/v1.0/bots \
  --header 'x-api-key: YOUR_SECRET_TOKEN'


Test Request
(get /bots)
Status:200

{
  "success": true,
  "data": [
    {
      "id": "bot-uuid",
      "name": "Tên Bot",
      "avatar": "https://url-to-avatar.com",
      "status": {
        "state": "LISTENING",
        "message": "Đang lắng nghe (Realtime ON)"
      },
      "is_active": true,
      "last_active_at": "2026-03-24T00:00:00.000Z"
    }
  ]
}

Thành công

Thông tin cá nhân của Bot​Copy link

Auth Required
Lấy thông tin chi tiết về một bot cụ thể, bao gồm ảnh đại diện, tên hiển thị, Zalo Global UID và Số điện thoại liên kết (nếu có).

Path Parameters
bot_idCopy link to bot_id
Type:string
required
UUID của Bot

Responses

200
Thành công
application/json
Request Example forget/bots/{bot_id}
Shell Curl
curl 'https://sms-service.talab.io.vn/api/gateway/v1.0/bots/{bot_id}' \
  --header 'x-api-key: YOUR_SECRET_TOKEN'


Test Request
(get /bots/{bot_id})
Status:200

{
  "success": true,
  "data": {
    "id": "bot-uuid",
    "name": "Tên Bot",
    "avatar": "https://url-to-avatar.com",
    "phone": "84901234567",
    "zalo_global_uid": "1234567890123456789",
    "is_active": true,
    "status": {
      "state": "LISTENING"
    },
    "last_active_at": "2026-03-24T00:00:00.000Z",
    "raw_profile": {}
  }
}

Thành công

Labels (Collapsed)​Copy link
LabelsOperations
get
/bots/{bot_id}/labels
post
/bots/{bot_id}/labels
patch
/bots/{bot_id}/labels/{id}
delete
/bots/{bot_id}/labels/{id}
post
/bots/{bot_id}/labels/sync
get
/bots/{bot_id}/conversations/{id}/labels
post
/bots/{bot_id}/conversations/{id}/labels
Show More
Friends (Collapsed)​Copy link
FriendsOperations
get
/bots/{bot_id}/friends
delete
/bots/{bot_id}/friends/{uid}
post
/bots/{bot_id}/friends/aliases
post
/bots/{bot_id}/friends/requests/send-batch
post
/bots/{bot_id}/friends/requests
get
/bots/{bot_id}/friends/requests/pending
Show More
Campaigns (Collapsed)​Copy link
CampaignsOperations
get
/bots/{bot_id}/campaigns/{campaign_id}
Show More
Conversations (Collapsed)​Copy link
ConversationsOperations
get
/bots/{bot_id}/conversations
Show More
Messages (Collapsed)​Copy link
MessagesOperations
get
/bots/{bot_id}/conversations/{conversation_id}/messages
post
/bots/{bot_id}/conversations/{conversation_id}/messages
post
/bots/{bot_id}/messages/send-batch
post
/bots/{bot_id}/messages/send-by-phone
Show More
CRM (Collapsed)​Copy link
CRMOperations
get
/bots/{bot_id}/customers/{zalo_id}
get
/bots/{bot_id}/customers/by-uid/{uid}
post
/bots/{bot_id}/customers/by-phone
Show More
Webhooks (Collapsed)​Copy link
WebhooksOperations
get
/webhooks
post
/webhooks
put
/webhooks/{webhook_id}
delete
/webhooks/{webhook_id}
Show More
Webhooks (Collapsed)​Copy link
WebhooksWebhooks
post
Sự kiện Tin nhắn mới
post
Sự kiện Nhận lời mời kết bạn
post
Sự kiện Chấp nhận kết bạn


Trung Tâm Ai Robotic
f61c40f5-cb8d-4502-8b81-9bebbe705b31