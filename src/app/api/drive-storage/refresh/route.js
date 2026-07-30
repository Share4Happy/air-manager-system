import { google } from 'googleapis';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import PostStudent from '@/models/student';
import PostBook from '@/models/book';
import TrialCourse from '@/models/coursetry';

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
    } catch { return 0; }
}

function safeSize(v) { return typeof v === 'number' && !isNaN(v) ? v : 0; }

function addFile(stats, size, type) {
    const isVideo = type === 'video';
    stats.totalSize += safeSize(size);
    stats.totalFiles++;
    if (isVideo) { stats.videoSize += safeSize(size); stats.videoFiles++; }
    else { stats.imageSize += safeSize(size); stats.imageFiles++; }
}

export async function POST() {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const send = (data) => {
                controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
            };

            try {
                await connectDB();
                const drive = await getDriveClient();

                send({ type: 'progress', current: 0, total: 1, label: 'Đang quét dữ liệu từ MongoDB...' });

                const [courses, students, books, trials] = await Promise.all([
                    PostCourse.find({}).select('ID Detail Student').lean(),
                    PostStudent.find({ Avt: { $exists: true, $ne: '' } }).select('Avt').lean(),
                    PostBook.find({}).select('Image Badge').lean(),
                    TrialCourse.find({}).select('sessions.images sessions.students.images').lean(),
                ]);

                const fileIds = new Set();
                for (const c of courses) {
                    for (const d of c.Detail || []) for (const img of d.DetailImage || []) if (img.id) fileIds.add(img.id);
                    for (const s of c.Student || []) for (const l of s.Learn || []) for (const img of l.Image || []) if (img.id) fileIds.add(img.id);
                }
                for (const t of trials) {
                    for (const ses of t.sessions || []) {
                        if (ses.images?.id) fileIds.add(ses.images.id);
                        for (const stu of ses.students || []) for (const img of stu.images || []) if (img.id) fileIds.add(img.id);
                    }
                }
                for (const s of students) if (s.Avt) fileIds.add(s.Avt);
                for (const b of books) { if (b.Image) fileIds.add(b.Image); if (b.Badge) fileIds.add(b.Badge); }

                const ids = [...fileIds];
                const total = ids.length;
                const sizeMap = {};
                let processed = 0;
                const concurrency = 15;

                send({ type: 'progress', current: 0, total, label: `Đang lấy kích thước từ Drive (0/${total})...` });

                for (let i = 0; i < ids.length; i += concurrency) {
                    const batch = ids.slice(i, i + concurrency);
                    const results = await Promise.allSettled(batch.map(id => getFileSize(drive, id)));
                    results.forEach((r, j) => { sizeMap[batch[j]] = r.status === 'fulfilled' ? r.value : 0; });
                    processed += batch.length;
                    send({ type: 'progress', current: processed, total, label: `Đang lấy kích thước từ Drive (${processed}/${total})...` });
                }

                send({ type: 'progress', current: total, total, label: 'Đang cập nhật vào MongoDB...' });

                let updatedCount = 0;
                for (const [fileId, size] of Object.entries(sizeMap)) {
                    if (size === 0) continue;
                    updatedCount++;
                    const results = await Promise.allSettled([
                        PostCourse.updateMany(
                            { 'Detail.DetailImage.id': fileId },
                            { $set: { 'Detail.$[detail].DetailImage.$[img].size': size } },
                            { arrayFilters: [{ 'detail.DetailImage.id': fileId }, { 'img.id': fileId }] }
                        ),
                        PostCourse.updateMany(
                            { 'Student.Learn.Image.id': fileId },
                            { $set: { 'Student.$[student].Learn.$[learn].Image.$[img].size': size } },
                            { arrayFilters: [{ 'student.Learn.Image.id': fileId }, { 'learn.Image.id': fileId }, { 'img.id': fileId }] }
                        ),
                        TrialCourse.updateMany(
                            { 'sessions.images.id': fileId },
                            { $set: { 'sessions.$[session].images.$[img].size': size } },
                            { arrayFilters: [{ 'session.images.id': fileId }, { 'img.id': fileId }] }
                        ),
                        TrialCourse.updateMany(
                            { 'sessions.students.images.id': fileId },
                            { $set: { 'sessions.$[session].students.$[student].images.$[img].size': size } },
                            { arrayFilters: [{ 'session.students.images.id': fileId }, { 'student.images.id': fileId }, { 'img.id': fileId }] }
                        ),
                        PostStudent.updateMany({ Avt: fileId }, { $set: { AvtSize: size } }),
                        PostBook.updateMany({ Image: fileId }, { $set: { ImageSize: size } }),
                        PostBook.updateMany({ Badge: fileId }, { $set: { BadgeSize: size } }),
                    ]);
                    const matched = results.filter(r => r.status === 'fulfilled' && r.value?.modifiedCount > 0).length;
                    if (matched === 0 && fileId.length > 10) {
                        console.warn(`[Refresh] No update for ${fileId.substring(0, 10)}...`);
                    }
                }

                send({ type: 'progress', current: total, total, label: 'Đang tổng hợp dữ liệu...' });

                const courseList = [];
                let courseSize = 0, courseFiles = 0, courseImgSize = 0, courseImgFiles = 0, courseVidSize = 0, courseVidFiles = 0;
                for (const c of courses) {
                    const stats = { totalSize: 0, totalFiles: 0, imageSize: 0, imageFiles: 0, videoSize: 0, videoFiles: 0 };
                    for (const d of c.Detail || []) for (const img of d.DetailImage || []) addFile(stats, img.size || sizeMap[img.id] || 0, img.type);
                    for (const s of c.Student || []) for (const l of s.Learn || []) for (const img of l.Image || []) addFile(stats, img.size || sizeMap[img.id] || 0, img.type);
                    courseSize += stats.totalSize; courseFiles += stats.totalFiles;
                    courseImgSize += stats.imageSize; courseImgFiles += stats.imageFiles;
                    courseVidSize += stats.videoSize; courseVidFiles += stats.videoFiles;
                    courseList.push({ id: c._id, name: c.ID, ...stats });
                }
                courseList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

                // Merge with all Drive folders
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

                const mongoMap = {};
                for (const c of courseList) mongoMap[c.name] = c;

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
                for (const c of courseList) {
                    if (!seen.has(c.name)) {
                        mergedList.push({ ...c, inMongo: true });
                    }
                }
                mergedList.sort((a, b) => (b.totalSize || 0) - (a.totalSize || 0));

                const mergedCourseSize = mergedList.reduce((s, c) => s + c.totalSize, 0);
                const mergedCourseFiles = mergedList.reduce((s, c) => s + c.totalFiles, 0);
                const mergedCourseImgSize = mergedList.reduce((s, c) => s + c.imageSize, 0);
                const mergedCourseImgFiles = mergedList.reduce((s, c) => s + c.imageFiles, 0);
                const mergedCourseVidSize = mergedList.reduce((s, c) => s + c.videoSize, 0);
                const mergedCourseVidFiles = mergedList.reduce((s, c) => s + c.videoFiles, 0);

                let avatarSize = 0, avatarFiles = 0;
                for (const s of students) { const sz = safeSize(sizeMap[s.Avt]); avatarSize += sz; if (sz > 0) avatarFiles++; }

                let bookSize = 0, bookFiles = 0;
                for (const b of books) { const is = safeSize(sizeMap[b.Image]); const bs = safeSize(sizeMap[b.Badge]); bookSize += is + bs; if (is > 0) bookFiles++; if (bs > 0) bookFiles++; }

                let trialStats = { totalSize: 0, totalFiles: 0, imageSize: 0, imageFiles: 0, videoSize: 0, videoFiles: 0 };
                for (const t of trials) for (const ses of t.sessions || []) {
                    if (ses.images?.id) addFile(trialStats, sizeMap[ses.images.id] || ses.images.size || 0, ses.images.type);
                    for (const stu of ses.students || []) for (const img of stu.images || []) addFile(trialStats, sizeMap[img.id] || img.size || 0, img.type);
                }

                const totalSize = mergedCourseSize + avatarSize + bookSize + trialStats.totalSize;
                const totalFiles = mergedCourseFiles + avatarFiles + bookFiles + trialStats.totalFiles;
                const totalImageSize = mergedCourseImgSize + trialStats.imageSize;
                const totalImageFiles = mergedCourseImgFiles + trialStats.imageFiles;
                const totalVideoSize = mergedCourseVidSize + trialStats.videoSize;
                const totalVideoFiles = mergedCourseVidFiles + trialStats.videoFiles;

                send({
                    type: 'done',
                    data: {
                        summary: {
                            totalSize, totalFiles,
                            imageSize: totalImageSize, imageFiles: totalImageFiles,
                            videoSize: totalVideoSize, videoFiles: totalVideoFiles,
                            avatarSize, avatarFiles,
                            bookSize, bookFiles,
                        },
                        courses: mergedList,
                        updated: updatedCount,
                        lastUpdated: new Date().toISOString(),
                    }
                });
            } catch (error) {
                console.error('[Refresh] Error:', error);
                send({ type: 'error', message: error.message });
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
}
