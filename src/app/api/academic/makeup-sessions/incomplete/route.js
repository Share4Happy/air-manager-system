import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import PostCourse from '@/models/course'
import PostStudent from '@/models/student'

export async function GET(req) {
    try {
        await connectDB()

        const { searchParams } = new URL(req.url)
        const q = searchParams.get('q')

        const filter = { Status: true }
        if (q) {
            filter.$or = [
                { ID: { $regex: q, $options: 'i' } },
                { 'Book.Name': { $regex: q, $options: 'i' } },
            ]
        }

        const courses = await PostCourse.find(filter)
            .populate('Book', 'Name')
            .select('ID Book Detail Student')
            .limit(50)
            .lean()

        const allStudentIds = new Set()
        courses.forEach(c => (c.Student || []).forEach(s => allStudentIds.add(s.ID)))
        const students = await PostStudent.find({ ID: { $in: [...allStudentIds] } }, 'ID Name').lean()
        const studentMap = new Map(students.map(s => [s.ID, s.Name]))

        const Session = (await import('@/models/session')).default;
        const Attendance = (await import('@/models/attendance')).default;

        const courseIds = courses.map(c => c._id);
        const [allSessions, allAttendances] = await Promise.all([
            Session.find({ course: { $in: courseIds } }).lean(),
            Attendance.find({ course: { $in: courseIds } }).lean()
        ]);

        const sessionGroup = new Map();
        allSessions.forEach(s => {
            const k = String(s.course);
            if (!sessionGroup.has(k)) sessionGroup.set(k, []);
            sessionGroup.get(k).push(s);
        });

        const attGroup = new Map();
        allAttendances.forEach(a => {
            const k = `${String(a.course)}_${a.studentId}`;
            if (!attGroup.has(k)) attGroup.set(k, []);
            attGroup.get(k).push(a);
        });

        const result = [];
        for (const course of courses) {
            const sList = sessionGroup.get(String(course._id)) || (course.Detail || []);
            const totalLessons = sList.length;
            if (totalLessons === 0) continue;

            const courseStudents = [];
            for (const student of (course.Student || [])) {
                const studentAtts = attGroup.get(`${String(course._id)}_${student.ID}`) || [];
                const attendedSet = new Set(
                    studentAtts.filter(a => a.checkin === 1).map(a => String(a.session))
                );
                const missingDetail = sList.filter(d => !attendedSet.has(String(d._id)));

                if (missingDetail.length > 0) {
                    courseStudents.push({
                        studentId: student.ID,
                        studentName: studentMap.get(student.ID) || 'N/A',
                        attendedLessons: attendedSet.size,
                        totalLessons,
                        missingLessons: missingDetail.length,
                        missingDetail: missingDetail.map(d => ({
                            lessonId: d._id,
                            Day: d.day || d.Day,
                            Time: d.time || d.Time,
                            Topic: d.topic || d.Topic,
                        })),
                    });
                }
            }

            if (courseStudents.length > 0) {
                result.push({
                    courseId: course._id,
                    courseName: course.ID,
                    bookName: course.Book?.Name || 'N/A',
                    students: courseStudents,
                });
            }
        }

        return NextResponse.json({ courses: result });
    } catch (err) {
        console.error('Incomplete makeup courses error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
