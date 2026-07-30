import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import PostStudent from '@/models/student';
import PostBook from '@/models/book';
import TrialCourse from '@/models/coursetry';
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

    // 1. Backfill Course DetailImage
    console.log('Backfilling Course DetailImage...');
    const courses = await PostCourse.find({ 'Detail.DetailImage': { $exists: true } }).lean();
    for (const course of courses) {
        for (const detail of course.Detail || []) {
            for (const img of detail.DetailImage || []) {
                if (!img.size) {
                    const size = await getFileSize(drive, img.id);
                    if (size > 0) {
                        await PostCourse.updateOne(
                            { _id: course._id, 'Detail.DetailImage.id': img.id },
                            { $set: { 'Detail.$.DetailImage.$[elem].size': size } },
                            { arrayFilters: [{ 'elem.id': img.id }] }
                        );
                        console.log(`  Updated DetailImage ${img.id}: ${size} bytes`);
                    }
                }
            }
        }
    }

    // 2. Backfill Course Learn.Image
    console.log('Backfilling Course Learn.Image...');
    for (const course of courses) {
        for (const student of course.Student || []) {
            for (const learn of student.Learn || []) {
                for (const img of learn.Image || []) {
                    if (!img.size) {
                        const size = await getFileSize(drive, img.id);
                        if (size > 0) {
                            await PostCourse.updateOne(
                                { _id: course._id, 'Student.Learn.Image.id': img.id },
                                { $set: { 'Student.$[].Learn.$[learnElem].Image.$[imgElem].size': size } },
                                { arrayFilters: [{ 'learnElem.Lesson': learn.Lesson }, { 'imgElem.id': img.id }] }
                            );
                            console.log(`  Updated Learn.Image ${img.id}: ${size} bytes`);
                        }
                    }
                }
            }
        }
    }

    // 3. Backfill TrialCourse images
    console.log('Backfilling TrialCourse...');
    const trials = await TrialCourse.find({ 'sessions.images': { $exists: true } }).lean();
    for (const trial of trials) {
        for (const session of trial.sessions || []) {
            for (const img of session.images || []) {
                if (!img.size) {
                    const size = await getFileSize(drive, img.id);
                    if (size > 0) {
                        await TrialCourse.updateOne(
                            { _id: trial._id, 'sessions.images.id': img.id },
                            { $set: { 'sessions.$[].images.$[imgElem].size': size } },
                            { arrayFilters: [{ 'imgElem.id': img.id }] }
                        );
                        console.log(`  Updated Trial.Image ${img.id}: ${size} bytes`);
                    }
                }
            }
            for (const student of session.students || []) {
                for (const img of student.images || []) {
                    if (!img.size) {
                        const size = await getFileSize(drive, img.id);
                        if (size > 0) {
                            await TrialCourse.updateOne(
                                { _id: trial._id, 'sessions.students.images.id': img.id },
                                { $set: { 'sessions.$[].students.$[].images.$[imgElem].size': size } },
                                { arrayFilters: [{ 'imgElem.id': img.id }] }
                            );
                            console.log(`  Updated Trial.Student.Image ${img.id}: ${size} bytes`);
                        }
                    }
                }
            }
        }
    }

    // 4. Backfill Student avatars
    console.log('Backfilling Student avatars...');
    const students = await PostStudent.find({ Avt: { $exists: true, $ne: '' }, AvtSize: { $exists: false } }).lean();
    for (const student of students) {
        const size = await getFileSize(drive, student.Avt);
        if (size > 0) {
            await PostStudent.updateOne({ _id: student._id }, { $set: { AvtSize: size } });
            console.log(`  Updated Avt ${student.Avt}: ${size} bytes`);
        }
    }

    // 5. Backfill Book images
    console.log('Backfilling Book images...');
    const books = await PostBook.find({
        $or: [
            { Image: { $exists: true, $ne: '' }, ImageSize: { $exists: false } },
            { Badge: { $exists: true, $ne: '' }, BadgeSize: { $exists: false } }
        ]
    }).lean();
    for (const book of books) {
        if (book.Image && !book.ImageSize) {
            const size = await getFileSize(drive, book.Image);
            if (size > 0) {
                await PostBook.updateOne({ _id: book._id }, { $set: { ImageSize: size } });
                console.log(`  Updated Book.Image ${book.Image}: ${size} bytes`);
            }
        }
        if (book.Badge && !book.BadgeSize) {
            const size = await getFileSize(drive, book.Badge);
            if (size > 0) {
                await PostBook.updateOne({ _id: book._id }, { $set: { BadgeSize: size } });
                console.log(`  Updated Book.Badge ${book.Badge}: ${size} bytes`);
            }
        }
    }

    console.log('Backfill complete!');
}

backfill().catch(console.error);
