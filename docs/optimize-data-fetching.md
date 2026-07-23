# Tối ưu Data Fetching — Kiến trúc Doanh nghiệp

## Vấn đề hiện tại

- `force-dynamic` ở root layout — disable toàn bộ static generation
- Không có client-side caching library → mỗi lần navigate là fetch lại từ đầu
- In-memory cache (`Map`) chỉ hoạt động trong cùng 1 server instance, mất khi restart

## Giải pháp doanh nghiệp (ưu tiên thấp → cao)

### 1. Nhanh nhất, ít sửa code nhất — React Query (TanStack Query)

Thay thế tất cả `useEffect` + `fetch` ở client components bằng `useQuery`:

```js
import { useQuery } from '@tanstack/react-query'

// Tự động cache, deduplicate, stale-while-revalidate
const { data } = useQuery({
  queryKey: ['dashboard', period, areaId],
  queryFn: () => fetch('/api/dashboard/overview?...').then(r => r.json()),
  staleTime: 5 * 60 * 1000, // 5 phút mới gọi lại
})
```

**Lợi ích:**
- Cache trong memory, không gọi lại API khi navigate qua lại
- Tự động refetch background khi stale
- Deduplicate requests (nếu 2 component cùng gọi 1 API, chỉ 1 request được gửi)
- Retry, optimistic update, pagination built-in

### 2. Tối ưu server component — bỏ `force-dynamic` + dùng ISR

```js
// root layout.js — xóa dòng này:
// export const dynamic = 'force-dynamic'

// Thay bằng:
export const revalidate = 60 // re-generate mỗi 60s
```

Kết hợp với `unstable_cache` (đã dùng ở actions) cho data pages:

```js
const data = await nextCache(
  async () => student_data(),
  ['students'],
  { revalidate: 300, tags: ['students'] }
)
```

### 3. Context Provider cho shared data (dữ liệu ít thay đổi)

Ví dụ: danh sách khu vực, sách, khóa học — load 1 lần rồi dùng chung qua React Context.

### 4. Kết hợp cả 3 — kiến trúc doanh nghiệp thực tế

| Layer | Công nghệ | Dùng cho |
|---|---|---|
| **Server cache** | `unstable_cache` + `revalidateTag()` | Danh mục ít đổi (areas, books, courses) |
| **Client cache** | React Query | Dashboard, attendance, calendar data |
| **CDN/ISR** | Next.js ISR | Trang tĩnh (guide, info) |
| **Realtime** | SSE (đã có) + React Query refetch | Notifications |

## Ưu tiên triển khai

1. Cài `@tanstack/react-query` — giải quyết ngay vấn đề load lại khi navigate
2. Wrap `useNotification`, `overview.js`, `calendar` bằng `useQuery`
3. Xoá `force-dynamic` khỏi layout, thêm `revalidate` hoặc `dynamic = 'force-dynamic'` chỉ ở trang cần
4. Thêm Context Provider cho dữ liệu dùng chung (area, user info)
