# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.13] - 2026-08-03

### Removed
- Removed "Logs Bot" tab from the customer care page (`/client`).
  - Deleted the `BotLogs` import and tab button from `src/app/client/index.js` (was lines 14, 59-64)
  - Removed the `BotLogs` component render from the tab ternary (was line 120)
  - Only two tabs remain: "Chăm sóc" (care) and "Cấu hình Zalo" (zalo-config)
  - The `src/app/client/ui/bot-logs/index.js` component file is retained but no longer referenced

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
  - Previously these lessons were completely hidden with `return null`, making it impossible to see scheduled but cancelled sessions
- Sample test data file `docs/sample-bao-nghi-data.md` with example JSON structures for cancelled lessons

### Changed
- **`src/app/calendar/page.js`** — `DayLessons` component: Replaced `return null` for cancelled lessons with styled display (red bg, badge, opacity)
- **`src/app/calendar/page.js`** — `MonthList` component: Added cancelled lesson detection with red dot indicator, "Nghỉ" badge, and reduced opacity
- **`src/app/calendar/ui/lesson_td/index.js`**: Replaced `return null` for cancelled lessons with styled display (red border, "Báo nghỉ" badge); also fixed potential null-reference errors by adding optional chaining (`data.students`, `data.room?.name`, `data.topic?.Name`, `data.teacher?.name`)
- **`docs/ARCH.md`**: Added work log section documenting the cancelled lessons display feature

### Fixed
- Potential `TypeError` in `lesson_td` when `data.students` is undefined (now safely handled with optional chaining and null checks)

### Verification
- `npx next build` passes successfully
