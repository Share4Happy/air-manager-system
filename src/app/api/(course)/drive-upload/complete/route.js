import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import TrialCourse from '@/models/coursetry';
import { getDriveClient } from '@/function/drive/index';

export async function POST(request) {
    try {
        await connectDB();
    } catch (dbError) {
        return NextResponse.json({ status: 1, mes: 'Kết nối database thất bại: ' + (dbError.message || '') }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { folderId, fileId, fileType, size, name, oldImageId } = body;

        if (!fileId) {
            return NextResponse.json(
                { status: 1, mes: 'Thiếu fileId sau khi tải lên.' },
                { status: 400 }
            );
        }

        const drive = await getDriveClient();

        // 1. Trường hợp THAY THẾ (Replace old image/video)
        if (oldImageId) {
            let updateResult = await PostCourse.updateOne(
                { 'Detail.DetailImage.id': oldImageId },
                { $set: { 'Detail.$.DetailImage.$[elem].id': fileId, 'Detail.$.DetailImage.$[elem].size': Number(size) || 0 } },
                { arrayFilters: [{ 'elem.id': oldImageId }] }
            );

            if (updateResult.modifiedCount === 0) {
                updateResult = await TrialCourse.updateOne(
                    { 'sessions.images.id': oldImageId },
                    { $set: { 'sessions.$.images.id': fileId, 'sessions.$.images.size': Number(size) || 0 } }
                );

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

            return NextResponse.json(
                { status: 2, mes: 'Thay thế file thành công.', data: fileId },
                { status: 200 }
            );
        }

        // 2. Trường hợp TẢI LÊN MỚI (New file)
        if (!folderId) {
            return NextResponse.json(
                { status: 1, mes: 'Thiếu folderId cho file tải lên mới.' },
                { status: 400 }
            );
        }

        const newMediaObject = {
            id: fileId,
            type: fileType || 'image',
            size: Number(size) || 0,
            create: new Date(),
        };

        let updateResult = await PostCourse.updateOne(
            { 'Detail.Image': folderId },
            { $push: { 'Detail.$.DetailImage': newMediaObject } }
        );

        if (updateResult.matchedCount === 0) {
            updateResult = await TrialCourse.updateOne(
                { 'sessions.folderId': folderId },
                { $set: { 'sessions.$.images': newMediaObject } }
            );

            if (updateResult.matchedCount === 0) {
                // Rollback xóa file vừa tạo trên Drive
                await drive.files.delete({ fileId, supportsAllDrives: true });
                return NextResponse.json(
                    { status: 1, mes: `Không tìm thấy buổi học nào có folderId là '${folderId}'.` },
                    { status: 404 }
                );
            }
        }

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
