import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import connectDB from '@/config/connectDB';
import Event from '@/models/event';
import checkAuthToken from '@/utils/checktoken';
import { getDriveClient } from '@/function/drive/index';
import { deleteImageFromDrive } from '@/function/drive/image';
import mongoose from 'mongoose';

export async function POST(request, { params }) {
    try {
        const user = await checkAuthToken();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'ID không hợp lệ' }, { status: 400 });
        }

        await connectDB();
        const event = await Event.findById(id);
        if (!event) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy sự kiện' }, { status: 404 });
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const caption = formData.get('caption') || '';
        const isCover = formData.get('isCover') === 'true';

        if (!file || file.size === 0) {
            return NextResponse.json({ success: false, message: 'Vui lòng chọn file' }, { status: 400 });
        }

        const drive = await getDriveClient();
        const targetFolderId = event.driveFolderId || process.env.DRIVE_COURSE_IMAGE_FOLDER_ID || process.env.DRIVE_COURSE_FOLDER_ID;

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const readableStream = new Readable();
        readableStream.push(fileBuffer);
        readableStream.push(null);

        const fileName = `event-${event._id}-${Date.now()}-${file.name}`;
        const fileMetadata = {
            name: fileName,
            parents: targetFolderId ? [targetFolderId] : [],
        };

        const media = {
            mimeType: file.type,
            body: readableStream,
        };

        const driveRes = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name, webViewLink, webContentLink',
            supportsAllDrives: true,
        });

        const fileId = driveRes.data.id;
        if (!fileId) {
            return NextResponse.json({ success: false, message: 'Lỗi tải file lên Google Drive' }, { status: 500 });
        }

        if (isCover) {
            event.coverImage = fileId;
        } else {
            if (!event.media) event.media = { photos: [] };
            event.media.photos.push({
                fileId,
                caption: caption || file.name,
                uploadedAt: new Date(),
                uploadedBy: user.id || user._id,
            });
        }

        await event.save();

        return NextResponse.json({
            success: true,
            fileId,
            coverImage: event.coverImage,
            photos: event.media?.photos || [],
        }, { status: 200 });

    } catch (error) {
        console.error('Error uploading event media:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const user = await checkAuthToken();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const fileId = searchParams.get('fileId');
        const isCover = searchParams.get('isCover') === 'true';

        if (!fileId) {
            return NextResponse.json({ success: false, message: 'Thiếu fileId' }, { status: 400 });
        }

        await connectDB();
        const event = await Event.findById(id);
        if (!event) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy sự kiện' }, { status: 404 });
        }

        // Delete from drive
        await deleteImageFromDrive(fileId);

        if (isCover) {
            if (event.coverImage === fileId) {
                event.coverImage = null;
            }
        } else if (event.media?.photos) {
            event.media.photos = event.media.photos.filter(p => p.fileId !== fileId);
        }

        await event.save();

        return NextResponse.json({ success: true, message: 'Đã xóa file thành công' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting event media:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
