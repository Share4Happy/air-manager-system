# Nén video MP4 (HD 720p) client-side trước khi upload

## Vấn đề

Lỗi khi upload video lớn:

```
Tải lên thất bại 1/1 file. Tệp "1000051709.mp4":
Server trả về dữ liệu không phải JSON (status: 413): <html>...413 Payload Too Large...cloudflare...</html>
```

### Nguyên nhân (đã xác minh)

- App chạy sau **Cloudflare proxy**. Gói Free chặn request có body **>100MB**.
- File video >100MB bị Cloudflare chặn **trước khi request tới server** `/api/updateimage` → trả thẳng HTML `413`.
- Client ở `src/app/calendar/[id]/ui/formimage/index.js:362-369` cố `JSON.parse` phản hồi → gặp HTML → hiển thị lỗi "không phải JSON".
- Uploader thực tế nằm ở `src/app/calendar/[id]/ui/formimage/index.js` (dùng trong `src/app/course/[...id]/ui/main/index.js:270`), không phải `calendarcourse`.

### Kết luận

**Không thể nén phía server** vì request >100MB không bao giờ tới server. Bắt buộc nén **client-side** (trong trình duyệt) trước khi gửi.

**Không nên** upload theo chunk (chia <100MB): phức tạp, cần chỗ gom file tạm, nhiều request, file tạm mất nếu container restart.

## Giải pháp: ffmpeg.wasm — nén ra MP4/H.264, 720p

- MediaRecorder không phù hợp: Firefox không ghi được MP4, output kích thước khó kiểm soát.
- `ffmpeg.wasm` chạy ffmpeg ngay trong trình duyệt, xuất MP4/H.264 chuẩn, tính bitrate chính xác.
- Video của dự án chủ yếu **<5 phút** → thời gian nén chấp nhận được, 720p chất lượng đẹp.

### Nguyên tắc

- **Resolution không quyết định kích thước, bitrate mới quyết định.** Phải tính bitrate theo thời lượng để đảm bảo lọt qua giới hạn.

| Thời lượng | Bitrate tối đa để ~88MB | Chất lượng 720p |
|---|---|---|
| 5 phút | ~2.3 Mbps | Tốt |
| 10 phút | ~1.15 Mbps | Tạm được, hơi mờ |
| 20 phút | ~0.55 Mbps | Rõ là mờ |
| 30 phút+ | ~0.37 Mbps | Không chấp nhận được |

## Kế hoạch thực hiện

### 1. Dependencies (`package.json`)

Thêm 3 package (client-side, lazy-load, không nặng bundle đầu):

```json
"@ffmpeg/ffmpeg": "^0.12.10",
"@ffmpeg/util": "^0.12.1",
"@ffmpeg/core": "^0.12.6"
```

### 2. Self-host wasm (không phụ thuộc CDN)

- Script mới `scripts/copy-ffmpeg.js`: copy `ffmpeg-core.js` + `ffmpeg-core.wasm` từ `@ffmpeg/core/dist/esm` vào `public/ffmpeg/`.
- Chạy qua `postinstall` (npm install / `npm ci` trong Docker đều kích hoạt).
- Dockerfile đã copy `public/` sang image (dòng 40) → production hoạt động.
- Dùng **core đơn luồng** → không cần header COOP/COEP.

### 3. Hàm nén `compressToMp4(file)` — file mới trong `src/app/calendar/[id]/ui/formimage/index.js`

- `await import('@ffmpeg/ffmpeg')` + `@ffmpeg/util` (lazy → Next tự tách chunk).
- Lấy thời lượng + kích thước gốc qua `<video>` metadata.
- Tính bitrate:
  - `totalBitrate = (88MB * 8) / duration` (giữ dư an toàn dưới 100MB Cloudflare)
  - `videoBitrate = totalBitrate - 128kbps` (audio AAC)
  - clamp `[400k, 3500k]`
- Scale giữ tỷ lệ:
  - Landscape & cao >720 → `scale=-2:720`
  - Rộng >1280 → `scale=1280:-2`
  - Nhỏ hơn → giữ nguyên (không upscale)
- Lệnh ffmpeg:
  ```
  -i input -vf <scale> -c:v libx264 -preset veryfast
  -b:v <v> -maxrate <1.5v> -bufsize <2v>
  -c:a aac -b:a 128k -movflags +faststart output.mp4
  ```
- Trả về `File` MP4 mới. Kết quả vẫn >90MB (video quá dài) → ném lỗi tiếng Việt rõ ràng thay vì lỗi HTML xấu.

### 4. Trigger (2 chỗ trong `src/app/calendar/[id]/ui/formimage/index.js`)

1. **`UploadManager.handleSave`** (dòng 342): video `>90MB` → nén trước, cập nhật progress `"(${i}/${n}) ${name} — Đang nén HD..."`, xong mới upload file MP4 nén qua POST `/api/updateimage`.
2. **`Lightbox.handleFileChange`** (dòng 57): video `>90MB` nén trước PUT `/api/updateimage`.

File ≤90MB (đã là MP4 nhỏ) upload nguyên như cũ — không đổi.

### 5. Không đổi

- API routes (`src/app/api/(course)/updateimage/route.js`), logic upload hiện tại.
- Giới hạn 60s AbortController chỉ cho khâu upload, không áp cho khâu nén.

## Verify

- `npx next build` (kiểm tra lazy chunk + `public/ffmpeg`).
- Thử video >90MB trên giao diện calendar detail → chờ nén → xác nhận file MP4 720p lên Drive, preview chạy.
- Kiểm tra Docker: `public/ffmpeg` có trong image.

## Rủi ro / cân nhắc

- Lần đầu nén cần tải ~30MB wasm + toàn bộ video vào RAM trình duyệt — OK với video <5 phút.
- Nén mất vài chục giây – vài phút (đơn luồng) — chấp nhận được cho tool nội bộ.
- Video dài >~15 phút buộc bitrate thấp (mờ); chặn và báo rõ nếu kết quả vẫn >90MB.

## Files liên quan

- `src/app/calendar/[id]/ui/formimage/index.js` — uploader (sửa chính)
- `src/app/course/[...id]/ui/main/index.js:270` — nơi dùng uploader
- `src/app/api/(course)/updateimage/route.js` — API hiện tại (không đổi)
- `package.json` — thêm deps + postinstall
- `scripts/copy-ffmpeg.js` — script copy wasm (mới)
- `public/ffmpeg/` — wasm self-host (mới)
- `Dockerfile` — đã copy `public/` (không cần sửa)
