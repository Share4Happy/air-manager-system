# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.14] - 2026-08-04

### Added
- **ZaloLite (iTrail) API Gateway client** (`src/function/zalolite.js`): `fetchBot`, `fetchBots`, `sendBatch` (≤10 recipients, sync ≤5 / async 6-10 with campaign_id), `sendByPhone`, `sendFriendBatch`, `pollCampaign`.
  - Retry 3× for network errors (timeout, ECONNREFUSED, 502/503/504)
  - No retry for permanent errors (-201 spam, -213, -117, blocked)
  - Circuit breaker: 3 consecutive spam/network errors → open for 60s
- **Env config**: `ZALOLITE_BASE_URL`, `ZALOLITE_API_KEY` (in `.env.development` + getters in `src/utils/env.js`)

### Changed
- **`src/models/zalo.js`**: Added `botId` (UUID) + `is_active`; `uid`/`phone` no longer required (populated from `GET /bots/{bot_id}`)
- **`src/models/schedule.js`**: Added `campaignId` on job + task for async batch tracking
- **`src/app/actions/zalo.actions.js`**: `addZaloAccountAction` now takes `bot_id` → `fetchBot` → upsert. Removed Apps Script token flow + Google Sheets append
- **`src/app/client/ui/zalo-config/index.js`**: "Thêm tài khoản" form changed from Access Token textarea → `bot_id` input
- **`src/app/api/(zalo)/action/route.js`** (scheduler):
  - `sendMessage`/`addFriend` → grouped due tasks (≤10, same content) → `send-batch` / `friends/requests/send-batch`; results mapped back to `logmes`, `tasks[]`, `statistics`
  - Async batches (6-10) → stored `campaignId`, polled via `pollPendingCampaigns()` on next tick
  - `findUid`/`checkFriend` → kept on legacy Apps Script path
- **`src/app/actions/schedule.actions.js`**: `createScheduleAction` requires only `phone` for `sendMessage`/`addFriend` (gateway auto-resolves phone→UID); UID still required for `checkFriend`

### Notes
- Batch content is identical for all recipients in one call; templates with `{name}` personalization send per-recipient (batch of 1)
- Result→task mapping assumes gateway returns results in recipient order
- `ZALOLITE_API_KEY` in `iTrail_Message_Structure.md` is a base64 placeholder — a real key is needed for live sending

### Verification
- `npx next build` passes successfully

---

## [2.1.13] - 2026-08-03

### Removed
- Removed "Logs Bot" tab from the customer care page (`/client`).
  - Deleted the `BotLogs` import and tab button from `src/app/client/index.js`
  - Only two tabs remain: "Chăm sóc" (care) and "Cấu hình Zalo" (zalo-config)

### Verification
- `npx next build` passes successfully

---

## [2.1.12] - 2026-08-03

### Added
- **Calendar — display cancelled lessons (Báo nghỉ):** Lessons with `Type === "Báo nghỉ"` are no longer hidden on the calendar page. They now display with:
  - Red background (`#fef2f2`) and red border (`#fca5a5`) at 60% opacity
  - "Báo nghỉ" badge on the month view cards (`DayLessons` component)
  - Red dot indicator and "Nghỉ" badge on the month list view (`MonthList` component)
  - Red left border and visible lesson info on the day view (`lesson_td` component)
- Sample test data file `docs/sample-bao-nghi-data.md` with example JSON structures for cancelled lessons

### Changed
- **`src/app/calendar/page.js`** — `DayLessons` and `MonthList` components
- **`src/app/calendar/ui/lesson_td/index.js`**: styled display for cancelled lessons + optional chaining fixes
- **`docs/ARCH.md`**: work log section

### Fixed
- Potential `TypeError` in `lesson_td` when `data.students` is undefined

### Verification
- `npx next build` passes successfully
