# Hướng dẫn Chuẩn hóa Base UI & Đánh giá Rủi ro (Design System Guide)

> Tài liệu hướng dẫn xây dựng thư viện Base UI Components dùng chung và phân tích rủi ro khi refactor giao diện trong dự án AI Robotic Manager.

---

## 1. Mục tiêu
Thay thế việc viết lặp lại các thẻ HTML thô (`<label>`, `<input>`, `<select>`, `<textarea>`) và các chuỗi class CSS rời rạc (`inputCls`, `labelCls`) bằng **bộ Base UI Components chuẩn** đặt tại `src/components/(ui)/`.

---

## 2. Đánh giá Rủi ro & Tỷ lệ Bể giao diện

### 2.1. Tỷ lệ rủi ro theo phương pháp triển khai

| Phương pháp | Tỷ lệ rủi ro | Đánh giá & Khuyến nghị |
| :--- | :---: | :--- |
| **Thay thế ồ ạt toàn bộ dự án** *(Mass Refactor)* | **30% – 50%** | 🔴 **Không nên làm**: Dễ gây vỡ layout ở các form phức tạp, mất thuộc tính `name` khi submit FormData lên Server Actions. |
| **Chuẩn hóa Base UI + Áp dụng cuốn chiếu từng module** | **< 5%** | 🟢 **Khuyên dùng**: An toàn tuyệt đối, kiểm thử kỹ trên 1 màn hình trước khi nhân rộng. |

---

## 3. Bốn bẫy kỹ thuật (Gotchas) cần tránh tuyệt đối

1. **Bẫy thẻ bọc ngoài (`Wrapper <div>`) làm lệch CSS Flex/Grid:**
   - Base Input không được gán `margin-bottom` hay `padding` cố định ở thẻ `div` bọc ngoài.
   - Thẻ `div` bọc ngoài phải luôn có `w-full` và nhận biến `containerClassName` để tùy biến khi đặt trong CSS Grid (`grid-cols-2`).

2. **Bẫy mất dữ liệu Server Action (Thiếu `name` & `defaultValue`):**
   - Trong Next.js App Router, form submit lấy dữ liệu qua `FormData` dựa vào thuộc tính `name` của thẻ `<input>`.
   - Component `<FormInput>` phải luôn chuyển tiếp `name`, `defaultValue`, `value`, `onChange` và toàn bộ `...props` vào thẻ HTML thực tế bên trong.

3. **Bẫy ghi đè class CSS (`className overriding`):**
   - Không gán cứng chuỗi `className`. Luôn sử dụng kỹ thuật nối chuỗi hoặc template literal:
     ```jsx
     className={`w-full px-3 py-2 border border-gray-300 rounded bg-white text-sm outline-none text-gray-700 transition-colors focus:border-[var(--main_d)] ${error ? 'border-red-500' : ''} ${className}`}
     ```

4. **Bẫy tương thích thư viện & Form Hook (Thiếu `forwardRef`):**
   - Mọi Base Component nhập liệu đều phải được bọc trong `React.forwardRef` để hỗ trợ focus tự động và tương thích các form handler.

---

## 4. Thiết kế Mẫu Base Components Chuẩn

### 4.1. `FormInput`
```jsx
import React, { forwardRef } from 'react'

export const FormInput = forwardRef(function FormInput(
    { label, name, type = 'text', error, className = '', containerClassName = '', ...props },
    ref
) {
    return (
        <div className={`flex flex-col w-full ${containerClassName}`}>
            {label && (
                <label htmlFor={name} className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                id={name}
                name={name}
                type={type}
                className={`w-full px-3 py-2 border border-gray-300 rounded bg-white text-sm outline-none text-gray-700 transition-colors focus:border-[var(--main_d)] ${error ? 'border-red-500' : ''} ${className}`}
                {...props}
            />
            {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
        </div>
    )
})
```

### 4.2. `FormSelect`
```jsx
import React, { forwardRef } from 'react'

export const FormSelect = forwardRef(function FormSelect(
    { label, name, options = [], error, className = '', containerClassName = '', children, ...props },
    ref
) {
    return (
        <div className={`flex flex-col w-full ${containerClassName}`}>
            {label && (
                <label htmlFor={name} className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    {label}
                </label>
            )}
            <select
                ref={ref}
                id={name}
                name={name}
                className={`w-full px-3 py-2 border border-gray-300 rounded bg-white text-sm outline-none text-gray-700 transition-colors focus:border-[var(--main_d)] ${error ? 'border-red-500' : ''} ${className}`}
                {...props}
            >
                {children || options.map(opt => {
                    const [val, lab] = Array.isArray(opt) ? opt : [opt.value, opt.label]
                    return <option key={val} value={val}>{lab}</option>
                })}
            </select>
            {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
        </div>
    )
})
```

---

## 5. Lộ trình Triển khai 4 bước

1. **Bước 1 (Xây dựng thư viện):** Hoàn thiện các Base Component tại `src/components/(ui)/`.
2. **Bước 2 (Thử nghiệm trên 1 màn hình):** Áp dụng trước cho tab **Cấu hình báo cáo** (`/academic/report`).
3. **Bước 3 (Kiểm tra thực tế):** Kiểm tra hiển thị đa thiết bị (Desktop / Mobile) và submit Server Actions.
4. **Bước 4 (Nhân rộng):** Áp dụng cuốn chiếu cho các phân hệ tiếp theo (Học vụ, Quản lý lớp, Học sinh, Khách hàng).
