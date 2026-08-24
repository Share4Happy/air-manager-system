import connectDB from '@/config/connectDB';
import Session from '@/models/session';
import Attendance from '@/models/attendance';
import User from '@/models/users';
import Area from '@/models/area';
import Book from '@/models/book';
import mongoose from 'mongoose';

/**
 * Lấy chi tiết buổi học kèm thông tin giáo viên, phòng học, chủ đề.
 */
export async function getSessionById(sessionId) {
    await connectDB();
    if (mongoose.connection.readyState !== 1) await mongoose.connection.asPromise();

    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) return null;

    const session = await Session.findById(sessionId).lean();
    if (!session) return null;

    const [teacher, teachingAs, book] = await Promise.all([
        session.teacher ? User.findById(session.teacher, 'name phone email avt').lean() : null,
        session.teachingAs ? User.findById(session.teachingAs, 'name phone email avt').lean() : null,
        session.book ? Book.findById(session.book).lean() : null
    ]);

    let topicInfo = null;
    if (book && session.topic) {
        topicInfo = (book.Topics || []).find(t => String(t._id) === String(session.topic));
    }

    let roomInfo = null;
    if (session.room) {
        const area = await Area.findOne({ 'rooms._id': session.room }, { 'rooms.$': 1, name: 1, color: 1 }).lean();
        if (area && area.rooms?.[0]) {
            roomInfo = {
                _id: area.rooms[0]._id,
                name: area.rooms[0].name,
                area: area.name,
                color: area.color
            };
        }
    }

    return {
        ...session,
        teacher: teacher || null,
        teachingAs: teachingAs || null,
        topic: topicInfo || null,
        room: roomInfo || { _id: null, name: null, area: null, color: null }
    };
}

/**
 * Lấy tất cả các buổi học của một khóa học theo mã lớp (sắp xếp theo số buổi tăng dần).
 */
export async function getSessionsByCourse(courseCode) {
    await connectDB();
    if (mongoose.connection.readyState !== 1) await mongoose.connection.asPromise();

    return Session.find({ courseCode }).sort({ buoi: 1 }).lean();
}

/**
 * Cập nhật thông tin buổi học (giáo viên, phòng, thời gian, chủ đề, ảnh...).
 */
export async function updateSessionInfo(sessionId, updateData) {
    await connectDB();
    if (mongoose.connection.readyState !== 1) await mongoose.connection.asPromise();

    return Session.findByIdAndUpdate(sessionId, { $set: updateData }, { new: true }).lean();
}
