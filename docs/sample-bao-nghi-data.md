# Sample Test Data - Báo Nghỉ Lessons

This file contains sample data structures that demonstrate how cancelled lessons (Báo nghỉ) 
are now displayed on the calendar page instead of being hidden.

## Sample Lesson Data (Returned from /api/calendar)

```json
[
  {
    "_id": "6871bc14ada3650715efc786_detail_1",
    "courseId": "LTK-202",
    "courseName": "Lập trình Cơ bản",
    "type": "Báo nghỉ",
    "date": "2026-08-03T00:00:00.000Z",
    "day": 3,
    "month": 8,
    "year": 2026,
    "time": "14:00-16:00",
    "room": {
      "_id": "room_123",
      "name": "Phòng 301",
      "area": "Tòa nhà A",
      "color": "#3b82f6"
    },
    "image": null,
    "topic": {
      "Name": "Bài 1: Giới thiệu lập trình"
    },
    "teacher": {
      "_id": "684d1e031730348327887b2c",
      "name": "Huỳnh Trần Hữu Nhật",
      "avatar": "avatar_1"
    },
    "teachingAs": null,
    "students": []
  },
  {
    "_id": "6871bc14ada3650715efc786_detail_2",
    "courseId": "LAP-201",
    "courseName": "Lập trình Python",
    "type": "Học bù",
    "date": "2026-08-03T00:00:00.000Z",
    "day": 3,
    "month": 8,
    "year": 2026,
    "time": "18:00-20:00",
    "room": {
      "_id": "room_123",
      "name": "Phòng 302",
      "area": "Tòa nhà A",
      "color": "#3b82f6"
    },
    "image": null,
    "topic": {
      "Name": "Bài 3: Cấu trúc dữ liệu"
    },
    "teacher": {
      "_id": "684d1e031730348327887b2c",
      "name": "Huỳnh Trần Hữu Nhật",
      "avatar": "avatar_1"
    },
    "teachingAs": null,
    "students": [
      {
        "_id": "student_1",
        "Checkin": 1,
        "Cmt": ["Có", "Tốt"],
        "Image": ["img1"],
        "Lesson": "6871bc14ada3650715efc786_detail_2"
      }
    ]
  },
  {
    "_id": "6871bc14ada3650715efc786_detail_3",
    "courseId": "TH-101",
    "courseName": "Thí nghiệm Hóa học",
    "type": "Chính thức",
    "date": "2026-08-05T00:00:00.000Z",
    "day": 5,
    "month": 8,
    "year": 2026,
    "time": "09:00-11:00",
    "room": {
      "_id": "room_456",
      "name": "Phòng Lab 1",
      "area": "Tòa nhà B",
      "color": "#8b5cf6"
    },
    "image": null,
    "topic": {
      "Name": "Bài 2: Phản ứng oxi hóa"
    },
    "teacher": {
      "_id": "684d1e031730348327887b2c",
      "name": "Huỹnh Trần Hữuu Nhật",
      "avatar": "avatar_1"
    },
    "teachingAs": {
      "_id": "assistant_1",
      "name": "Nguyễn Văn A"
    },
    "students": [
      {
        "_id": "student_1",
        "Checkin": 1,
        "Cmt": [],
        "Image": [],
        "Lesson": "6871bc14ada3650715efc786_detail_3"
      },
      {
        "_id": "student_2",
        "Checkin": 0,
        "Cmt": [],
        "Image": [],
        "Lesson": "6871bc14ada3650715efc786_detail_3"
      }
    ]
  },
  {
    "_id": "trial_course_sample_1",
    "courseId": "Hoc thu",
    "courseName": "Học thử tháng 8",
    "type": "Báo nghỉ",
    "date": "2026-08-08T00:00:00.000Z",
    "day": 8,
    "month": 8,
    "year": 2026,
    "time": "15:00-17:00",
    "room": {
      "_id": "room_789",
      "name": "Phòng 501",
      "area": "Tòa nhà C",
      "color": "#f59e0b"
    },
    "image": null,
    "topic": {
      "Name": "Khóa học robot AI"
    },
    "teacher": {
      "_id": "684d1e031730348327887b2c",
      "name": "Huỹnh Trần Hữu Nhật"
    },
    "teachingAs": null,
    "students": []
  }
]
```

## Display Changes Applied

### 1. Calendar Page (`src/app/calendar/page.js`)

**MonthView (DayLessons component):**
- Cancelled lessons now appear with:
  - Red background (`#fef2f2`) and red border (`#fca5a5`)
  - 60% opacity (visual fade effect)
  - "Báo nghỉ" badge in red

**MonthList component:**
- Cancelled lessons now appear with:
  - Red dot indicator (`#dc2626`)
  - "Nghỉ" badge (red, bg-red-100)
  - 60% opacity

**Previously:** Both components returned `null`, completely hiding cancelled lessons.

### 2. Day View (`src/app/calendar/ui/lesson_td/index.js`)

- Cancelled lessons now appear with:
  - Red left border (`#dc2626`)
  - "Báo nghỉ" badge prominently displayed
  - 60% opacity
  - No check-in/comment/evidence badges shown

**Previously:** Entire component returned `null`, hiding cancelled lessons completely.

## How to Test

1. Start dev server: `npm run dev`
2. Navigate to `/calendar`
3. View either month list or day view
4. Any lesson with `type === "Báo nghỉ"` will now display with red styling and "Báo nghỉ"/"Nghỉ" labels
5. Cancelled lessons that were previously invisible are now visible with appropriate visual indicators

## Data Source

The `type` field comes from the MongoDB aggregation pipeline in `src/app/api/(course)/calendar/route.js`:
- Official courses: `type: '$Detail.Type'` (line 92)
- Trial courses: `type: { $literal: 'trial' }` (line 156)

To mark a lesson as cancelled, set `Type: "Báo nghỉ"` in the course's `Detail` array in the database.
