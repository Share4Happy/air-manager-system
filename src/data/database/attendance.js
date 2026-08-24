import connectDB from '@/config/connectDB';
import Attendance from '@/models/attendance';
import Student from '@/models/student';
import mongoose from 'mongoose';

/**
 * Lấy danh sách điểm danh của 1 buổi học kèm thông tin học sinh (Name, Avt...).
 */
export async function getAttendancesBySession(sessionId) {
    await connectDB();
    if (mongoose.connection.readyState !== 1) await mongoose.connection.asPromise();

    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) return [];

    const attendances = await Attendance.find({ session: sessionId }).lean();
    if (attendances.length === 0) return [];

    const studentIds = attendances.map(a => a.studentId);
    const students = await Student.find(
        { $or: [{ ID: { $in: studentIds } }, { _id: { $in: studentIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } }] },
        'ID Name Avt BD Phone'
    ).lean();

    const studentMap = new Map();
    students.forEach(st => {
        studentMap.set(String(st.ID), st);
        studentMap.set(String(st._id), st);
    });

    return attendances.map(a => {
        const studentInfo = studentMap.get(String(a.studentId)) || {};
        return {
            _id: studentInfo._id || null,
            ID: studentInfo.ID || a.studentId || '–––',
            Name: studentInfo.Name || 'Không tên',
            Avt: studentInfo.Avt || null,
            attendance: {
                _id: a._id,
                Checkin: a.checkin ?? 0,
                Cmt: a.cmt || [],
                CmtFn: a.cmtFn || '',
                Note: a.note || '',
                Lesson: a.session,
                Image: a.images || [],
                absenceReason: a.absenceReason || '',
                makeupStatus: a.makeupStatus || 'NOT_REQUIRED'
            }
        };
    });
}

/**
 * Cập nhật điểm danh và nhận xét của 1 học sinh trong 1 buổi học (Thao tác nguyên tử O(1)).
 */
export async function updateStudentAttendance({ sessionId, studentId, checkin, cmt, cmtFn, note, images, makeupStatus, absenceReason }) {
    await connectDB();
    if (mongoose.connection.readyState !== 1) await mongoose.connection.asPromise();

    const updateFields = {};
    if (typeof checkin === 'number') updateFields.checkin = checkin;
    if (cmt !== undefined) updateFields.cmt = cmt;
    if (cmtFn !== undefined) updateFields.cmtFn = cmtFn;
    if (note !== undefined) updateFields.note = note;
    if (images !== undefined) updateFields.images = images;
    if (makeupStatus !== undefined) updateFields.makeupStatus = makeupStatus;
    if (absenceReason !== undefined) updateFields.absenceReason = absenceReason;

    return Attendance.findOneAndUpdate(
        { session: sessionId, studentId },
        { $set: updateFields },
        { new: true, upsert: true }
    ).lean();
}

/**
 * Cập nhật điểm danh hàng loạt cho 1 buổi học.
 */
export async function bulkUpdateAttendance(sessionId, attendanceList) {
    await connectDB();
    if (mongoose.connection.readyState !== 1) await mongoose.connection.asPromise();

    if (!Array.isArray(attendanceList) || attendanceList.length === 0) return { modifiedCount: 0 };

    const ops = attendanceList.map(item => ({
        updateOne: {
            filter: { session: sessionId, studentId: item.studentId },
            update: {
                $set: {
                    checkin: item.checkin,
                    cmt: item.cmt,
                    cmtFn: item.cmtFn,
                    note: item.note,
                    images: item.images,
                    makeupStatus: item.makeupStatus || 'NOT_REQUIRED'
                }
            },
            upsert: true
        }
    }));

    return Attendance.bulkWrite(ops);
}
