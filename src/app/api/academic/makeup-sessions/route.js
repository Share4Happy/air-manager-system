import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import MakeupSession from '@/models/makeupSession'
import PostCourse from '@/models/course'
import PostStudent from '@/models/student'
import Book from '@/models/book'
import User from '@/models/users'
import authenticate from '@/utils/authenticate'
import mongoose from 'mongoose'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')
        const courseId = searchParams.get('courseId')
        const studentId = searchParams.get('studentId')
        const scope = searchParams.get('scope')

        await connectDB()

        const Session = (await import('@/models/session')).default;
        const Attendance = (await import('@/models/attendance')).default;

        // 1. Lọc từ collection MakeupSession (Học vụ tạo)
        const filter = {}
        if (status) {
            filter.makeupStatus = status
        } else if (scope === 'need') {
            filter.makeupStatus = { $in: ['MAKEUP_PENDING', 'MAKEUP_REQUIRED', 'MAKEUP_SCHEDULED'] }
        } else if (scope === 'history') {
            filter.makeupStatus = { $in: ['MAKEUP_COMPLETED', 'MAKEUP_ABSENT', 'MAKEUP_EXPIRED', 'MAKEUP_CANCELLED'] }
        }
        if (courseId && mongoose.Types.ObjectId.isValid(courseId)) filter.course = new mongoose.Types.ObjectId(courseId)
        if (studentId) filter.studentId = studentId

        const makeupSessionDocs = await MakeupSession.find(filter)
            .populate('course', 'ID Name')
            .populate('makeupTeacher', 'name')
            .populate('createdBy', 'name')
            .populate('updatedBy', 'name')
            .sort({ createdAt: -1 })
            .lean()

        // 2. Tìm tất cả các buổi 'Học bù' được giáo viên tạo trực tiếp trong khóa học (Session có type = 'Học bù')
        const teacherMakeupSessions = await Session.find({
            $or: [
                { type: 'Học bù' },
                { type: 'makeup' },
                { courseCode: { $regex: /-BÙ$/i } }
            ]
        })
            .populate('teacher', 'name')
            .populate('course', 'ID Name')
            .sort({ day: -1 })
            .lean()

        const teacherSessionIds = teacherMakeupSessions.map(s => s._id);
        const [teacherAtts, allBooks, allUsers] = await Promise.all([
            Attendance.find({ session: { $in: teacherSessionIds } }).lean(),
            Book.find({}, 'Name Topics').lean(),
            User.find({}, 'name').lean()
        ]);

        const topicMap = new Map();
        allBooks.forEach(b => {
            (b.Topics || []).forEach(t => {
                topicMap.set(String(t._id), t.Name || t.Topic || 'Chủ đề bài học');
            });
        });

        const userMap = new Map();
        allUsers.forEach(u => userMap.set(String(u._id), u.name));

        const sessionAttMap = new Map();
        teacherAtts.forEach(a => {
            const k = String(a.session);
            if (!sessionAttMap.has(k)) sessionAttMap.set(k, []);
            sessionAttMap.get(k).push(a);
        });

        // Set các lesson ID đã có trong MakeupSession để tránh trùng lặp
        const existingMakeupLessons = new Set(
            makeupSessionDocs.map(m => `${String(m.lesson || m.makeupLesson)}_${m.studentId}`)
        );

        // Chuyển đổi các buổi bù của giáo viên thành danh sách ca học bù
        const now = new Date();
        const synthesizedItems = [];

        for (const ses of teacherMakeupSessions) {
            const attList = sessionAttMap.get(String(ses._id)) || [];
            const sesDate = ses.day ? new Date(ses.day) : null;
            const topicName = topicMap.get(String(ses.topic)) || 'Học bù theo lớp';
            const teacherName = ses.teacher?.name || userMap.get(String(ses.teacher)) || 'Giáo viên';

            for (const att of attList) {
                const dedupeKey = `${String(ses._id)}_${att.studentId}`;
                if (existingMakeupLessons.has(dedupeKey)) continue;

                // Xác định trạng thái của ca bù
                let st = 'MAKEUP_SCHEDULED';
                if (att.checkin === 1 || att.makeupStatus === 'MAKEUP_COMPLETED') {
                    st = 'MAKEUP_COMPLETED';
                } else if (att.checkin === 2 || att.checkin === 3 || att.makeupStatus === 'MAKEUP_ABSENT') {
                    st = 'MAKEUP_ABSENT';
                } else if (sesDate && sesDate < now) {
                    st = (att.checkin === 0 && att.cmt?.length > 0) ? 'MAKEUP_COMPLETED' : 'MAKEUP_COMPLETED';
                }

                // Kiểm tra điều kiện lọc
                if (status && st !== status) continue;
                if (scope === 'need' && !['MAKEUP_PENDING', 'MAKEUP_REQUIRED', 'MAKEUP_SCHEDULED'].includes(st)) continue;
                if (scope === 'history' && !['MAKEUP_COMPLETED', 'MAKEUP_ABSENT', 'MAKEUP_EXPIRED', 'MAKEUP_CANCELLED'].includes(st)) continue;
                if (studentId && att.studentId !== studentId) continue;
                if (courseId && String(ses.course?._id || ses.course) !== String(courseId)) continue;

                synthesizedItems.push({
                    _id: `teacher_${ses._id}_${att.studentId}`,
                    course: {
                        _id: ses.course?._id || ses.course,
                        ID: ses.courseCode || ses.course?.ID || 'HỌC-BÙ',
                        Name: ses.courseName || ses.course?.Name || ses.courseCode || 'Học bù'
                    },
                    lesson: ses._id,
                    studentId: att.studentId,
                    makeupTeacher: { name: teacherName },
                    makeupDate: ses.day,
                    makeupTime: ses.time || '18:00 - 19:30',
                    contentToMakeup: topicName,
                    note: ses.note || 'Buổi học bù giáo viên tạo trong khóa',
                    makeupStatus: st,
                    createdAt: ses.createdAt || ses.day,
                    isTeacherCreated: true,
                    source: 'Giáo viên tạo'
                });
            }
        }

        // 3. Gom danh sách học sinh để lấy Tên học sinh
        const allItems = [...makeupSessionDocs, ...synthesizedItems];
        const studentIds = [...new Set(allItems.map(s => s.studentId))];
        const students = studentIds.length > 0
            ? await PostStudent.find({ ID: { $in: studentIds } }, 'ID Name _id').lean()
            : [];
        const studentMap = new Map(students.map(s => [s.ID, s.Name]));

        const items = allItems.map(s => ({
            ...s,
            studentName: studentMap.get(s.studentId) || s.studentId || 'N/A',
        }));

        // Sắp xếp ngày tạo/ngày học mới nhất lên đầu
        items.sort((a, b) => {
            const dateA = new Date(a.makeupDate || a.createdAt || 0);
            const dateB = new Date(b.makeupDate || b.createdAt || 0);
            return dateB - dateA;
        });

        return NextResponse.json({ items });
    } catch (err) {
        console.error('Makeup sessions list error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const auth = await authenticate(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { courseId, lessonId, studentId, studentIds, ...rest } = body;

        if (!courseId) {
            return NextResponse.json({ error: 'Thiếu thông tin khóa học (courseId)' }, { status: 400 });
        }

        await connectDB();

        const Session = (await import('@/models/session')).default;
        const Attendance = (await import('@/models/attendance')).default;
        const courseDoc = await PostCourse.findById(courseId).select('ID Book').lean();

        // Danh sách học sinh cần tạo bù
        const targetStudents = studentIds && Array.isArray(studentIds) && studentIds.length > 0
            ? studentIds
            : (studentId ? [studentId] : []);

        if (targetStudents.length === 0) {
            return NextResponse.json({ error: 'Thiếu thông tin học sinh (studentId)' }, { status: 400 });
        }

        // Tạo buổi Session mới để xuất hiện trên Lịch dạy (/calendar)
        let createdSessionId = null;
        if (rest.makeupDate) {
            const newSession = await Session.create({
                course: new mongoose.Types.ObjectId(courseId),
                courseCode: courseDoc?.ID ? `${courseDoc.ID}-BÙ` : 'HỌC-BÙ',
                courseName: courseDoc?.ID ? `Học bù lớp ${courseDoc.ID}` : 'Học bù',
                buoi: 1,
                day: new Date(rest.makeupDate),
                time: rest.makeupTime || '18:00 - 19:30',
                room: rest.room && mongoose.Types.ObjectId.isValid(rest.room) ? new mongoose.Types.ObjectId(rest.room) : null,
                teacher: rest.makeupTeacher && mongoose.Types.ObjectId.isValid(rest.makeupTeacher) ? new mongoose.Types.ObjectId(rest.makeupTeacher) : null,
                teachingAs: rest.teachingAs && mongoose.Types.ObjectId.isValid(rest.teachingAs) ? new mongoose.Types.ObjectId(rest.teachingAs) : null,
                topic: rest.topic && mongoose.Types.ObjectId.isValid(rest.topic) ? new mongoose.Types.ObjectId(rest.topic) : (lessonId && mongoose.Types.ObjectId.isValid(lessonId) ? new mongoose.Types.ObjectId(lessonId) : null),
                note: rest.note || rest.contentToMakeup || '',
                type: 'Học bù',
                status: true
            });
            createdSessionId = newSession._id;

            // Tạo các bản ghi Attendance cho các học sinh tham gia buổi bù
            const attDocs = targetStudents.map(stId => ({
                session: newSession._id,
                course: new mongoose.Types.ObjectId(courseId),
                courseCode: courseDoc?.ID || 'HỌC-BÙ',
                studentId: stId,
                checkin: 0,
                cmt: [],
                cmtFn: '',
                note: '',
                images: [],
                absenceReason: '',
                makeupStatus: 'MAKEUP_SCHEDULED'
            }));
            await Attendance.insertMany(attDocs).catch(err => console.error('Attendance.insertMany error in makeup session create:', err.message));
        }

        // Tạo các bản ghi trong MakeupSession
        const createdSessions = [];
        for (const stId of targetStudents) {
            const session = await MakeupSession.create({
                course: new mongoose.Types.ObjectId(courseId),
                lesson: lessonId && mongoose.Types.ObjectId.isValid(lessonId) ? new mongoose.Types.ObjectId(lessonId) : (createdSessionId || new mongoose.Types.ObjectId()),
                makeupLesson: createdSessionId,
                studentId: stId,
                ...rest,
                makeupTeacher: rest.makeupTeacher && mongoose.Types.ObjectId.isValid(rest.makeupTeacher) ? new mongoose.Types.ObjectId(rest.makeupTeacher) : null,
                room: rest.room && mongoose.Types.ObjectId.isValid(rest.room) ? new mongoose.Types.ObjectId(rest.room) : null,
                createdBy: auth.user._id,
                makeupStatus: rest.makeupDate ? 'MAKEUP_SCHEDULED' : (rest.makeupStatus || 'MAKEUP_PENDING')
            });
            createdSessions.push(session);

            if (lessonId && mongoose.Types.ObjectId.isValid(lessonId)) {
                await Promise.all([
                    Attendance.updateOne(
                        { session: new mongoose.Types.ObjectId(lessonId), studentId: stId },
                        { $set: { makeupStatus: session.makeupStatus } }
                    ).catch(err => console.error('Attendance.updateOne makeupStatus error:', err.message)),
                    PostCourse.updateOne(
                        { _id: new mongoose.Types.ObjectId(courseId), 'Student.ID': stId, 'Student.Learn.Lesson': new mongoose.Types.ObjectId(lessonId) },
                        { $set: { 'Student.$[stu].Learn.$[les].makeupStatus': session.makeupStatus } },
                        { arrayFilters: [{ 'stu.ID': stId }, { 'les.Lesson': new mongoose.Types.ObjectId(lessonId) }] }
                    ).catch(err => console.error('PostCourse.updateOne makeupStatus error:', err.message))
                ]);
            }
        }

        return NextResponse.json({ sessions: createdSessions, session: createdSessions[0] }, { status: 201 });
    } catch (err) {
        console.error('Create makeup session error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
