# AGENTS.md

Next.js 16 (App Router) + React 19 management system for a robotics school ("AI Robotic"). MongoDB, Google Drive storage, internal API routes, In-Process Background Scheduler, and ZaloLite API Gateway. Verification is `npx next build`.

## Commands
- Dev: `npm run dev` (dev server at http://localhost:3000, requires MongoDB running locally)
- Verify: `npx next build` — run after changes (primary automated verification; no formal test runner)
- `npm run lint` → `next lint`
- API Checklist Verification: `npm run test:api` (`node scripts/test-all-apis.mjs`)

## Environment (critical)
- Env lives in `.env.development` (not `.env`/`.env.local`) and holds secrets: `GOOGLE_PRIVATE_KEY` (Drive service account), `JWT_SECRET`, `MongoDB_URI` (default `mongodb://127.0.0.1:27017/air`). Never commit it.
- Google Drive credentials: `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PROJECT_ID`. Folder IDs: `DRIVE_COURSE_FOLDER_ID`, `DRIVE_AVT_FOLDER_ID`, `DRIVE_COURSE_IMAGE_FOLDER_ID`.
- ZaloLite API Gateway: `ZALOLITE_BASE_URL` (e.g. `https://sms-service.talab.io.vn/api/gateway/v1.0`), `ZALOLITE_API_KEY`.
- Drive URL templates are `NEXT_PUBLIC_DRIVE_*` in env; build file URLs with helpers in `src/function/index.js` (`srcImage`, `driveImage`, `driveFolderUrl`, `driveThumbnailUrl`, `drivePreviewUrl`, `driveDownloadUrl`, `defaultAvatarUrl`) — don't hardcode `lh3.googleusercontent.com/d/...` strings.

## Architecture Essentials
- `@/*` → `src/*` (jsconfig.json). Route groups use parentheses: `src/app/api/(course)/coursetry/route.js`.
- **Data Fetching (2 methods):**
  1. `src/data/*.js` `Data_*()` → `fetchApi` (`src/utils/fetchApi.js`) calls `/api/...` with `next: { tags }` + `force-cache`; mutations must call `revalidateTag(tag)` (e.g. `data_coursetry`) or the UI stays stale.
  2. `src/data/actions/get.js` `*_data()` (`'use server'`) → `src/data/database/*.js` queries Mongoose directly.
- **Auth:** JWT in httpOnly cookie `sys1` (`process.env.token`). `src/app/layout.js` calls `/api/check` per request.
- **Media & Storage:** Only `fileId` stored in Mongo; real files on Google Drive. `next.config.js` allows remote images from `lh3.googleusercontent.com` / `drive.google.com`.
- **Drive Folder Structure (Standard — Always):** Every class folder lives INSIDE `DRIVE_COURSE_FOLDER_ID` (`1syIZ0XYkmnYCYnQ6TRw1eCTgvKTuBZtR`, "AIR_data_course") — never create anything directly at the shared-drive root (`0AK_Z4-cveE6dUk9PVA`). Naming: class folder = `{MãLớp}` (e.g. `24FZ2007`); lesson folder inside it = `{MãLớp}-{YYYY-MM-DD}` (e.g. `25SA1002-2025-07-26`). Use `lessonFolderName(code, day)` from `src/function/drive/folder.js` when naming lesson folders. The "Đồng bộ Drive" tab in Settings (`POST /api/drive-storage/verify`) restores/moves/renames folders to this standard.
- `docs/ARCH.md` and `docs/structure.md` contain deeper architecture/data-flow and testing overviews.

## Background Scheduler Engine
- **Lifecycle & Startup:** Activated automatically via `src/instrumentation.js` when Next.js Node.js runtime starts.
- **Timezone & Interval:** Hardcoded to `TZ = 'Asia/Ho_Chi_Minh'` with a 60-second tick interval (`src/lib/scheduler/index.js`).
- **Concurrency & Hot-Reload Safeguards:**
  - `globalThis.__air_scheduler_interval` prevents duplicate intervals during Fast Refresh in Dev.
  - `isTickRunning` flag prevents overlapping executions if a job run exceeds 60s.
  - Atomic `findOneAndUpdate` lock pattern in MongoDB for task execution state.
- **Background Jobs:**
  - `poll-campaign.job.js`: Polls async Zalo batch campaign results.
  - `report.job.js`: Generates & sends scheduled attendance and monthly reports via Zalo.
  - `care-lesson.job.js`: Manages automated student care messages for cancelled/absent lessons.
  - `zalo-campaign.job.js`: Dispatches pending marketing messages and friend requests.
  - `drive-scan.job.js`: Scans and records storage usage metrics.

## ZaloLite API Gateway Integration (`src/function/zalolite.js`)
- Replaces legacy Apps Script mechanism with central ZaloLite gateway.
- Authenticated via single `ZALOLITE_API_KEY` across all bots; bot identified by `botId` (UUID).
- Gateway automatically resolves phone numbers to Zalo UIDs (`phone` is sufficient).
- **Batch rules:** Maximum 10 recipients per batch. $\le 5$ recipients execute synchronously; $6-10$ recipients execute asynchronously returning `campaign_id` (polled by scheduler).
- **Resilience:** Circuit breaker opens for 60s after 3 consecutive network failures; retries up to 3 times on transient network errors (never retries business logic errors like blocked/invalid numbers).

## Domain-Specific Gotchas & Rules

### 1. Trial-course (Học thử)
- `src/models/coursetry.js`: `sessions.images` is a single `ImageSchema` **object, not an array** — never use `$size`/`$map` on it.
- Trial course ID is hardcoded as `TRIAL_ID = 6871bc14ada3650715efc786` in `src/app/api/(course)/coursetry/route.js`; root Drive folder `DRIVE_COURSE_FOLDER_ID`.
- Care status in `student.statuses`: `0` Không theo, `1` Chưa CS, `2` Theo học (updated via `PUT /api/student`).
- After successful POST/PUT in `src/app/course/trycourse/ui/`, call `window.location.reload()` — `router.refresh()` alone is insufficient for fresh data.
- The "Thêm học sinh" picker is a standalone self-contained modal (z-index > main popup). FlexiblePopup secondary/renderSecondaryList mechanism was unreliable for it — don't regress to it.

### 2. Events Management (`src/models/event.js`, `/events`)
- Multi-tiered hierarchy: `Event` $\rightarrow$ `RoadmapNodeSchema` (Phases $\rightarrow$ Tasks with status `pending`, `in_progress`, `completed`, `overdue`, `blocked`).
- Member roles: `MemberSchema` (`Leader`, `Coordinator`, `Staff`, `Volunteer`, `Referee`).
- Stations (`StationSchema`) track challenges, referee assignments, scores, and schedules.
- Budgeting (`BudgetItemSchema` categories: `venue`, `equipment`, `prizes`, `marketing`, `catering`, `logistics`, `other`) tracks `estimatedCost` vs `actualCost`.
- Attachments use Google Drive `fileId` via `AttachmentSchema`.

### 3. Academic, Calendar & Báo nghỉ
- Lessons with `Type === "Báo nghỉ"` must display with 60% opacity, red background `#fef2f2`, red border `#fca5a5`, and no attendance/evidence badges.
- Room conflict detection: Check overlapping bookings across official classes and trial sessions via `/api/room/check`.

## Next.js 16 & API Standards
- **Dynamic Route Params:** In Next.js 16 App Router, `params` is a Promise and **must be awaited**: `const { id } = await params;`.
- **HTTP Methods:** Use standard REST verbs (`GET` for fetch, `POST` for create, `PUT` for full/idempotent update, `PATCH` for partial state update, `DELETE` for removal).
- **Mutations:** Always invoke `revalidateTag(tag)` after database writes to ensure cached Server Components update.

## Component & UI Conventions
- **Base UI:** Use reusable atomic components in `@/components/(ui)/` (`<FormInput>`, `<FormSelect>`, `<FormTextarea>`, `<Button>`, `<Badge>`, `<Loading>`).
- **Feature Popups & Alerts:** Use standard right-sliding `<FlexiblePopup>` and toast `<Noti>` from `@/components/(features)/`.
- **Modular Code:** Avoid monolithic files > 300 lines in UI tabs; separate subcomponents, popups, and tables into `ui/[feature-name]/` subdirectories.
- Don't add unnecessary code comments unless asked.
- UI text is Vietnamese.

## Login / Manual UI Testing
- No test harness. For browser verification, mint a JWT directly: `jwt.sign({ id: '684d1e031730348327887b2c', role: ['Admin'] }, process.env.JWT_SECRET)` and set cookie `sys1` on `localhost:3000`. This admin ("Huỳnh Trần Hữu Nhật") is the active one; user `684d1c8f1730348327887a6f` is disabled (`status:false`) — using it returns "Tài khoản đã bị vô hiệu hóa".
- Headless-Chrome CDP: synthetic `el.click()` can bypass overlays; reproduce real user clicks with CDP `Input.dispatchMouseEvent` and viewport $\ge$ ~1200px (800px clips the right column).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

