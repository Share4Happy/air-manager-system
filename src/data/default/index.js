export function statusStudent({ type = 0, status = 0, courseId = null }) {
    if (type === 1) {
        // Hoàn thành khóa học
        return {
            status: status[0],
            act: status[1],
            date: new Date(),
            note: `Hoàn thành khóa học ${courseId ? courseId : 'Chữa xác định'}`
        }
    } else if (type === 2) {
        // Tham gia khóa học
        return {
            status: status[0],
            act: status[1],
            date: new Date(),
            note: `Tham gia khóa học ${courseId ? courseId : 'Chữa xác định'}`
        }
    } else if (type === 0) {
        // Tạo học sinh mới
        return {
            status: 1,
            act: 'chờ',
            date: new Date(),
            note: 'Tham gia AI ROBOTIC'
        }
    }

}