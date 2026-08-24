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

    const Session = (await import('@/models/session')).default;
    const Attendance = (await import('@/models/attendance')).default;

    const sessionQuery = {
        day: { $gte: start, $lt: end }
    };
    if (hasTeacherFilter) {
        sessionQuery.$or = [
            { teacher: teacherObjId },
            { teachingAs: teacherObjId }
        ];
    }

    // 1. Tải song song Session và các bảng tham chiếu
    const [sessions, books, areas, users] = await Promise.all([
        Session.find(sessionQuery).sort({ day: 1 }).lean(),
        Book.find({}, 'Name Topics').lean(),
        Area.find({}, 'name color rooms').lean(),
        User.find({}, 'name phone email').lean()
    ]);

    // 2. Xây dựng Hash Map phục vụ tra cứu O(1) nhanh chóng
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

    // 3. Nếu đã có dữ liệu trong Session collection (LMS mới), trả về ngay
    if (sessions.length > 0) {
        const sessionIds = sessions.map(s => s._id);
        const attendances = await Attendance.find({ session: { $in: sessionIds } }).lean();

        const attMap = new Map();
        attendances.forEach(a => {
            const key = String(a.session);
            if (!attMap.has(key)) attMap.set(key, []);
            attMap.get(key).push({
                ID: a.studentId,
                Checkin: a.checkin,
                Cmt: a.cmt || [],
                CmtFn: a.cmtFn || '',
                Note: a.note || '',
                Image: a.images || [],
                absenceReason: a.absenceReason || ''
            });
        });

        const results = sessions.map(s => {
            const sessionDate = new Date(s.day);
            const roomInfo = s.room ? roomMap.get(String(s.room)) : null;

            return {
                _id: s._id,
                buoi: s.buoi,
                courseId: s.courseCode,
                courseName: s.courseCode,
                status: true,
                type: s.type || 'official',
                date: s.day,
                day: sessionDate.getUTCDate(),
                month: sessionDate.getUTCMonth() + 1,
                year: sessionDate.getUTCFullYear(),
                time: s.time || '',
                room: roomInfo || { _id: null, name: null, area: null, color: null },
                image: s.image || null,
                topic: s.topic ? topicMap.get(String(s.topic)) || null : null,
                teacher: s.teacher ? userMap.get(String(s.teacher)) || null : null,
                teachingAs: s.teachingAs ? userMap.get(String(s.teachingAs)) || null : null,
                students: attMap.get(String(s._id)) || []
            };
        });

        return results.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // 4. Fallback sang CSDL nhúng cũ nếu chưa chuyển đổi
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

    const [courses, trialCourses] = await Promise.all([
        Course.find(courseQuery).lean(),
        TrialCourse.find(trialQuery).lean()
    ]);

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
                status: course.Status || false,
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
                status: false,
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
