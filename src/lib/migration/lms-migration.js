import connectDB from '@/config/connectDB';
import Course from '@/models/course';
import TrialCourse from '@/models/coursetry';
import Session from '@/models/session';
import Attendance from '@/models/attendance';
import mongoose from 'mongoose';

/**
 * Lấy số liệu thống kê đối soát giữa Schema cũ và Schema mới (LMS).
 */
export async function getMigrationStats() {
    await connectDB();
    if (mongoose.connection.readyState !== 1) await mongoose.connection.asPromise();

    const [courses, trialCourses, totalNewSessions, totalNewAttendances] = await Promise.all([
        Course.find({}, 'ID Name Detail Student').lean(),
        TrialCourse.find({}, 'name sessions').lean(),
        Session.countDocuments(),
        Attendance.countDocuments()
    ]);

    let oldOfficialSessions = 0;
    let oldOfficialAttendances = 0;
    let totalOfficialStudents = 0;

    courses.forEach(c => {
        oldOfficialSessions += (c.Detail || []).length;
        totalOfficialStudents += (c.Student || []).length;
        (c.Student || []).forEach(st => {
            oldOfficialAttendances += (st.Learn || []).length;
        });
    });

    let oldTrialSessions = 0;
    let oldTrialAttendances = 0;

    trialCourses.forEach(t => {
        oldTrialSessions += (t.sessions || []).length;
        (t.sessions || []).forEach(s => {
            oldTrialAttendances += (s.students || []).length;
        });
    });

    const totalOldSessions = oldOfficialSessions + oldTrialSessions;
    const totalOldAttendances = oldOfficialAttendances + oldTrialAttendances;

    const isFullySynced = totalOldSessions > 0 && totalNewSessions === totalOldSessions && totalNewAttendances === totalOldAttendances;
    const isCleanedLms = totalOldSessions === 0 && totalNewSessions > 0;

    return {
        coursesCount: courses.length,
        trialCoursesCount: trialCourses.length,
        totalOfficialStudents,
        oldSchema: {
            officialSessions: oldOfficialSessions,
            trialSessions: oldTrialSessions,
            totalSessions: totalOldSessions,
            officialAttendances: oldOfficialAttendances,
            trialAttendances: oldTrialAttendances,
            totalAttendances: totalOldAttendances
        },
        newSchema: {
            sessionsCount: totalNewSessions,
            attendancesCount: totalNewAttendances
        },
        status: isCleanedLms ? 'CLEANED_LMS' : isFullySynced ? 'SYNCED' : totalNewSessions > 0 ? 'PARTIAL' : 'NOT_MIGRATED'
    };
}

/**
 * Thực hiện quét và chuyển đổi dữ liệu an toàn sang Session & Attendance.
 * @param {Object} options
 * @param {boolean} options.dryRun - Nếu true, chỉ quét và tính toán, không ghi DB
 */
export async function runLmsMigration({ dryRun = false } = {}) {
    await connectDB();
    if (mongoose.connection.readyState !== 1) await mongoose.connection.asPromise();

    const logs = [];
    const pushLog = (msg) => {
        const time = new Date().toLocaleTimeString('vi-VN');
        logs.push(`[${time}] ${msg}`);
    };

    pushLog(`Bắt đầu tiến trình chuyển đổi CSDL (Chế độ: ${dryRun ? 'DRY-RUN (Chạy thử)' : 'EXECUTE (Chạy thật)'})...`);

    const courses = await Course.find({}).lean();
    const trialCourses = await TrialCourse.find({}).lean();

    pushLog(`Tìm thấy ${courses.length} lớp học chính quy và ${trialCourses.length} lớp học thử.`);

    // Drop stale unique index if existed from older schema
    try {
        await Session.collection.dropIndex('courseCode_1_buoi_1');
    } catch {
        // Index does not exist or already dropped
    }

    const sessionMap = new Map(); // Map<sessionIdStr, doc>
    const attendanceMap = new Map(); // Map<session_student_key, doc>

    // 1. Xử lý các khóa học chính quy
    for (const course of courses) {
        const details = course.Detail || [];
        const students = course.Student || [];

        pushLog(`Đang xử lý lớp ${course.ID} (${course.Name || 'Không tên'}) - ${details.length} buổi học, ${students.length} học sinh...`);

        details.forEach((d, idx) => {
            const sessionId = d._id || new mongoose.Types.ObjectId();
            const buoi = idx + 1;

            const sessionDoc = {
                _id: sessionId,
                course: course._id,
                courseCode: course.ID || 'CHUA_CO_MA',
                courseName: course.Name || '',
                courseType: course.Type || 'AI Robotic',
                buoi,
                day: d.Day || new Date(),
                time: d.Time || '',
                room: d.Room || null,
                teacher: d.Teacher || null,
                teachingAs: d.TeachingAs || null,
                topic: d.Topic || null,
                book: course.Book || null,
                image: d.Image || null,
                detailImage: d.DetailImage || [],
                checkin: d.Checkin || null,
                note: d.Note || '',
                type: d.Type || 'Chính khóa',
                status: true
            };

            sessionMap.set(String(sessionId), sessionDoc);

            // Trích xuất điểm danh từng học sinh cho buổi học này
            students.forEach(st => {
                const studentId = st.ID || String(st._id);
                if (!studentId) return;

                const learnRecord = (st.Learn || []).find(lr => String(lr.Lesson) === String(sessionId) || (d._id && String(lr.Lesson) === String(d._id)));
                if (learnRecord) {
                    const attKey = `${String(sessionId)}__${String(studentId)}`;
                    const attDoc = {
                        session: sessionId,
                        course: course._id,
                        courseCode: course.ID || 'CHUA_CO_MA',
                        studentId: studentId,
                        checkin: typeof learnRecord.Checkin === 'number' ? learnRecord.Checkin : 0,
                        cmt: learnRecord.Cmt || [],
                        cmtFn: learnRecord.CmtFn || '',
                        note: learnRecord.Note || '',
                        images: learnRecord.Image || [],
                        absenceReason: learnRecord.absenceReason || '',
                        makeupStatus: learnRecord.makeupStatus || 'NOT_REQUIRED'
                    };

                    attendanceMap.set(attKey, attDoc);
                }
            });
        });
    }

    // 2. Xử lý các khóa học thử
    for (const trial of trialCourses) {
        const sessions = trial.sessions || [];
        pushLog(`Đang xử lý lớp học thử ${trial.name} - ${sessions.length} buổi...`);

        sessions.forEach((s, idx) => {
            const sessionId = s._id || new mongoose.Types.ObjectId();
            const buoi = idx + 1;

            const sessionDoc = {
                _id: sessionId,
                course: trial._id,
                courseCode: trial.name || 'HocThu',
                courseName: trial.name || 'Khóa học thử',
                courseType: 'trial',
                buoi,
                day: s.day || new Date(),
                time: s.time || '',
                room: s.room || null,
                teacher: s.teacher || null,
                teachingAs: s.teachingAs || null,
                topic: s.topicId || null,
                book: s.book || null,
                image: s.folderId || null,
                detailImage: s.images ? [s.images] : [],
                checkin: s.checkin || null,
                note: s.note || '',
                type: 'trial',
                status: s.status !== false
            };

            sessionMap.set(String(sessionId), sessionDoc);

            // Trích xuất điểm danh học sinh học thử
            (s.students || []).forEach(st => {
                const studentId = String(st.studentId || st._id || st.ID);
                if (!studentId) return;

                const attKey = `${String(sessionId)}__${String(studentId)}`;
                const attDoc = {
                    session: sessionId,
                    course: trial._id,
                    courseCode: trial.name || 'HocThu',
                    studentId: studentId,
                    checkin: st.checkin ? 1 : 0,
                    cmt: st.cmt || [],
                    cmtFn: '',
                    note: st.note || '',
                    images: st.images || [],
                    absenceReason: '',
                    makeupStatus: 'NOT_REQUIRED'
                };

                attendanceMap.set(attKey, attDoc);
            });
        });
    }

    const sessionOps = Array.from(sessionMap.values()).map(doc => ({
        updateOne: {
            filter: { _id: doc._id },
            update: { $set: doc },
            upsert: true
        }
    }));

    const attendanceOps = Array.from(attendanceMap.values()).map(doc => ({
        updateOne: {
            filter: { session: doc.session, studentId: doc.studentId },
            update: { $set: doc },
            upsert: true
        }
    }));

    const totalSessionsGenerated = sessionOps.length;
    const totalAttendancesGenerated = attendanceOps.length;

    pushLog(`Tổng kết dữ liệu trích xuất: ${totalSessionsGenerated} buổi học (Sessions), ${totalAttendancesGenerated} bản ghi điểm danh (Attendances).`);

    // 3. Thực hiện BulkWrite nếu không phải Dry Run
    if (!dryRun) {
        pushLog(`Đang ghi dữ liệu vào collection 'sessions' (${sessionOps.length} operations)...`);
        if (sessionOps.length > 0) {
            await Session.bulkWrite(sessionOps, { ordered: false });
        }
        pushLog(`Đã ghi thành công ${sessionOps.length} buổi học.`);

        pushLog(`Đang ghi dữ liệu vào collection 'attendances' (${attendanceOps.length} operations)...`);
        if (attendanceOps.length > 0) {
            // Chia batch 500 bản ghi để tối ưu bộ nhớ
            const batchSize = 500;
            for (let i = 0; i < attendanceOps.length; i += batchSize) {
                const batch = attendanceOps.slice(i, i + batchSize);
                await Attendance.bulkWrite(batch, { ordered: false });
            }
        }
        pushLog(`Đã ghi thành công ${attendanceOps.length} bản ghi điểm danh.`);
        pushLog(`Hoàn tất 100% quá trình chuyển đổi CSDL!`);
    } else {
        pushLog(`[DRY-RUN] Không có thay đổi nào được ghi vào CSDL. Dữ liệu đã sẵn sàng để chuyển đổi thật!`);
    }

    return {
        success: true,
        dryRun,
        totalSessionsGenerated,
        totalAttendancesGenerated,
        logs
    };
}

/**
 * Dọn dẹp mảng nhúng Detail và Student.Learn trong Course và sessions trong TrialCourse.
 */
export async function cleanupLegacyEmbeddedData() {
    await connectDB();
    if (mongoose.connection.readyState !== 1) await mongoose.connection.asPromise();

    const logs = [];
    const pushLog = (msg) => {
        const time = new Date().toLocaleTimeString('vi-VN');
        logs.push(`[${time}] ${msg}`);
    };

    pushLog('Bắt đầu tiến trình dọn dẹp dữ liệu nhúng cũ trong CSDL...');

    // 1. Kiểm tra đảm bảo Session và Attendance đã có dữ liệu
    const [sessionsCount, attendancesCount] = await Promise.all([
        Session.countDocuments(),
        Attendance.countDocuments()
    ]);

    if (sessionsCount === 0 || attendancesCount === 0) {
        throw new Error('Chưa thể xóa dữ liệu cũ vì collection Session hoặc Attendance chưa có dữ liệu đồng bộ!');
    }

    pushLog(`Xác thực an toàn: CSDL mới hiện có ${sessionsCount} buổi học và ${attendancesCount} lượt điểm danh.`);

    // 2. Unset Detail và Student.Learn trên Course
    pushLog("Đang dọn dẹp trường 'Detail' và 'Student.Learn' trong collection 'courses'...");
    const courseRes = await Course.updateMany(
        {},
        { $unset: { Detail: 1, 'Student.$[].Learn': 1 } }
    );
    pushLog(`Đã dọn dẹp thành công ${courseRes.modifiedCount} khóa học chính quy.`);

    // 3. Unset students trong sessions của TrialCourse
    pushLog("Đang dọn dẹp mảng 'students' trong các buổi học thử 'coursetries'...");
    const trialRes = await TrialCourse.updateMany(
        {},
        { $unset: { 'sessions.$[].students': 1 } }
    );
    pushLog(`Đã dọn dẹp thành công ${trialRes.modifiedCount} khóa học thử.`);

    pushLog('Hoàn tất dọn dẹp CSDL! Hệ thống hiện đã chuyển hoàn toàn sang mô hình LMS tách rời.');

    const stats = await getMigrationStats();

    return {
        success: true,
        logs,
        stats
    };
}
