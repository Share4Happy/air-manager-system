import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import TrialCourse from '@/models/coursetry';
import { compressVideoToHD } from '@/function/compress';
import { reloadCourse, reloadCoursetry } from '@/data/actions/reload';
import { revalidateTag } from 'next/cache';



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

export async function POST(request) {
    try {
        await connectDB();
    } catch (dbError) {
        return NextResponse.json({ status: 1, mes: 'Kết nối database thất bại: ' + (dbError.message || '') }, { status: 500 });
    }
    try {
        const drive = await getDriveClient();
        const formData = await request.formData();
        const folderId = formData.get('folderId');
        const file = formData.get('images');
        const fileType = formData.get('fileType');

        if (!folderId || !file || !fileType) {
            return NextResponse.json(
                { status: 1, mes: 'Thiếu tham số bắt buộc (folderId, images, fileType).' },
                { status: 400 }
            );
        }

        // --- 1. Nén video xuống HD (nếu là video) rồi tải lên Google Drive ---
        let fileBuffer = Buffer.from(await file.arrayBuffer());
        let uploadName = file.name;
        let uploadMime = file.type;
        if (fileType === 'video') {
            const compressed = await compressVideoToHD(fileBuffer, { mimeType: file.type, originalName: file.name });
            if (compressed) {
                fileBuffer = compressed.buffer;
                uploadMime = compressed.mimeType;
                uploadName = compressed.name;
            }
        }
        const readableStream = new Readable();
        readableStream.push(fileBuffer);
        readableStream.push(null);

        const fileMetadata = { name: uploadName, parents: [folderId] };
        const media = { mimeType: uploadMime, body: readableStream };

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id',
            supportsAllDrives: true
        });

        const uploadedId = response.data.id;

        if (!uploadedId) {
            throw new Error("Không thể lấy ID file từ Google Drive sau khi tải lên.");
        }

        // --- 2. Tạo đối tượng để lưu vào MongoDB ---
        const newMediaObject = { id: uploadedId, type: fileType, size: fileBuffer.length, create: new Date() };

        // --- 3. Cập nhật vào MongoDB ---
        try {
            const Session = (await import('@/models/session')).default;
            await Session.updateOne(
                { image: folderId },
                { $push: { detailImage: newMediaObject } }
            );
        } catch (e) {
            console.error('Session.updateOne detailImage error:', e.message);
        }

        let updateResult = await PostCourse.updateOne(
            { 'Detail.Image': folderId },
            { $push: { 'Detail.$.DetailImage': newMediaObject } }
        ).catch(err => {
            console.error('PostCourse.updateOne DetailImage error:', err.message);
            return { matchedCount: 0 };
        });

        if (updateResult.matchedCount === 0) {
            await TrialCourse.updateOne(
                { 'sessions.folderId': folderId },
                { $push: { 'sessions.$.images': newMediaObject } }
            ).catch(err => {
                console.error('TrialCourse.updateOne images error:', err.message);
            });
        }

        // --- 4. Trả về thành công ---
        return NextResponse.json(
            {
                status: 2,
                mes: `Đã tải lên và cập nhật thành công tệp ${file.name}.`,
                data: [newMediaObject],
            },
            { status: 201 }
        );

    } catch (error) {
        const errorMessage = error.errors?.[0]?.message || error.message || 'Lỗi server không xác định.';
        console.error('Lỗi API [POST]:', JSON.stringify(error, null, 2));
        const httpStatus = typeof error.code === 'number' && error.code >= 200 && error.code <= 599 ? error.code : 500;
        return NextResponse.json(
            { status: 1, mes: errorMessage },
            { status: httpStatus }
        );
    }
}



/**
 * @method PUT
 * @description Thay thế một file ảnh đã tồn tại bằng một file ảnh mới.
 * @body {FormData} - id (ID ảnh cũ cần thay thế), newImage (file ảnh mới)
 */
export async function PUT(request) {
    try {
        await connectDB();
        const drive = await getDriveClient();
        const formData = await request.formData();

        const oldImageId = formData.get('id');
        const newImageFile = formData.get('newImage');

        if (!oldImageId || !newImageFile) {
            return NextResponse.json(
                { status: 1, mes: 'Thiếu tham số bắt buộc: id (ảnh cũ) và newImage (file ảnh mới).' },
                { status: 400 }
            );
        }

        // --- 1. Tìm khóa học và buổi học chứa ảnh cũ ---
        let course = await PostCourse.findOne({ 'Detail.DetailImage.id': oldImageId });
        let isTrial = false;
        let folderId;

        if (course) {
            const lessonDetail = course.Detail.find(detail =>
                detail.DetailImage.some(img => img.id === oldImageId)
            );
            folderId = lessonDetail?.Image;
        } else {
            const trialCourse = await TrialCourse.findOne({ 'sessions.images.id': oldImageId });
            if (trialCourse) {
                const ses = trialCourse.sessions.find(s =>
                    s.images?.some(img => img.id === oldImageId)
                );
                folderId = ses?.folderId;
            } else {
                const Session = (await import('@/models/session')).default;
                const ses = await Session.findOne({ 'detailImage.id': oldImageId }).lean();
                if (ses) {
                    folderId = ses.image;
                } else {
                    return NextResponse.json(
                        { status: 1, mes: `Không tìm thấy buổi học nào chứa ảnh với ID: ${oldImageId}` },
                        { status: 404 }
                    );
                }
            }
        }

        if (!folderId) {
            return NextResponse.json(
                { status: 1, mes: 'Buổi học không có ID thư mục (folderId) được liên kết.' },
                { status: 500 }
            );
        }

        // --- 2. Nén video xuống HD (nếu là video) rồi tải lên Google Drive ---
        let fileBuffer = Buffer.from(await newImageFile.arrayBuffer());
        let uploadName = newImageFile.name;
        let uploadMime = newImageFile.type;
        if (newImageFile.type.startsWith('video/')) {
            const compressed = await compressVideoToHD(fileBuffer, { mimeType: newImageFile.type, originalName: newImageFile.name });
            if (compressed) {
                fileBuffer = compressed.buffer;
                uploadMime = compressed.mimeType;
                uploadName = compressed.name;
            }
        }
        const readableStream = new Readable();
        readableStream.push(fileBuffer);
        readableStream.push(null);

        const fileMetadata = { name: uploadName, parents: [folderId] };
        const media = { mimeType: uploadMime, body: readableStream };

        const uploadResponse = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id',
            supportsAllDrives: true
        });

        const newImageId = uploadResponse.data.id;
        if (!newImageId) {
            throw new Error("Tải lên Google Drive thất bại, không nhận được ID file mới.");
        }

        // --- 3. Cập nhật ID mới + size vào MongoDB ---
        const Session = (await import('@/models/session')).default;
        await Session.updateOne(
            { 'detailImage.id': oldImageId },
            { $set: { 'detailImage.$[elem].id': newImageId, 'detailImage.$[elem].size': fileBuffer.length } },
            { arrayFilters: [{ 'elem.id': oldImageId }] }
        ).catch(err => console.error('Session.updateOne detailImage PUT error:', err.message));

        await PostCourse.updateOne(
            { 'Detail.DetailImage.id': oldImageId },
            { $set: { 'Detail.$.DetailImage.$[elem].id': newImageId, 'Detail.$.DetailImage.$[elem].size': fileBuffer.length } },
            { arrayFilters: [{ 'elem.id': oldImageId }] }
        ).catch(err => console.error('PostCourse.updateOne DetailImage PUT error:', err.message));

        await TrialCourse.updateOne(
            { 'sessions.images.id': oldImageId },
            { $set: { 'sessions.$[ses].images.$[img].id': newImageId, 'sessions.$[ses].images.$[img].size': fileBuffer.length } },
            { arrayFilters: [{ 'ses.images.id': oldImageId }, { 'img.id': oldImageId }] }
        ).catch(err => console.error('TrialCourse.updateOne images PUT error:', err.message));

        // --- 4. Xóa file cũ khỏi Google Drive ---
        try {
            await drive.files.delete({ fileId: oldImageId, supportsAllDrives: true });
        } catch (deleteError) {
            console.warn(`Không thể xóa file cũ ${oldImageId} khỏi Drive:`, deleteError.message);
        }

        // --- 5. Trả về thành công ---
        return NextResponse.json(
            { status: 2, mes: 'Thành công', data: newImageId },
            { status: 200 }
        );

    } catch (error) {
        console.error('Lỗi API [PUT]:', error);
        return NextResponse.json(
            { status: 1, mes: error.message || 'Lỗi server không xác định.' },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    await connectDB();
    try {
        const drive = await getDriveClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ status: 1, mes: 'Thiếu ID của file cần xóa.' }, { status: 400 });
        }

        const Session = (await import('@/models/session')).default;
        const Attendance = (await import('@/models/attendance')).default;

        // Thu thập thông tin các session/khóa học bị ảnh hưởng trước khi xóa
        const [affectedSessions, affectedCourses] = await Promise.all([
            Session.find({ 'detailImage.id': id }, { _id: 1, course: 1 }).lean().catch(() => []),
            PostCourse.find(
                { $or: [{ 'Detail.DetailImage.id': id }, { 'Student.Learn.Image.id': id }] },
                { _id: 1, ID: 1, 'Detail._id': 1, 'Detail.DetailImage': 1 }
            ).lean().catch(() => [])
        ]);

        const affectedSessionIds = [];
        (affectedSessions || []).forEach(s => {
            if (s._id) affectedSessionIds.push(String(s._id));
        });
        (affectedCourses || []).forEach(c => {
            (c.Detail || []).forEach(d => {
                if (d.DetailImage?.some(img => img.id === id) && d._id) {
                    affectedSessionIds.push(String(d._id));
                }
            });
        });

        await Promise.all([
            // 1. Xóa trong Session (LMS Chuẩn mới)
            Session.updateMany(
                { 'detailImage.id': id },
                { $pull: { detailImage: { id: id } } }
            ).catch(err => console.error('Session pull detailImage error in updateimage DELETE:', err.message)),

            // 2. Xóa trong Attendance (LMS Chuẩn mới)
            Attendance.updateMany(
                { 'images.id': id },
                { $pull: { images: { id: id } } }
            ).catch(err => console.error('Attendance pull images error in updateimage DELETE:', err.message)),

            // 3. Xóa trong PostCourse.Detail.DetailImage (Khóa học chính thức)
            PostCourse.updateMany(
                { 'Detail.DetailImage.id': id },
                { $pull: { 'Detail.$[].DetailImage': { id: id } } }
            ).catch(err => console.error('PostCourse pull DetailImage error in updateimage DELETE:', err.message)),

            // 4. Xóa trong PostCourse.Student.Learn.Image (Khóa học chính thức)
            PostCourse.updateMany(
                { 'Student.Learn.Image.id': id },
                { $pull: { 'Student.$[stu].Learn.$[les].Image': { id: id } } },
                { arrayFilters: [{ 'stu.Learn.Image.id': id }, { 'les.Image.id': id }] }
            ).catch(err => console.error('PostCourse pull Student.Learn.Image error in updateimage DELETE:', err.message)),

            // 5. Xóa trong TrialCourse (Khóa học thử)
            TrialCourse.updateMany(
                { 'sessions.images.id': id },
                { $pull: { 'sessions.$[].images': { id: id } } }
            ).catch(err => console.error('TrialCourse pull images error in updateimage DELETE:', err.message)),

            // 6. Xóa trong TrialCourse học sinh
            TrialCourse.updateMany(
                { 'sessions.students.images.id': id },
                { $pull: { 'sessions.$[ses].students.$[stu].images': { id: id } } },
                { arrayFilters: [{ 'ses.students.images.id': id }, { 'stu.images.id': id }] }
            ).catch(err => console.error('TrialCourse pull student images error in updateimage DELETE:', err.message))
        ]);

        try {
            await drive.files.delete({ fileId: id, supportsAllDrives: true });
        } catch (driveError) {
            console.warn(`Đã xóa file ${id} khỏi DB, Google Drive cảnh báo:`, driveError.message);
        }

        // Revalidate cache
        const uniqueSessionIds = Array.from(new Set(affectedSessionIds));
        uniqueSessionIds.forEach(sesId => {
            try { revalidateTag(`data_lesson${sesId}`, 'max'); } catch {}
        });
        (affectedCourses || []).forEach(c => {
            if (c._id) reloadCourse(c._id, c.ID);
        });
        revalidateTag('courses', 'max');
        revalidateTag('data_coursetry', 'max');
        await reloadCoursetry();

        return NextResponse.json({ status: 2, mes: 'Xóa file thành công.', data: uniqueSessionIds }, { status: 200 });
    } catch (error) {
        console.error('Lỗi API [DELETE /api/updateimage]:', error);
        return NextResponse.json({ status: 1, mes: error.message || 'Lỗi server.' }, { status: 500 });
    }
}

