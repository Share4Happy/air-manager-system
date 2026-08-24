import { google } from 'googleapis';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import PostStudent from '@/models/student';
import PostBook from '@/models/book';
import TrialCourse from '@/models/coursetry';
import DriveFileSize from '@/models/driveFileSize';
import DriveStorageConfig from '@/models/driveStorageConfig';
import { computeNextRunAt } from '@/function/report';

async function getDriveClient() {
    const auth = new google.auth.GoogleAuth({
        projectId: process.env.GOOGLE_PROJECT_ID,
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    return google.drive({ version: 'v3', auth });
}

async function getFileSize(drive, fileId) {
    try {
        const res = await drive.files.get({ fileId, fields: 'size', supportsAllDrives: true });
        return parseInt(res.data.size, 10) || 0;
    } catch {
        return 0;
    }
}

export async function executeDriveStorageScan({ areas = [] } = {}) {
    await connectDB();
    const startTime = Date.now();
    const drive = await getDriveClient();

    const courseQuery = areas && areas.length > 0 ? { Area: { $in: areas } } : {};

    const [courses, students, books, trials] = await Promise.all([
        PostCourse.find(courseQuery).select('ID Detail Student').lean(),
        PostStudent.find({ Avt: { $exists: true, $ne: '' } }).select('Avt').lean(),
        PostBook.find({}).select('Image Badge').lean(),
        TrialCourse.find({}).select('sessions.images sessions.students.images').lean(),
    ]);

    const Session = (await import('@/models/session')).default;
    const Attendance = (await import('@/models/attendance')).default;

    const courseIds = courses.map(c => c._id);
    const sessionFilter = courseIds.length > 0 ? { course: { $in: courseIds } } : {};
    const attFilter = courseIds.length > 0 ? { course: { $in: courseIds } } : {};

    const [allSessions, allAttendances] = await Promise.all([
        Session.find(sessionFilter).select('detailImage').lean(),
        Attendance.find(attFilter).select('images').lean()
    ]);

    const fileIds = new Set();
    for (const ses of allSessions) {
        for (const img of ses.detailImage || []) if (img?.id) fileIds.add(img.id);
    }
    for (const att of allAttendances) {
        for (const img of att.images || []) if (img?.id) fileIds.add(img.id);
    }
    for (const c of courses) {
        for (const d of c.Detail || []) {
            for (const img of d.DetailImage || []) if (img?.id) fileIds.add(img.id);
        }
        for (const s of c.Student || []) {
            for (const l of s.Learn || []) {
                for (const img of l.Image || []) if (img?.id) fileIds.add(img.id);
            }
        }
    }

    if (!areas || areas.length === 0) {
        for (const t of trials) {
            for (const ses of t.sessions || []) {
                if (ses.images?.id) fileIds.add(ses.images.id);
                for (const stu of ses.students || []) {
                    for (const img of stu.images || []) if (img?.id) fileIds.add(img.id);
                }
            }
        }
        for (const s of students) if (s.Avt) fileIds.add(s.Avt);
        for (const b of books) {
            if (b.Image) fileIds.add(b.Image);
            if (b.Badge) fileIds.add(b.Badge);
        }
    }

    const ids = [...fileIds];
    const total = ids.length;
    const sizeMap = {};
    const concurrency = 15;

    for (let i = 0; i < ids.length; i += concurrency) {
        const batch = ids.slice(i, i + concurrency);
        const results = await Promise.allSettled(batch.map(id => getFileSize(drive, id)));
        results.forEach((r, j) => {
            sizeMap[batch[j]] = r.status === 'fulfilled' ? r.value : 0;
        });
    }

    const ops = Object.entries(sizeMap)
        .filter(([_, size]) => size > 0)
        .map(([fileId, size]) => ({
            updateOne: {
                filter: { fileId },
                update: { $set: { fileId, size, updatedAt: new Date() } },
                upsert: true,
            }
        }));

    let updatedCount = 0;
    if (ops.length > 0) {
        const res = await DriveFileSize.bulkWrite(ops);
        updatedCount = (res.upsertedCount || 0) + (res.modifiedCount || 0);
    }

    const durationMs = Date.now() - startTime;
    return {
        totalFiles: total,
        updatedFiles: updatedCount,
        durationMs,
    };
}

export async function processDriveScanJob() {
    try {
        await connectDB();
        const now = new Date();
        const cfg = await DriveStorageConfig.findOne({
            isActive: true,
            nextRunAt: { $lte: now }
        }).lean();

        if (!cfg) return { count: 0 };

        // Claim execution
        await DriveStorageConfig.findByIdAndUpdate(cfg._id, {
            $set: {
                nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                'lastRunStats.status': 'running',
            }
        });

        console.log(`[Scheduler][DriveScan] Starting auto scan (${cfg.frequency}, ${cfg.scanTime})...`);

        let scanResult;
        try {
            scanResult = await executeDriveStorageScan({ areas: cfg.areas });
            const nextRunAt = computeNextRunAt({
                frequency: cfg.frequency,
                sendTime: cfg.scanTime,
                weekday: cfg.weekday,
                monthDay: cfg.monthDay,
            });

            await DriveStorageConfig.findByIdAndUpdate(cfg._id, {
                lastRunAt: new Date(),
                nextRunAt,
                lastRunStats: {
                    totalFiles: scanResult.totalFiles,
                    updatedFiles: scanResult.updatedFiles,
                    durationMs: scanResult.durationMs,
                    status: 'success',
                    error: '',
                }
            });

            console.log(`[Scheduler][DriveScan] Completed successfully in ${scanResult.durationMs}ms (${scanResult.updatedFiles}/${scanResult.totalFiles} files). Next run at: ${nextRunAt.toISOString()}`);
        } catch (scanErr) {
            console.error('[Scheduler][DriveScan] Scan execution error:', scanErr);
            const nextRunAt = computeNextRunAt({
                frequency: cfg.frequency,
                sendTime: cfg.scanTime,
                weekday: cfg.weekday,
                monthDay: cfg.monthDay,
            });

            await DriveStorageConfig.findByIdAndUpdate(cfg._id, {
                lastRunAt: new Date(),
                nextRunAt,
                lastRunStats: {
                    totalFiles: 0,
                    updatedFiles: 0,
                    durationMs: 0,
                    status: 'failed',
                    error: scanErr.message || 'Lỗi quét Drive',
                }
            });
        }

        return { count: 1 };
    } catch (err) {
        console.error('[Scheduler][DriveScan] Global error:', err);
        return { count: 0 };
    }
}
