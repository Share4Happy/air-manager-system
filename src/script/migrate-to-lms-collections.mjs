/**
 * Script CLI di chuyển dữ liệu khóa học sang Session & Attendance (LMS Architecture)
 * Cách dùng:
 *   node --env-file=.env.development src/script/migrate-to-lms-collections.mjs --dry-run
 *   node --env-file=.env.development src/script/migrate-to-lms-collections.mjs --execute
 */
import mongoose from 'mongoose';
import Course from '../models/course.js';
import TrialCourse from '../models/coursetry.js';
import Session from '../models/session.js';
import Attendance from '../models/attendance.js';

const isDryRun = !process.argv.includes('--execute');

const MONGO_URI = process.env.MongoDB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/air';

async function main() {
    console.log(`[LMS Migration] Connecting to MongoDB: ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log(`[LMS Migration] Connected. Mode: ${isDryRun ? 'DRY-RUN (Chạy thử - Không ghi DB)' : 'EXECUTE (Chạy thật)'}`);

    try {
        await Session.collection.dropIndex('courseCode_1_buoi_1');
    } catch {
        // Index does not exist
    }

    const courses = await Course.find({}).lean();
    const trialCourses = await TrialCourse.find({}).lean();

    console.log(`[LMS Migration] Found ${courses.length} official courses and ${trialCourses.length} trial courses.`);

    const sessionMap = new Map();
    const attendanceMap = new Map();

    for (const course of courses) {
        const details = course.Detail || [];
        const students = course.Student || [];

        details.forEach((d, idx) => {
            const sessionId = d._id || new mongoose.Types.ObjectId();
            const buoi = idx + 1;

            sessionMap.set(String(sessionId), {
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
            });

            students.forEach(st => {
                const studentId = st.ID || String(st._id);
                if (!studentId) return;

                const learnRecord = (st.Learn || []).find(lr => String(lr.Lesson) === String(sessionId) || (d._id && String(lr.Lesson) === String(d._id)));
                if (learnRecord) {
                    const attKey = `${String(sessionId)}__${String(studentId)}`;
                    attendanceMap.set(attKey, {
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
                    });
                }
            });
        });
    }

    for (const trial of trialCourses) {
        const sessions = trial.sessions || [];
        sessions.forEach((s, idx) => {
            const sessionId = s._id || new mongoose.Types.ObjectId();
            const buoi = idx + 1;

            sessionMap.set(String(sessionId), {
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
            });

            (s.students || []).forEach(st => {
                const studentId = String(st.studentId || st._id || st.ID);
                if (!studentId) return;

                const attKey = `${String(sessionId)}__${String(studentId)}`;
                attendanceMap.set(attKey, {
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
                });
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

    console.log(`[LMS Migration] Total Sessions: ${sessionOps.length}`);
    console.log(`[LMS Migration] Total Attendances: ${attendanceOps.length}`);

    if (!isDryRun) {
        console.log(`[LMS Migration] Writing to database...`);
        if (sessionOps.length > 0) {
            await Session.bulkWrite(sessionOps, { ordered: false });
        }
        if (attendanceOps.length > 0) {
            const batchSize = 500;
            for (let i = 0; i < attendanceOps.length; i += batchSize) {
                const batch = attendanceOps.slice(i, i + batchSize);
                await Attendance.bulkWrite(batch, { ordered: false });
            }
        }
        console.log(`[LMS Migration] SUCCESS! All data migrated.`);
    } else {
        console.log(`[LMS Migration] DRY-RUN complete. To execute for real, run with: --execute`);
    }

    await mongoose.disconnect();
}

main().catch(err => {
    console.error('[LMS Migration Error]', err);
    process.exit(1);
});
