import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import TrialCourse from '@/models/coursetry';

async function getAccessToken() {
    const auth = new google.auth.GoogleAuth({
        projectId: process.env.GOOGLE_PROJECT_ID,
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    return typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { folderId, fileName, mimeType, fileSize, oldImageId, sessionId } = body;

        let targetFolderId = folderId;

        // 1. Nếu thiếu folderId nhưng có oldImageId (trường hợp thay thế file cũ), tìm folderId từ DB
        if (!targetFolderId && oldImageId) {
            try {
                await connectDB();
                const Session = (await import('@/models/session')).default;
                const ses = await Session.findOne({ 'detailImage.id': oldImageId }).lean();
                if (ses) {
                    targetFolderId = ses.image;
                } else {
                    const course = await PostCourse.findOne({ 'Detail.DetailImage.id': oldImageId });
                    if (course) {
                        const detail = course.Detail?.find(d => d.DetailImage?.some(img => img.id === oldImageId));
                        targetFolderId = detail?.Image;
                    } else {
                        const trial = await TrialCourse.findOne({ 'sessions.images.id': oldImageId });
                        if (trial) {
                            const trialSes = trial.sessions.find(s => s.images?.id === oldImageId);
                            targetFolderId = trialSes?.folderId;
                        }
                    }
                }
            } catch (findErr) {
                console.warn('[drive-upload/session] Lỗi khi tra cứu folderId từ oldImageId:', findErr.message);
            }
        }

        // 2. Nếu thiếu folderId nhưng có sessionId, tìm folderId từ Session / Course
        if (!targetFolderId && sessionId) {
            try {
                await connectDB();
                const Session = (await import('@/models/session')).default;
                const ses = await Session.findById(sessionId).lean();
                if (ses?.image) {
                    targetFolderId = ses.image;
                } else {
                    const course = await PostCourse.findOne({ 'Detail._id': sessionId }).lean();
                    const detail = course?.Detail?.find(d => String(d._id) === String(sessionId));
                    if (detail?.Image) {
                        targetFolderId = detail.Image;
                    }
                }

                // Nếu vẫn chưa có folderId, tự động tạo trên Google Drive
                if (!targetFolderId) {
                    const code = ses?.courseCode || 'GENERAL';
                    const day = ses?.day || new Date();
                    const { getDriveClient, createDriveFolder, lessonFolderName } = await import('@/function/drive/folder');
                    const drive = getDriveClient();
                    const PARENT_FOLDER_ID = process.env.DRIVE_COURSE_FOLDER_ID;
                    if (PARENT_FOLDER_ID) {
                        let classFolderId = null;
                        const list = await drive.files.list({
                            q: `name='${code}' and '${PARENT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                            fields: 'files(id)',
                            supportsAllDrives: true,
                            includeItemsFromAllDrives: true,
                        });
                        if (list.data.files?.length) {
                            classFolderId = list.data.files[0].id;
                        } else {
                            classFolderId = await createDriveFolder(drive, code, PARENT_FOLDER_ID);
                        }
                        if (classFolderId) {
                            const folderName = lessonFolderName(code, day);
                            targetFolderId = await createDriveFolder(drive, folderName, classFolderId);
                            if (targetFolderId) {
                                await Session.updateOne({ _id: sessionId }, { $set: { image: targetFolderId } });
                                await PostCourse.updateOne({ 'Detail._id': sessionId }, { $set: { 'Detail.$.Image': targetFolderId } });
                            }
                        }
                    }
                }
            } catch (findErr) {
                console.warn('[drive-upload/session] Lỗi khi tra cứu/tạo folderId từ sessionId:', findErr.message);
            }
        }

        if (!targetFolderId || !fileName) {
            return NextResponse.json(
                { status: 1, mes: 'Thiếu tham số bắt buộc (folderId hoặc sessionId, fileName).' },
                { status: 400 }
            );
        }

        const accessToken = await getAccessToken();
        if (!accessToken) {
            return NextResponse.json(
                { status: 1, mes: 'Không thể lấy access token từ Google Service Account.' },
                { status: 500 }
            );
        }

        const metadata = {
            name: fileName,
            parents: [targetFolderId],
        };

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json; charset=UTF-8',
                'X-Upload-Content-Type': mimeType || 'application/octet-stream',
                ...(fileSize ? { 'X-Upload-Content-Length': String(fileSize) } : {}),
            },
            body: JSON.stringify(metadata),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error('Lỗi khi khởi tạo Google Drive Resumable Session:', res.status, errText);
            return NextResponse.json(
                { status: 1, mes: `Google Drive API lỗi (${res.status}): ${errText}` },
                { status: res.status }
            );
        }

        const uploadUrl = res.headers.get('location');
        if (!uploadUrl) {
            return NextResponse.json(
                { status: 1, mes: 'Không nhận được session upload URL từ Google Drive.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ status: 2, uploadUrl, folderId: targetFolderId });

    } catch (error) {
        console.error('Lỗi API [POST /api/drive-upload/session]:', error);
        return NextResponse.json(
            { status: 1, mes: error.message || 'Lỗi server không xác định.' },
            { status: 500 }
        );
    }
}
