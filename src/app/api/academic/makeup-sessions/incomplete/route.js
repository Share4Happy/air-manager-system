import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import PostCourse from '@/models/course'
import PostStudent from '@/models/student'
import Book from '@/models/book'

export async function GET(req) {
    try {
        await connectDB()

        const { searchParams } = new URL(req.url)
        const q = searchParams.get('q')

        // 1. Quét các khóa đang học (Status: true) HOẶC khóa đã kết thúc trong vòng 2 tuần (14 ngày)
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const baseStatusFilter = {
            $or: [
                { Status: true },
                { Status: false, updatedAt: { $gte: twoWeeksAgo } }
            ]
        };

        let filter = baseStatusFilter;
        if (q) {
            filter = {
                $and: [
                    baseStatusFilter,
                    {
                        $or: [
                            { ID: { $regex: q, $options: 'i' } },
                            { 'Book.Name': { $regex: q, $options: 'i' } },
                        ]
                    }
                ]
            };
        }

        const courses = await PostCourse.find(filter)
            .populate('Book', 'Name Topics')
            .select('ID Book Detail Student Status updatedAt')
            .limit(100)
            .lean()

        const allStudentIds = new Set()
        courses.forEach(c => (c.Student || []).forEach(s => allStudentIds.add(s.ID)))
        const students = await PostStudent.find({ ID: { $in: [...allStudentIds] } }, 'ID Name').lean()
        const studentMap = new Map(students.map(s => [s.ID, s.Name]))

        // Tải topic map từ Book
        const allBooks = await Book.find({}, 'Name Topics').lean();
        const topicMap = new Map();
        allBooks.forEach(b => {
            (b.Topics || []).forEach(t => {
                topicMap.set(String(t._id), t.Name || t.Topic || 'Chủ đề');
            });
        });

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

        const now = new Date();
        const result = [];

        for (const course of courses) {
            const sList = sessionGroup.get(String(course._id)) || (course.Detail || []);
            if (sList.length === 0) continue;

            // Sắp xếp các buổi học theo ngày/thứ tự buổi
            sList.sort((a, b) => new Date(a.day || a.Day || 0) - new Date(b.day || b.Day || 0));

            // Chỉ tính những buổi học ĐÃ DIỄN RA (ngày <= hiện tại hoặc đã có dữ liệu checkin)
            // và KHÔNG PHẢI là buổi Báo nghỉ
            const pastOrCheckedLessons = sList.filter(d => {
                const type = d.type || d.Type || '';
                if (type === 'Báo nghỉ') return false;
                const dDay = d.day ? new Date(d.day) : (d.Day ? new Date(d.Day) : null);
                const isPast = dDay && dDay <= now;
                const isChecked = Boolean(d.checkin || d.Checkin);
                return isPast || isChecked;
            });

            if (pastOrCheckedLessons.length === 0) continue;

            const courseStudents = [];
            for (const student of (course.Student || [])) {
                const studentAtts = attGroup.get(`${String(course._id)}_${student.ID}`) || [];
                
                // Tập hợp các buổi học sinh ĐÃ ĐI HỌC (checkin = 1) hoặc ĐÃ HOÀN THÀNH HỌC BÙ
                const attendedSet = new Set(
                    studentAtts
                        .filter(a => a.checkin === 1 || a.makeupStatus === 'MAKEUP_COMPLETED')
                        .map(a => String(a.session))
                );

                // Buổi thiếu = Buổi đã diễn ra mà học sinh chưa có mặt
                const missingDetail = pastOrCheckedLessons.filter(d => !attendedSet.has(String(d._id)));

                if (missingDetail.length > 0) {
                    courseStudents.push({
                        studentId: student.ID,
                        studentName: studentMap.get(student.ID) || 'N/A',
                        attendedLessons: attendedSet.size,
                        totalLessons: sList.length,
                        pastLessons: pastOrCheckedLessons.length,
                        missingLessons: missingDetail.length,
                        missingDetail: missingDetail.map(d => {
                            const topicId = String(d.topic || d.Topic || '');
                            const topicName = topicMap.get(topicId) || d.topic?.Name || d.Topic?.Name || 'Chủ đề bài học';
                            return {
                                lessonId: d._id,
                                Day: d.day || d.Day,
                                Time: d.time || d.Time,
                                Topic: { Name: topicName },
                            };
                        }),
                    });
                }
            }

            if (courseStudents.length > 0) {
                result.push({
                    courseId: course._id,
                    courseName: course.ID,
                    course: {
                        _id: course._id,
                        ID: course.ID,
                        Name: course.ID,
                        Status: course.Status,
                        bookName: course.Book?.Name || 'N/A'
                    },
                    statusText: course.Status ? 'Đang diễn ra' : 'Đã kết thúc (< 2 tuần)',
                    bookName: course.Book?.Name || 'N/A',
                    students: courseStudents,
                });
            }
        }

        return NextResponse.json({ courses: result, items: result });
    } catch (err) {
        console.error('Incomplete makeup courses error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
