import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import PostStudent from '@/models/student';
import PostBook from '@/models/book';
import TrialCourse from '@/models/coursetry';
import DriveFileSize from '@/models/driveFileSize';
import { google } from 'googleapis';

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
        const res = await drive.files.get({
            fileId,
            fields: 'size',
            supportsAllDrives: true,
        });
        return parseInt(res.data.size, 10) || 0;
    } catch (e) {
        console.warn(`  Cannot get size for ${fileId}: ${e.message}`);
        return 0;
    }
}

async function backfill() {
    await connectDB();
    const drive = await getDriveClient();

    const allFileIds = new Set();

    // 1. Collect all file IDs from Course DetailImage
    console.log('Scanning Course DetailImage...');
    const courses = await PostCourse.find({ 'Detail.DetailImage': { $exists: true } }).lean();
    for (const course of courses) {
        for (const detail of course.Detail || []) {
            for (const img of detail.DetailImage || []) {
                if (img.id) allFileIds.add(img.id);
            }
        }
        for (const student of course.Student || []) {
            for (const learn of student.Learn || []) {
                for (const img of learn.Image || []) {
                    if (img.id) allFileIds.add(img.id);
                }
            }
        }
    }

    // 2. Collect all file IDs from TrialCourse
    console.log('Scanning TrialCourse...');
    const trials = await TrialCourse.find({ 'sessions.images': { $exists: true } }).lean();
    for (const trial of trials) {
        for (const session of trial.sessions || []) {
            if (session.images?.id) allFileIds.add(session.images.id);
            for (const student of session.students || []) {
                for (const img of student.images || []) {
                    if (img.id) allFileIds.add(img.id);
                }
            }
        }
    }

    // 3. Collect all file IDs from Student avatars
    console.log('Scanning Student avatars...');
    const students = await PostStudent.find({ Avt: { $exists: true, $ne: '' } }).lean();
    for (const student of students) {
        if (student.Avt) allFileIds.add(student.Avt);
    }

    // 4. Collect all file IDs from Book images
    console.log('Scanning Book images...');
    const books = await PostBook.find({
        $or: [
            { Image: { $exists: true, $ne: '' } },
            { Badge: { $exists: true, $ne: '' } }
        ]
    }).lean();
    for (const book of books) {
        if (book.Image) allFileIds.add(book.Image);
        if (book.Badge) allFileIds.add(book.Badge);
    }

    // 5. Filter out already-known sizes
    const known = await DriveFileSize.find({ fileId: { $in: [...allFileIds] } }).lean();
    const knownSet = new Set(known.map(d => d.fileId));
    const unknownIds = [...allFileIds].filter(id => !knownSet.has(id));

    console.log(`Total files: ${allFileIds.size}, already known: ${known.length}, need fetching: ${unknownIds.length}`);

    // 6. Fetch sizes from Drive
    const sizeMap = {};
    const concurrency = 15;
    for (let i = 0; i < unknownIds.length; i += concurrency) {
        const batch = unknownIds.slice(i, i + concurrency);
        const results = await Promise.allSettled(batch.map(id => getFileSize(drive, id)));
        results.forEach((r, j) => {
            if (r.status === 'fulfilled' && r.value > 0) {
                sizeMap[batch[j]] = r.value;
            }
        });
        if (batch.length > 0) {
            console.log(`  Progress: ${Math.min(i + concurrency, unknownIds.length)}/${unknownIds.length}`);
        }
    }

    // 7. Save to DriveFileSize collection
    const ops = Object.entries(sizeMap).map(([fileId, size]) => ({
        updateOne: {
            filter: { fileId },
            update: { $set: { fileId, size, updatedAt: new Date() } },
            upsert: true,
        }
    }));

    if (ops.length > 0) {
        await DriveFileSize.bulkWrite(ops);
        console.log(`Saved ${ops.length} file sizes to DriveFileSize collection.`);
    }

    console.log('Backfill complete!');
}

backfill().catch(console.error);
