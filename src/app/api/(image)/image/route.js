import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import TrialCourse from '@/models/coursetry';
import { reloadCourse, reloadCoursetry } from '@/data/actions/reload';
import { revalidateTag } from 'next/cache';
import { authorize } from '@/utils/authorize';

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

function getSimplifiedType(mimeType) {
    if (mimeType.startsWith('image/')) {
        return 'image';
    }
    if (mimeType.startsWith('video/')) {
        return 'video';
    }
    return 'file';
}

export async function POST(request) {
    try {
        const { errorResponse } = await authorize(request, ['Admin', 'Academic', 'Teacher']);
        if (errorResponse) return errorResponse;

        await connectDB();
        const drive = await getDriveClient();
        const formData = await request.formData();
        const folderId = formData.get('folderId'); // This folderId is expected to be Detail.Image
        const file = formData.get('images');

        if (!folderId || !file) {
            return NextResponse.json(
                { status: 1, mes: 'Thiếu tham số bắt buộc (folderId, images).' },
                { status: 400 }
            );
        }

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const readableStream = new Readable();
        readableStream.push(fileBuffer);
        readableStream.push(null);

        const fileMetadata = { name: file.name, parents: [folderId] };
        const media = { mimeType: file.type, body: readableStream };

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

        const simplifiedType = getSimplifiedType(file.type);

        const newMediaObject = {
            id: uploadedId,
            type: simplifiedType,
            size: fileBuffer.length,
            create: new Date()
        };

        const Session = (await import('@/models/session')).default;
        const Attendance = (await import('@/models/attendance')).default;

        try {
            await Session.updateOne(
                { image: folderId },
                { $push: { detailImage: newMediaObject } }
            );
        } catch (e) {
            console.error('Session.updateOne detailImage error in image/route.js:', e.message);
        }

        const updateResult = await PostCourse.updateOne(
            { 'Detail.Image': folderId },
            { $push: { 'Detail.$.DetailImage': newMediaObject } }
        ).catch(err => {
            console.error('PostCourse.updateOne DetailImage error in image/route.js:', err.message);
            return { matchedCount: 0 };
        });

        // --- Prepare data for response: Return the _id of the affected Detail object ---
        const updatedCourse = await PostCourse.findOne(
            { 'Detail.Image': folderId },
            { 'Detail._id': 1 } // Project only the matched Detail's _id
        );

        let affectedDetailIds = [];
        if (updatedCourse && updatedCourse.Detail.length > 0 && updatedCourse.Detail[0]._id) {
            affectedDetailIds.push(updatedCourse.Detail[0]._id.toString()); // Convert ObjectId to string
        }

        return NextResponse.json(
            { status: 2, mes: `Đã tải lên và thêm thành công tệp ${file.name}.`, data: affectedDetailIds },
            { status: 201 }
        );

    } catch (error) {
        console.error('Lỗi API [POST]:', error);
        return NextResponse.json(
            { status: 1, mes: error.message || 'Lỗi server không xác định.' },
            { status: error.code || 500 }
        );
    }
}

export async function PUT(request) {
    try {
        const { errorResponse } = await authorize(request, ['Admin', 'Academic', 'Teacher']);
        if (errorResponse) return errorResponse;

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

        const Session = (await import('@/models/session')).default;
        const Attendance = (await import('@/models/attendance')).default;

        let session = await Session.findOne({ 'detailImage.id': oldImageId }).lean();
        let attendance = null;
        if (!session) {
            attendance = await Attendance.findOne({ 'images.id': oldImageId }).lean();
            if (attendance) {
                session = await Session.findById(attendance.session).lean();
            }
        }

        let folderIdToUpload = session?.image;
        let affectedCourseId = session?.course;
        let affectedDetailObjectId = session?._id;
        let updatedInDetail = !!session && !attendance;

        // Fallback sang PostCourse cũ nếu không tìm thấy trong LMS mới
        if (!folderIdToUpload) {
            const course = await PostCourse.findOne({
                $or: [
                    { 'Detail.DetailImage.id': oldImageId },
                    { 'Student.Learn.Image.id': oldImageId }
                ]
            });

            if (course) {
                affectedCourseId = course._id;
                for (const detail of (course.Detail || [])) {
                    if (detail.DetailImage && detail.DetailImage.some(img => img.id === oldImageId)) {
                        folderIdToUpload = detail.Image;
                        affectedDetailObjectId = detail._id;
                        updatedInDetail = true;
                        break;
                    }
                }

                if (!folderIdToUpload && course.Student) {
                    for (const student of course.Student) {
                        if (student.Learn) {
                            for (const learnDetail of student.Learn) {
                                if (learnDetail.Image && learnDetail.Image.some(img => img.id === oldImageId)) {
                                    folderIdToUpload = course.Detail?.[0]?.Image;
                                    break;
                                }
                            }
                        }
                        if (folderIdToUpload) break;
                    }
                }
            }
        }

        if (!folderIdToUpload) {
            return NextResponse.json(
                { status: 1, mes: `Không tìm thấy ảnh với ID: ${oldImageId} trong bất kỳ khóa học nào.` },
                { status: 404 }
            );
        }

        const fileBuffer = Buffer.from(await newImageFile.arrayBuffer());
        const readableStream = new Readable();
        readableStream.push(fileBuffer);
        readableStream.push(null);

        const fileMetadata = { name: newImageFile.name, parents: [folderIdToUpload] };
        const media = { mimeType: newImageFile.type, body: readableStream };

        const uploadResponse = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id',
            supportsAllDrives: true
        });

        const newUploadedId = uploadResponse.data.id;
        const newSimplifiedType = getSimplifiedType(newImageFile.type);

        if (!newUploadedId) {
            throw new Error("Tải lên Google Drive thất bại, không nhận được ID file mới.");
        }

        const newImageObject = {
            id: newUploadedId,
            type: newSimplifiedType,
            size: fileBuffer.length,
            create: new Date(),
        };

        try {
            await Promise.all([
                Session.updateOne(
                    { 'detailImage.id': oldImageId },
                    {
                        $set: {
                            'detailImage.$[elem].id': newImageObject.id,
                            'detailImage.$[elem].type': newImageObject.type,
                            'detailImage.$[elem].size': newImageObject.size,
                            'detailImage.$[elem].create': newImageObject.create,
                        }
                    },
                    { arrayFilters: [{ 'elem.id': oldImageId }] }
                ),
                Attendance.updateOne(
                    { 'images.id': oldImageId },
                    {
                        $set: {
                            'images.$[elem].id': newImageObject.id,
                            'images.$[elem].type': newImageObject.type,
                            'images.$[elem].size': newImageObject.size,
                            'images.$[elem].create': newImageObject.create,
                        }
                    },
                    { arrayFilters: [{ 'elem.id': oldImageId }] }
                )
            ]);
        } catch (e) {
            console.error('Session/Attendance update error in image PUT:', e.message);
        }

        const updateOperations = [];

        if (updatedInDetail) {
            updateOperations.push(
                PostCourse.updateOne(
                    { '_id': affectedCourseId, 'Detail._id': affectedDetailObjectId, 'Detail.DetailImage.id': oldImageId },
                    {
                        $set: {
                            'Detail.$[detailElem].DetailImage.$[elem].id': newImageObject.id,
                            'Detail.$[detailElem].DetailImage.$[elem].type': newImageObject.type,
                            'Detail.$[detailElem].DetailImage.$[elem].size': newImageObject.size,
                            'Detail.$[detailElem].DetailImage.$[elem].create': newImageObject.create,
                        }
                    },
                    { arrayFilters: [{ 'detailElem._id': affectedDetailObjectId }, { 'elem.id': oldImageId }] }
                ).catch(err => console.error('PostCourse.updateOne detailElem error in image PUT:', err.message))
            );
        } else if (affectedCourseId) {
            updateOperations.push(
                PostCourse.updateOne(
                    { '_id': affectedCourseId, 'Student.Learn.Image.id': oldImageId },
                    {
                        $set: {
                            'Student.$.Learn.$[learnElem].Image.$[imageElem].id': newImageObject.id,
                            'Student.$.Learn.$[learnElem].Image.$[imageElem].type': newImageObject.type,
                            'Student.$.Learn.$[learnElem].Image.$[imageElem].size': newImageObject.size,
                            'Student.$.Learn.$[learnElem].Image.$[imageElem].create': newImageObject.create,
                        }
                    },
                    {
                        arrayFilters: [
                            { 'learnElem.Image.id': oldImageId },
                            { 'imageElem.id': oldImageId }
                        ]
                    }
                ).catch(err => console.error('PostCourse.updateOne learnElem error in image PUT:', err.message))
            );
        }

        await Promise.all(updateOperations);

        try {
            await drive.files.delete({ fileId: oldImageId, supportsAllDrives: true });
        } catch (deleteError) {
            console.warn(`Không thể xóa file cũ ${oldImageId} khỏi Drive:`, deleteError.message);
        }

        // --- Prepare data for response: Return the _id of the affected Detail object if updatedInDetail is true ---
        let affectedDetailIds = [];
        if (updatedInDetail && affectedDetailObjectId) {
            affectedDetailIds.push(affectedDetailObjectId.toString()); // Convert ObjectId to string
        }

        return NextResponse.json(
            { status: 2, mes: 'Thay thế ảnh thành công.', data: affectedDetailIds },
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
    try {
        const { errorResponse } = await authorize(request, ['Admin', 'Academic', 'Teacher']);
        if (errorResponse) return errorResponse;

        await connectDB();
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
            ).catch(err => console.error('Session pull detailImage error in image DELETE:', err.message)),

            // 2. Xóa trong Attendance (LMS Chuẩn mới)
            Attendance.updateMany(
                { 'images.id': id },
                { $pull: { images: { id: id } } }
            ).catch(err => console.error('Attendance pull images error in image DELETE:', err.message)),

            // 3. Xóa trong PostCourse.Detail.DetailImage (Khóa học chính thức)
            PostCourse.updateMany(
                { 'Detail.DetailImage.id': id },
                { $pull: { 'Detail.$[].DetailImage': { id: id } } }
            ).catch(err => console.error('PostCourse pull DetailImage error in image DELETE:', err.message)),

            // 4. Xóa trong PostCourse.Student.Learn.Image (Khóa học chính thức)
            PostCourse.updateMany(
                { 'Student.Learn.Image.id': id },
                { $pull: { 'Student.$[stu].Learn.$[les].Image': { id: id } } },
                { arrayFilters: [{ 'stu.Learn.Image.id': id }, { 'les.Image.id': id }] }
            ).catch(err => console.error('PostCourse pull Student.Learn.Image error in image DELETE:', err.message)),

            // 5. Xóa trong TrialCourse (Khóa học thử)
            TrialCourse.updateMany(
                { 'sessions.images.id': id },
                { $pull: { 'sessions.$[].images': { id: id } } }
            ).catch(err => console.error('TrialCourse pull images error in image DELETE:', err.message)),

            // 6. Xóa trong TrialCourse học sinh
            TrialCourse.updateMany(
                { 'sessions.students.images.id': id },
                { $pull: { 'sessions.$[ses].students.$[stu].images': { id: id } } },
                { arrayFilters: [{ 'ses.students.images.id': id }, { 'stu.images.id': id }] }
            ).catch(err => console.error('TrialCourse pull student images error in image DELETE:', err.message))
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
        console.error('Lỗi API [DELETE /api/image]:', error);
        return NextResponse.json(
            { status: 1, mes: error.message || 'Lỗi server không xác định.' },
            { status: 500 }
        );
    }
}