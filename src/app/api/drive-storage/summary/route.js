import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import PostStudent from '@/models/student';
import PostBook from '@/models/book';
import TrialCourse from '@/models/coursetry';
import DriveFileSize from '@/models/driveFileSize';

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

function safeSize(v) {
    return typeof v === 'number' && !isNaN(v) ? v : 0;
}

function addFile(stats, size, type) {
    const isVideo = type === 'video';
    stats.totalSize += safeSize(size);
    stats.totalFiles++;
    if (isVideo) { stats.videoSize += safeSize(size); stats.videoFiles++; }
    else { stats.imageSize += safeSize(size); stats.imageFiles++; }
}

export async function GET() {
    try {
        await connectDB();

        const [courses, students, books, trials, sizeDocs] = await Promise.all([
            PostCourse.find({}).select('ID Detail Student').lean(),
            PostStudent.find({ Avt: { $exists: true, $ne: '' } }).select('AvtSize Avt').lean(),
            PostBook.find({}).select('ImageSize BadgeSize Image Badge').lean(),
            TrialCourse.find({}).select('sessions.images sessions.students.images').lean(),
            DriveFileSize.find({}).lean(),
        ]);

        const sizeMap = {};
        for (const doc of sizeDocs) {
            sizeMap[doc.fileId] = doc.size;
        }

        const mongoMap = {};
        for (const c of courses) {
            const stats = { totalSize: 0, totalFiles: 0, imageSize: 0, imageFiles: 0, videoSize: 0, videoFiles: 0 };
            for (const d of c.Detail || []) {
                for (const img of d.DetailImage || []) addFile(stats, sizeMap[img.id] || img.size || 0, img.type);
            }
            for (const s of c.Student || []) {
                for (const l of s.Learn || []) {
                    for (const img of l.Image || []) addFile(stats, sizeMap[img.id] || img.size || 0, img.type);
                }
            }
            mongoMap[c.ID] = { id: c._id, ...stats };
        }

        const drive = await getDriveClient();
        const parentId = process.env.DRIVE_COURSE_FOLDER_ID || '1syIZ0XYkmnYCYnQ6TRw1eCTgvKTuBZtR';
        const driveFolders = [];
        let pageToken;
        do {
            const res = await drive.files.list({
                q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'nextPageToken,files(id,name)',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
                pageSize: 200,
                pageToken,
            });
            driveFolders.push(...(res.data.files || []));
            pageToken = res.data.nextPageToken;
        } while (pageToken);

        const seen = new Set();
        const mergedList = [];
        for (const df of driveFolders) {
            const name = df.name;
            seen.add(name);
            const m = mongoMap[name];
            mergedList.push({
                id: m?.id || df.id,
                name,
                totalSize: m?.totalSize || 0,
                totalFiles: m?.totalFiles || 0,
                imageSize: m?.imageSize || 0,
                imageFiles: m?.imageFiles || 0,
                videoSize: m?.videoSize || 0,
                videoFiles: m?.videoFiles || 0,
                inMongo: !!m,
            });
        }
        for (const c of courses) {
            if (!seen.has(c.ID)) {
                const m = mongoMap[c.ID];
                mergedList.push({
                    id: c._id, name: c.ID, ...m, inMongo: true,
                });
            }
        }
        mergedList.sort((a, b) => (b.totalSize || 0) - (a.totalSize || 0));

        const totals = mergedList.reduce((acc, c) => {
            acc.totalSize += c.totalSize;
            acc.totalFiles += c.totalFiles;
            acc.imageSize += c.imageSize;
            acc.imageFiles += c.imageFiles;
            acc.videoSize += c.videoSize;
            acc.videoFiles += c.videoFiles;
            return acc;
        }, { totalSize: 0, totalFiles: 0, imageSize: 0, imageFiles: 0, videoSize: 0, videoFiles: 0 });

        let avatarSize = 0, avatarFiles = 0;
        for (const s of students) {
            const sz = sizeMap[s.Avt] || safeSize(s.AvtSize);
            avatarSize += sz;
            if (sz > 0) avatarFiles++;
        }

        let bookSize = 0, bookFiles = 0;
        for (const b of books) {
            const is = sizeMap[b.Image] || safeSize(b.ImageSize);
            const bs = sizeMap[b.Badge] || safeSize(b.BadgeSize);
            bookSize += is + bs;
            if (is > 0) bookFiles++;
            if (bs > 0) bookFiles++;
        }

        const trialStats = { totalSize: 0, totalFiles: 0, imageSize: 0, imageFiles: 0, videoSize: 0, videoFiles: 0 };
        for (const t of trials) {
            for (const ses of t.sessions || []) {
                if (ses.images?.id) {
                    const sz = sizeMap[ses.images.id] || ses.images.size || 0;
                    addFile(trialStats, sz, ses.images.type);
                }
                for (const stu of ses.students || []) {
                    for (const img of stu.images || []) {
                        const sz = sizeMap[img.id] || img.size || 0;
                        addFile(trialStats, sz, img.type);
                    }
                }
            }
        }

        return NextResponse.json({
            summary: {
                totalSize: totals.totalSize + avatarSize + bookSize + trialStats.totalSize,
                totalFiles: totals.totalFiles + avatarFiles + bookFiles + trialStats.totalFiles,
                imageSize: totals.imageSize + trialStats.imageSize,
                imageFiles: totals.imageFiles + trialStats.imageFiles,
                videoSize: totals.videoSize + trialStats.videoSize,
                videoFiles: totals.videoFiles + trialStats.videoFiles,
                avatarSize, avatarFiles,
                bookSize, bookFiles,
            },
            courses: mergedList,
            lastUpdated: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Drive storage summary error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
