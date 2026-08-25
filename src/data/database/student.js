import Student from '@/models/student'
import connectDB from '@/config/connectDB'
import '@/models/area'
import '@/models/course'
import '@/models/book'
import { cacheData } from '@/lib/cache'
import { CheckProfileDone } from '@/function/server'
import mongoose from 'mongoose'

export function getStudentRank(createdAt, courseCount) {
    if (!createdAt) return { name: 'Member', level: 0, color: '#9ca3af', bg: '#f3f4f6' }

    const now = new Date()
    const createdAtDate = new Date(createdAt)
    const months = (now.getFullYear() - createdAtDate.getFullYear()) * 12 + (now.getMonth() - createdAtDate.getMonth())
    const years = months / 12

    if (years > 3) return { name: 'Kim Cương', level: 5, color: '#0e7490', bg: '#ecfeff' }
    if (years >= 2 && courseCount >= 9) return { name: 'Bạch Kim', level: 4, color: '#6d28d9', bg: '#f5f3ff' }
    if (years >= 1.5 && courseCount >= 6) return { name: 'Vàng', level: 3, color: '#ca8a04', bg: '#fefce8' }
    if (years >= 1 && courseCount >= 3) return { name: 'Bạc', level: 2, color: '#64748b', bg: '#f8fafc' }
    if (courseCount >= 1) return { name: 'Member', level: 1, color: '#6b7280', bg: '#f9fafb' }

    return { name: 'Mới', level: 0, color: '#9ca3af', bg: '#f3f4f6' }
}

async function dataStudent(_id) {
    try {
        await connectDB()
        if (_id && !mongoose.Types.ObjectId.isValid(_id)) return null
        const query = _id ? { _id } : {}
        let studentQuery = Student.find(query)
            .populate({ path: 'Area' })
            .populate({
                path: 'Course.course',
                model: 'course',
                select: 'ID Name Status Book TeacherHR',
                populate: { path: 'Book', model: 'book', select: 'ID Name Price Topics Image' }
            })
        const students = await studentQuery.lean()
        if (_id && students.length === 0) return null
        const Session = (await import('@/models/session')).default;
        const Attendance = (await import('@/models/attendance')).default;

        const processedStudents = [];
        for (const student of students) {
            const hasPaid = student.Course?.some(c => c.tuition != null) ?? false;
            const unpaidCount = student.Course?.filter(c => c.tuition == null).length ?? 0;
            if (_id && student.Course?.length) {
                const studentBusinessId = student.ID;
                const courseObjectIds = student.Course.map(e => e.course?._id).filter(Boolean);
                const [allSessions, allAttendances] = await Promise.all([
                    Session.find({ course: { $in: courseObjectIds } }).sort({ buoi: 1 }).lean(),
                    Attendance.find({
                        $or: [{ studentId: studentBusinessId }, { studentId: String(student._id) }]
                    }).lean()
                ]);

                const sessionGroup = new Map();
                allSessions.forEach(s => {
                    const k = String(s.course);
                    if (!sessionGroup.has(k)) sessionGroup.set(k, []);
                    sessionGroup.get(k).push(s);
                });

                const attGroup = new Map();
                allAttendances.forEach(a => {
                    attGroup.set(String(a.session), a);
                });

                student.Course = student.Course.map(enrollment => {
                    if (!enrollment.course) return null;
                    const { course } = enrollment;
                    const sList = sessionGroup.get(String(course._id)) || course.Detail || [];
                    const mergedDetails = sList.map(session => {
                        const att = attGroup.get(String(session._id));
                        return {
                            _id: session._id,
                            Day: session.day || session.Day,
                            Time: session.time || session.Time,
                            Room: session.room || session.Room,
                            Teacher: session.teacher || session.Teacher,
                            TeachingAs: session.teachingAs || session.TeachingAs,
                            Topic: session.topic || session.Topic,
                            Image: session.image || session.Image,
                            DetailImage: session.detailImage || session.DetailImage || [],
                            Checkin: att ? att.checkin : 0,
                            Cmt: att?.cmt || [],
                            CmtFn: att?.cmtFn || '',
                            Note: att?.note || '',
                            ImageStudent: att?.images || [],
                            absenceReason: att?.absenceReason || ''
                        };
                    });
                    return {
                        _id: course._id,
                        ID: course.ID,
                        Book: course.Book,
                        Detail: mergedDetails,
                        enrollmentStatus: enrollment.status,
                        tuition: enrollment.tuition
                    };
                }).filter(Boolean);
            }
            const createdAt = student._id ? new mongoose.Types.ObjectId(student._id).getTimestamp() : null;
            const courseCount = student.Course?.length ?? 0;
            const rank = getStudentRank(createdAt, courseCount);
            processedStudents.push({ ...student, hasPaid, unpaidCount, createdAt, courseCount, rank, statusProfile: CheckProfileDone(student) });
        }
        return JSON.parse(JSON.stringify(processedStudents));
    } catch (error) {
        console.error('Lỗi trong dataStudent:', error)
        return null
    }
}

export async function getStudentAll() {
    try {
        const cachedFunction = cacheData(() => dataStudent(), ['students'])
        const data = await cachedFunction()
        if (data) {
            return data.map(student => {
                if (!student.rank) {
                    const courseCount = student.Course?.length ?? 0
                    return { ...student, courseCount, rank: getStudentRank(student.createdAt, courseCount) }
                }
                return student
            })
        }
        return data
    } catch (error) {
        console.error('Lỗi trong StudentAll:', error)
        return null
    }
}

export async function getStudentOne(_id) {
    try {
        const data = await dataStudent(_id)
        return data
    } catch (error) {
        console.error('Lỗi trong StudentOne:', error)
        return null
    }
}

