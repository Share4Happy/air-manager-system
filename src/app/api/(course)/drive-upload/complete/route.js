import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import TrialCourse from '@/models/coursetry';
import { getDriveClient } from '@/function/drive/index';
import mongoose from 'mongoose';
import { revalidateTag } from 'next/cache';
import { authorize } from '@/utils/authorize';

export async function POST(request) {
    const auth = await authorize(request);
    if (!auth.authorized) return auth.response;

    try {
        await connectDB();
    } catch (dbError) {
        return NextResponse.json({ status: 1, mes: 'Kết nối database thất bại: ' + (dbError.message || '') }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { folderId, fileId, fileType, size, name, oldImageId, sessionId } = body;

        if (!fileId) {
            return NextResponse.json(
                { status: 1, mes: 'Thiếu fileId sau khi tải lên.' },
                { status: 400 }
            );
        }

        const drive = await getDriveClient();

        // 1. Trường hợp THAY THẾ (Replace old image/video)
        if (oldImageId) {
            const Session = (await import('@/models/session')).default;
            const sessionUpdate = await Session.updateOne(
                { 'detailImage.id': oldImageId },
                { $set: { 'detailImage.$[elem].id': fileId, 'detailImage.$[elem].size': Number(size) || 0 } },
                { arrayFilters: [{ 'elem.id': oldImageId }] }
            ).catch(() => ({ modifiedCount: 0 }));

            let updateResult = await PostCourse.updateOne(
                { 'Detail.DetailImage.id': oldImageId },
                { $set: { 'Detail.$.DetailImage.$[elem].id': fileId, 'Detail.$.DetailImage.$[elem].size': Number(size) || 0 } },
                { arrayFilters: [{ 'elem.id': oldImageId }] }
            ).catch(() => ({ modifiedCount: 0 }));

            if (sessionUpdate?.modifiedCount === 0 && updateResult.modifiedCount === 0) {
                updateResult = await TrialCourse.updateOne(
                    { 'sessions.images.id': oldImageId },
                    { $set: { 'sessions.$.images.id': fileId, 'sessions.$.images.size': Number(size) || 0 } }
                ).catch(() => ({ modifiedCount: 0 }));

                if (updateResult.modifiedCount === 0) {
                    await drive.files.delete({ fileId, supportsAllDrives: true });
                    return NextResponse.json(
                        { status: 1, mes: 'Không thể cập nhật ID file mới vào cơ sở dữ liệu.' },
                        { status: 404 }
                    );
                }
            }

            // Xóa file cũ khỏi Google Drive
            try {
                await drive.files.delete({ fileId: oldImageId, supportsAllDrives: true });
            } catch (deleteError) {
                console.warn(`Không thể xóa file cũ ${oldImageId} khỏi Drive:`, deleteError.message);
            }

            if (sessionId) revalidateTag(`data_lesson${sessionId}`, 'max');
            revalidateTag('courses', 'max');

            return NextResponse.json(
                { status: 2, mes: 'Thay thế file thành công.', data: fileId },
                { status: 200 }
            );
        }

        // 2. Trường hợp TẢI LÊN MỚI (New file)
        if (!folderId && !sessionId) {
            return NextResponse.json(
                { status: 1, mes: 'Thiếu folderId hoặc sessionId cho file tải lên mới.' },
                { status: 400 }
            );
        }

        const newMediaObject = {
            id: fileId,
            type: fileType || 'image',
            size: Number(size) || 0,
            create: new Date(),
        };

        const Session = (await import('@/models/session')).default;
        let sessionMatched = false;
        let courseMatched = false;
        let trialMatched = false;

        // 1. Cập nhật vào Session collection (LMS chuẩn mới)
        if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
            const sRes = await Session.updateOne(
                { _id: new mongoose.Types.ObjectId(sessionId) },
                {
                    $push: { detailImage: newMediaObject },
                    ...(folderId ? { $set: { image: folderId } } : {})
                }
            ).catch(() => ({ matchedCount: 0 }));
            if (sRes?.matchedCount > 0) sessionMatched = true;
        }
        if (!sessionMatched && folderId) {
            const sRes = await Session.updateOne(
                { image: folderId },
                { $push: { detailImage: newMediaObject } }
            ).catch(() => ({ matchedCount: 0 }));
            if (sRes?.matchedCount > 0) sessionMatched = true;
        }

        // 2. Cập nhật vào PostCourse (Dữ liệu lớp học)
        if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
            const cRes = await PostCourse.updateOne(
                { 'Detail._id': new mongoose.Types.ObjectId(sessionId) },
                { $push: { 'Detail.$.DetailImage': newMediaObject } }
            ).catch(() => ({ matchedCount: 0 }));
            if (cRes?.matchedCount > 0) courseMatched = true;
        }
        if (!courseMatched && folderId) {
            const cRes = await PostCourse.updateOne(
                { 'Detail.Image': folderId },
                { $push: { 'Detail.$.DetailImage': newMediaObject } }
            ).catch(() => ({ matchedCount: 0 }));
            if (cRes?.matchedCount > 0) courseMatched = true;
        }

        // 3. Cập nhật vào TrialCourse (Khóa học thử nếu có)
        if (!sessionMatched && !courseMatched) {
            if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
                const tRes = await TrialCourse.updateOne(
                    { 'sessions._id': new mongoose.Types.ObjectId(sessionId) },
                    { $set: { 'sessions.$.images': newMediaObject } }
                ).catch(() => ({ matchedCount: 0 }));
                if (tRes?.matchedCount > 0) trialMatched = true;
            }
            if (!trialMatched && folderId) {
                const tRes = await TrialCourse.updateOne(
                    { 'sessions.folderId': folderId },
                    { $set: { 'sessions.$.images': newMediaObject } }
                ).catch(() => ({ matchedCount: 0 }));
                if (tRes?.matchedCount > 0) trialMatched = true;
            }

            if (!trialMatched) {
                // Rollback xóa file vừa tạo trên Drive
                await drive.files.delete({ fileId, supportsAllDrives: true });
                return NextResponse.json(
                    { status: 1, mes: `Không tìm thấy buổi học nào tương ứng.` },
                    { status: 404 }
                );
            }
        }

        if (sessionId) revalidateTag(`data_lesson${sessionId}`, 'max');
        revalidateTag('courses', 'max');

        return NextResponse.json(
            {
                status: 2,
                mes: `Đã tải lên và cập nhật thành công tệp ${name || fileId}.`,
                data: [newMediaObject],
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Lỗi API [POST /api/drive-upload/complete]:', error);
        return NextResponse.json(
            { status: 1, mes: error.message || 'Lỗi server không xác định.' },
            { status: 500 }
        );
    }
}
