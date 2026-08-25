import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import MakeupSession from '@/models/makeupSession'
import mongoose from 'mongoose'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const courseId = searchParams.get('courseId')
        const studentId = searchParams.get('studentId')

        await connectDB()
        const Session = (await import('@/models/session')).default;
        const Attendance = (await import('@/models/attendance')).default;

        const match = {}
        if (courseId && mongoose.Types.ObjectId.isValid(courseId)) match.course = new mongoose.Types.ObjectId(courseId)
        if (studentId) match.studentId = studentId

        const [makeupSessions, teacherSessions] = await Promise.all([
            MakeupSession.find(match).lean(),
            Session.find({
                $or: [
                    { type: 'Học bù' },
                    { type: 'makeup' },
                    { courseCode: { $regex: /-BÙ$/i } }
                ]
            }).lean()
        ]);

        const teacherSessionIds = teacherSessions.map(s => s._id);
        const teacherAtts = await Attendance.find({ session: { $in: teacherSessionIds } }).lean();

        const existingLessons = new Set(
            makeupSessions.map(m => `${String(m.lesson || m.makeupLesson)}_${m.studentId}`)
        );

        const statusMap = {
            MAKEUP_PENDING: 0,
            MAKEUP_REQUIRED: 0,
            MAKEUP_SCHEDULED: 0,
            MAKEUP_COMPLETED: 0,
            MAKEUP_ABSENT: 0,
            MAKEUP_EXPIRED: 0,
            MAKEUP_CANCELLED: 0
        };

        for (const item of makeupSessions) {
            const st = item.makeupStatus || 'MAKEUP_PENDING';
            statusMap[st] = (statusMap[st] || 0) + 1;
        }

        const now = new Date();
        const teacherSessionMap = new Map(teacherSessions.map(s => [String(s._id), s]));

        for (const att of teacherAtts) {
            const k = `${String(att.session)}_${att.studentId}`;
            if (existingLessons.has(k)) continue;

            const ses = teacherSessionMap.get(String(att.session));
            const sesDate = ses?.day ? new Date(ses.day) : null;

            let st = 'MAKEUP_SCHEDULED';
            if (att.checkin === 1 || att.makeupStatus === 'MAKEUP_COMPLETED') {
                st = 'MAKEUP_COMPLETED';
            } else if (att.checkin === 2 || att.checkin === 3 || att.makeupStatus === 'MAKEUP_ABSENT') {
                st = 'MAKEUP_ABSENT';
            } else if (sesDate && sesDate < now) {
                st = 'MAKEUP_COMPLETED';
            }
            statusMap[st] = (statusMap[st] || 0) + 1;
        }

        const total = Object.values(statusMap).reduce((sum, count) => sum + count, 0);

        return NextResponse.json({
            total,
            byStatus: statusMap
        });
    } catch (err) {
        console.error('Makeup stats error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
