export function formatDate(date) {
    if (!date) return 'Thiếu thông tin';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return 'Thiếu thông tin';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}
export function countStudentsWithLesson(lessonId, data) {
    let count = 0;

    for (const student of data) {
        const hasLesson = student.Learn.some(entry => entry.Lesson === lessonId);
        if (hasLesson) {
            count++;
        }
    }

    return count;
}

export function calculatePastLessons(courseData) {
    let pastLessonsCount = 0;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    courseData.Detail.forEach(lesson => {
        const lessonDate = new Date(lesson.Day);
        lessonDate.setHours(0, 0, 0, 0);

        if (lessonDate < currentDate) {
            pastLessonsCount++;
        }
    });

    return pastLessonsCount;
}

import {
    getDriveImageBase,
    getDriveFolderBase,
    getDriveThumbnailBase,
    getDrivePreviewBase,
    getDriveDownloadBase,
    getDefaultAvatarId,
} from '@/utils/env'

export function srcImage(id) {
    if (!id) return null;
    if (id.startsWith(getDriveImageBase())) return id;
    return `${getDriveImageBase()}${id}`
}

export function formatCurrencyVN(number) {
    if (typeof number !== 'number' || isNaN(number)) {
        return '0 VNĐ';
    }
    const formattedNumber = number.toLocaleString('vi-VN');
    return `${formattedNumber} VNĐ`;
}

export const truncateString = (str, start, end) => !str ? "" : str.length > start + end ? `${str.slice(0, start)}...${str.slice(-end)}` : str;
export const driveFolderUrl = (id) => `${getDriveFolderBase()}${id}`
export const driveThumbnailUrl = (id, size = 200) => `${getDriveThumbnailBase()}${id}&sz=w${size}`
export const drivePreviewUrl = (id) => `${getDrivePreviewBase()}${id}/preview`
export const driveDownloadUrl = (id) => `${getDriveDownloadBase()}${id}`
export const defaultAvatarUrl = () => `${getDriveImageBase()}${getDefaultAvatarId()}`

