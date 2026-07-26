# Tối ưu trang DetailCourse

## Mức Cao

### 1. Memo hóa computed values mỗi render

**Vấn đề**: `allImages`, `images`, `videos`, `lessProductItems`, `lessProductVideos`, `allDates`, `dateRange` được tính lại từ đầu mỗi lần render.

**Cách khắc phục**: Bọc bằng `useMemo`.

```js
// Trước
let allImages = []
if (params.length > 1) {
  allImages = data.Detail?.filter((t) => t._id == params[1])[0]?.DetailImage || [];
} else {
  allImages = data.Detail?.flatMap(lesson => lesson.DetailImage || []);
}
const images = allImages?.filter(item => item.type === 'image');
const videos = allImages?.filter(item => item.type === 'video');
const lessProductItems = images?.map((item, index) => (<ImageComponent ... />));
const lessProductVideos = videos?.map((item, index) => (<ImageComponent ... />));

// Sau
const images = useMemo(() => {
  let allImages = [];
  if (params.length > 1) {
    allImages = data.Detail?.filter((t) => t._id == params[1])[0]?.DetailImage || [];
  } else {
    allImages = data.Detail?.flatMap(lesson => lesson.DetailImage || []);
  }
  return allImages?.filter(item => item.type === 'image') || [];
}, [data.Detail, params[1]]);

const videos = useMemo(() => {
  let allImages = [];
  if (params.length > 1) {
    allImages = data.Detail?.filter((t) => t._id == params[1])[0]?.DetailImage || [];
  } else {
    allImages = data.Detail?.flatMap(lesson => lesson.DetailImage || []);
  }
  return allImages?.filter(item => item.type === 'video') || [];
}, [data.Detail, params[1]]);

const lessProductItems = useMemo(
  () => images?.map((item, index) => (<ImageComponent key={index} width={'100%'} imageInfo={item} refreshData={() => reload()} />)),
  [images]
);
const lessProductVideos = useMemo(
  () => videos?.map((item, index) => (<ImageComponent key={index} width={'100%'} imageInfo={item} refreshData={() => reload()} />)),
  [videos]
);
```

### 2. Memo hóa `dateRange` — tránh spread operator trên mảng lớn

**Vấn đề**: `Math.min(...allDates)` spread toàn bộ mảng mỗi render, nguy cơ stack overflow.

**Cách khắc phục**: Dùng `reduce` thay vì spread, và bọc trong `useMemo`.

```js
// Trước
const allDates = data.Detail.map(item => new Date(item.Day));
const dateRange = [formatDate(new Date(Math.min(...allDates))), formatDate(new Date(Math.max(...allDates)))];

// Sau
const dateRange = useMemo(() => {
  if (!data.Detail?.length) return ['Chưa có dữ liệu', 'Chưa có dữ liệu'];
  let min = Infinity, max = -Infinity;
  for (const item of data.Detail) {
    const d = new Date(item.Day).getTime();
    if (d < min) min = d;
    if (d > max) max = d;
  }
  return [formatDate(new Date(min)), formatDate(new Date(max))];
}, [data.Detail]);
```

### 3. Thêm `React.memo` cho component

**Vấn đề**: Component không có memo → mỗi lần parent re-render là kéo theo toàn bộ trang.

**Cách khắc phục**:

```js
// Cuối file, đổi:
export default function Detail(...) { ... }
// thành:
export default React.memo(Detail);
```

---

## Mức Trung Bình

### 4. Gom inline SVG vào thư viện icon

**Vấn đề**: 11 inline `<svg>...</svg>` không thể cache, tăng bundle size.

**Cách khắc phục**: Chuyển mỗi inline SVG thành component trong `@/components/(icon)/svg` và import dùng như `Svg_Profile`.

```js
// Ví dụ tạo component Svg_Reload trong thư viện icon
export const Svg_Reload = ({ w = 16, h = 16, c = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={w} height={h} fill={c}>
    <path d="M105.1 202.6..." />
  </svg>
);

// Trong component detail:
// import { Svg_Reload } from '@/components/(icon)/svg'
// <Svg_Reload w={14} h={14} c="white" />
```

### 5. Dùng `useCallback` cho event handlers

**Vấn đề**: `handleCompleteCourse`, `handleSort`, `reload` được tạo lại mỗi render.

**Cách khắc phục**: Bọc bằng `useCallback`.

```js
const handleSort = useCallback((key) => {
  let direction = 'descending';
  if (sortConfig.key === key && sortConfig.direction === 'descending') {
    direction = 'ascending';
  }
  setSortConfig({ key, direction });
}, [sortConfig]);
```

### 6. Tách inline style objects

**Vấn đề**: `style={{...}}` tạo object mới mỗi render.

**Cách khắc phục**: Đưa style tĩnh ra ngoài component hoặc dùng class.

```js
// Trước
<div style={{ marginTop: 8, borderRadius: 5, cursor: 'pointer' }}>

// Sau — khai báo hằng số ngoài component
const buttonStyle = { marginTop: 8, borderRadius: 5, cursor: 'pointer' };
// ... dùng
<div style={buttonStyle}>
```

---

## Kiểm tra sau khi tối ưu

1. `npm run build` — đảm bảo không lỗi
2. Kiểm tra React DevTools → Components tab → verify `memo` hoạt động
3. Performance tab → check số lần re-render khi click tab
