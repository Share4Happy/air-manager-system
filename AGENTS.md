# AGENTS.md

Next.js 16 (App Router) + React 19 management system for a robotics school ("AI Robotic"). MongoDB, Google Drive storage, internal API routes. No test framework — verification is `npx next build`.

## Commands
- Dev: `npm run dev` (dev server at http://localhost:3000, requires MongoDB running locally)
- Verify: `npx next build` — run after changes (this is the only automated check; no lint/typecheck/test suite)
- `npm run lint` → `next lint`

## Environment (critical)
- Env lives in `.env.development` (not `.env`/`.env.local`) and holds secrets: `GOOGLE_PRIVATE_KEY` (Drive service account), `JWT_SECRET`, `MongoDB_URI` (default `mongodb://127.0.0.1:27017/air`). Never commit it.
- Google Drive creds come from env (`GOOGLE_CLIENT_EMAIL`, `GOOGLE_PROJECT_ID`). Folder ids via `DRIVE_COURSE_FOLDER_ID`, `DRIVE_AVT_FOLDER_ID`, `DRIVE_COURSE_IMAGE_FOLDER_ID`.
- Drive URL templates are `NEXT_PUBLIC_DRIVE_*` in env; build file URLs with helpers in `src/function/index.js` (`srcImage`, `driveImage`, `driveFolderUrl`, `driveThumbnailUrl`, `drivePreviewUrl`, `driveDownloadUrl`, `defaultAvatarUrl`) — don't hardcode `lh3.googleusercontent.com/d/...` strings.

## Architecture essentials
- `@/*` → `src/*` (jsconfig.json). Route groups use parentheses: `src/app/api/(course)/coursetry/route.js`.
- Server components get data two ways:
  1. `src/data/*.js` `Data_*()` → `fetchApi` (`src/utils/fetchApi.js`) calls `/api/...` with `next: { tags }` + `force-cache`; writes must call `revalidateTag(tag)` (e.g. `data_coursetry`) or the UI stays stale.
  2. `src/data/actions/get.js` `*_data()` (`'use server'`) → `src/data/database/*.js` queries Mongoose directly.
- Auth: JWT in httpOnly cookie `sys1` (`process.env.token`). `src/app/layout.js` calls `/api/check` per request.
- Media: only fileIds stored in Mongo; real files on Google Drive. `next.config.js` allows remote images from `lh3.googleusercontent.com` / `drive.google.com`.
- **Drive folder structure (standard — always):** every class folder lives INSIDE `DRIVE_COURSE_FOLDER_ID` (`1syIZ0XYkmnYCYnQ6TRw1eCTgvKTuBZtR`, "AIR_data_course") — never create anything directly at the shared-drive root (`0AK_Z4-cveE6dUk9PVA`). Naming: class folder = `{MãLớp}` (e.g. `24FZ2007`); lesson folder inside it = `{MãLớp}-{YYYY-MM-DD}` (e.g. `25SA1002-2025-07-26`). Use `lessonFolderName(code, day)` from `src/function/drive/folder.js` when naming lesson folders. The "Đồng bộ Drive" tab in Settings (`POST /api/drive-storage/verify`) restores/moves/renames folders to this standard.
- `docs/ARCH.md` has the fuller architecture/data-flow overview.

## Trial-course (Học thử) gotchas — read before touching
- `src/models/coursetry.js`: `sessions.images` is a single `ImageSchema` **object, not an array** — never use `$size`/`$map` on it.
- Trial course id is hardcoded as `TRIAL_ID = 6871bc14ada3650715efc786` in `src/app/api/(course)/coursetry/route.js`; root Drive folder `DRIVE_COURSE_FOLDER_ID`.
- Care status in `student.statuses`: `0` Không theo, `1` Chưa CS, `2` Theo học (updated via `PUT /api/student`).
- After successful POST/PUT in `src/app/course/trycourse/ui/`, the code calls `window.location.reload()` — `router.refresh()` alone was insufficient to show fresh data. Keep this pattern for new trial-course actions.
- The "Thêm học sinh" picker is a standalone self-contained modal (z-index > the main popup). FlexiblePopup secondary/renderSecondaryList mechanism was unreliable for it — don't regress to it.

## Login / manual UI testing
- No test harness. For browser verification, mint a JWT directly: `jwt.sign({ id: '684d1e031730348327887b2c', role: ['Admin'] }, process.env.JWT_SECRET)` and set cookie `sys1` on `localhost:3000`. This admin ("Huỳnh Trần Hữu Nhật") is the active one; user `684d1c8f1730348327887a6f` is disabled (`status:false`) — using it returns "Tài khoản đã bị vô hiệu hóa".
- Headless-Chrome CDP: synthetic `el.click()` can bypass overlays; reproduce real user clicks with CDP `Input.dispatchMouseEvent` and viewport ≥ ~1200px (800px clips the right column).

## Conventions
- Don't add code comments unless asked. Keep the existing popup/noti/loading component patterns (`@/components/(features)/(popup)`, `(noti)`) rather than new ad-hoc modals, except where the established popup mechanism is proven broken.
- UI text is Vietnamese.
