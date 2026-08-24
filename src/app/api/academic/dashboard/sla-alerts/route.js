import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import PostCourse from '@/models/course'
import mongoose from 'mongoose'

function getTodayRange() {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    return { start, end, now }
}

export async function GET() {
    try {
        await connectDB()
        const { start, end, now } = getTodayRange()

        const Session = (await import('@/models/session')).default;
        const Attendance = (await import('@/models/attendance')).default;
        const Book = (await import('@/models/book')).default;

        const todaySessions = await Session.find({ day: { $gte: start, $lt: end } })
            .populate('teacher', 'name')
            .lean();

        const books = await Book.find({}, 'Topics').lean();
        const topicMap = new Map();
        books.forEach(b => (b.Topics || []).forEach(t => topicMap.set(String(t._id), t.Name)));

        const sessionIds = todaySessions.map(s => s._id);
        const attendances = await Attendance.find({ session: { $in: sessionIds } }).lean();

        const checkedSessions = new Set(attendances.filter(a => a.checkin > 0).map(a => String(a.session)));

        const items = [];
        for (const s of todaySessions) {
            const startTime = new Date(s.day);
            const endedAt = new Date(startTime.getTime() + 90 * 60 * 1000);
            if (endedAt > now) continue;

            const hasCheckin = checkedSessions.has(String(s._id));
            const hasJournal = !!s.note;
            const hasResource = (s.detailImage && s.detailImage.length > 0) || !!s.image;

            const missing = [];
            if (!hasCheckin) missing.push('attendance');
            if (!hasJournal) missing.push('journal');
            if (!hasResource) missing.push('resource');

            if (missing.length === 0) continue;

            const lateMs = now - endedAt;
            const lateMinutes = Math.round(lateMs / 60000);
            const level = lateMinutes > 120 ? 'VIOLATION' : 'WARNING';

            items.push({
                class_name: s.courseCode,
                lesson_number: s.buoi || 0,
                topic_name: topicMap.get(String(s.topic)) || 'N/A',
                teacher_name: s.teacher?.name || 'N/A',
                ended_at: endedAt.toISOString(),
                missing_items: missing,
                late_minutes: lateMinutes,
                level
            });
        }

        return NextResponse.json({ items });
    } catch (err) {
        console.error('SLA alerts error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
