import connectDB from '@/config/connectDB';
import Course from '@/models/course';
import TrialCourse from '@/models/coursetry';
import Book from '@/models/book';
import User from '@/models/users';
import Area from '@/models/area';
import mongoose from 'mongoose';

/**
 * Lấy danh sách lịch học trong tháng của tất cả các khóa học chính quy và học thử.
 * @param {Object} params
 * @param {number} params.month - Tháng (1-12)
 * @param {number} params.year - Năm (ví dụ 2026)
 * @param {string} [params.teacherId] - ID giáo viên hoặc trợ giảng (nếu lọc theo giáo viên)
 * @returns {Promise<Array>} Danh sách các buổi học đã sắp xếp theo thời gian
 */
export async function getMonthlyCalendar({ month, year, teacherId }) {
    await connectDB();
    if (mongoose.connection.readyState !== 1) await mongoose.connection.asPromise();

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const hasTeacherFilter = teacherId && mongoose.Types.ObjectId.isValid(teacherId);
    const teacherObjId = hasTeacherFilter ? new mongoose.Types.ObjectId(teacherId) : null;

    // 1. Query Course và TrialCourse có buổi học trong khoảng thời gian
    const courseQuery = {
        'Detail.Day': { $gte: start, $lt: end }
    };
    if (hasTeacherFilter) {
        courseQuery.$or = [
            { 'Detail.Teacher': teacherObjId },
            { 'Detail.TeachingAs': teacherObjId }
        ];
    }

    const trialQuery = {
        'sessions.day': { $gte: start, $lt: end }
    };
    if (hasTeacherFilter) {
        trialQuery.$or = [
            { 'sessions.teacher': teacherObjId },
            { 'sessions.teachingAs': teacherObjId }
        ];
    }

    // 2. Tải song song dữ liệu tham chiếu
    const [courses, trialCourses, books, areas, users] = await Promise.all([
        Course.find(courseQuery).lean(),
        TrialCourse.find(trialQuery).lean(),
        Book.find({}, 'Name Topics').lean(),
        Area.find({}, 'name color rooms').lean(),
        User.find({}, 'name phone email').lean()
    ]);

    // 3. Xây dựng Hash Map phục vụ tra cứu O(1) nhanh chóng
    const userMap = new Map();
    users.forEach(u => userMap.set(String(u._id), u));

    const topicMap = new Map();
    books.forEach(b => {
        (b.Topics || []).forEach(t => topicMap.set(String(t._id), t));
    });

    const roomMap = new Map();
    areas.forEach(a => {
        (a.rooms || []).forEach(r => {
            roomMap.set(String(r._id), {
                _id: r._id,
                name: r.name,
                area: a.name,
                color: a.color
            });
        });
    });

    const results = [];

    // 4. Định dạng các buổi học chính quy
    for (const course of courses) {
        const details = course.Detail || [];
        const students = course.Student || [];

        details.forEach((session, index) => {
            const sessionDate = new Date(session.Day);
            if (sessionDate < start || sessionDate >= end) return;

            if (hasTeacherFilter) {
                const matchTeacher = String(session.Teacher) === String(teacherId);
                const matchTA = String(session.TeachingAs) === String(teacherId);
                if (!matchTeacher && !matchTA) return;
            }

            const buoi = index + 1;
            const sessionIdStr = String(session._id);

            const matchedStudents = students
                .filter(st => st.Learn?.some(lr => String(lr.Lesson) === sessionIdStr))
                .map(st => ({
                    ...st,
                    Learn: st.Learn.filter(lr => String(lr.Lesson) === sessionIdStr)
                }));

            const roomInfo = session.Room ? roomMap.get(String(session.Room)) : null;

            results.push({
                _id: session._id,
                buoi,
                courseId: course.ID,
                courseName: course.Name,
                type: session.Type || 'AI Robotic',
                date: session.Day,
                day: sessionDate.getUTCDate(),
                month: sessionDate.getUTCMonth() + 1,
                year: sessionDate.getUTCFullYear(),
                time: session.Time || '',
                room: roomInfo || { _id: null, name: null, area: null, color: null },
                image: session.Image || null,
                topic: session.Topic ? topicMap.get(String(session.Topic)) || null : null,
                teacher: session.Teacher ? userMap.get(String(session.Teacher)) || null : null,
                teachingAs: session.TeachingAs ? userMap.get(String(session.TeachingAs)) || null : null,
                students: matchedStudents
            });
        });
    }

    // 5. Định dạng các buổi học thử
    for (const trial of trialCourses) {
        const sessions = trial.sessions || [];

        sessions.forEach((session, index) => {
            const sessionDate = new Date(session.day);
            if (sessionDate < start || sessionDate >= end) return;

            if (hasTeacherFilter) {
                const matchTeacher = String(session.teacher) === String(teacherId);
                const matchTA = String(session.teachingAs) === String(teacherId);
                if (!matchTeacher && !matchTA) return;
            }

            const buoi = index + 1;
            const roomInfo = session.room ? roomMap.get(String(session.room)) : null;

            results.push({
                _id: session._id,
                buoi,
                courseId: trial.name,
                courseName: trial.name,
                type: 'trial',
                date: session.day,
                day: sessionDate.getUTCDate(),
                month: sessionDate.getUTCMonth() + 1,
                year: sessionDate.getUTCFullYear(),
                time: session.time || '',
                room: roomInfo || { _id: null, name: null, area: null, color: null },
                image: null,
                topic: session.topicId ? topicMap.get(String(session.topicId)) || null : null,
                teacher: session.teacher ? userMap.get(String(session.teacher)) || null : null,
                teachingAs: session.teachingAs ? userMap.get(String(session.teachingAs)) || null : null,
                students: session.students || []
            });
        });
    }

    // 6. Sắp xếp theo ngày học tăng dần
    return results.sort((a, b) => new Date(a.date) - new Date(b.date));
}
