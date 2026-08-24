import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import TrialCourse from '@/models/coursetry';
import { getDriveClient } from '@/function/drive/folder';
import { revalidateTag } from 'next/cache';
import { reloadCourse, reloadCoursetry } from '@/data/actions/reload';

const TZ = 'Asia/Ho_Chi_Minh';

function toVnParts(d) {
    const p = new Intl.DateTimeFormat('en-GB', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(d);
    const get = t => Number(p.find(x => x.type === t)?.value);
    return { y: get('year'), mo: get('month'), d: get('day'), h: get('hour'), mi: get('minute'), s: get('second') };
}

function vnDateStr(d) {
    const p = toVnParts(d);
    return `${p.y}-${String(p.mo).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

function vnTimeStr(d) {
    const p = toVnParts(d);
    return `${String(p.h).padStart(2, '0')}${String(p.mi).padStart(2, '0')}`;
}

function checkinStatus(day, startTime, now) {
    if (!day || !startTime) return 'dung-gio';
    const [h, m] = startTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return 'dung-gio';
    const dp = toVnParts(new Date(day));
    const np = toVnParts(now);
    const startMs = Date.UTC(dp.y, dp.mo - 1, dp.d, h, m, 0);
    const nowMs = Date.UTC(np.y, np.mo - 1, np.d, np.h, np.mi, np.s);
    return nowMs > startMs ? 'tre' : 'dung-gio';
}

async function findFolderByName(drive, name, parentId) {
    const res = await drive.files.list({
        q: `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageSize: 10,
    });
    return res.data.files?.[0]?.id || null;
}

async function createFolder(drive, name, parentId) {
    const res = await drive.files.create({
        requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
        supportsAllDrives: true,
        fields: 'id',
    });
    return res.data.id;
}

async function ensureCheckinFolder(drive, code, classFolderId) {
    const name = `checkin_${code}`;
    const existing = await findFolderByName(drive, name, classFolderId);
    return existing || createFolder(drive, name, classFolderId);
}

async function getClassFolder(drive, lessonFolderId, code) {
    try {
        const res = await drive.files.get({
            fileId: lessonFolderId,
            fields: 'parents',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });
        if (res.data.parents?.[0]) return res.data.parents[0];
    } catch {
        // fall through to search by name
    }
    const rootId = process.env.DRIVE_COURSE_FOLDER_ID;
    if (!rootId) return null;
    return findFolderByName(drive, code, rootId);
}

export async function POST(request) {
    try {
        await connectDB();
    } catch (dbError) {
        return NextResponse.json({ status: 1, mes: 'Kết nối database thất bại: ' + (dbError.message || '') }, { status: 500 });
    }

    let sessionId, image;
    try {
        const formData = await request.formData();
        sessionId = formData.get('sessionId');
        image = formData.get('image');
    } catch {
        return NextResponse.json({ status: 1, mes: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
    }
    if (!sessionId || !image) {
        return NextResponse.json({ status: 1, mes: 'Thiếu sessionId hoặc file ảnh.' }, { status: 400 });
    }

    const now = new Date();
    const drive = getDriveClient();

    const course = await PostCourse.findOne({ 'Detail._id': sessionId }).lean();
    let ctx;
    if (course) {
        const idx = course.Detail.findIndex(d => d._id.toString() === sessionId);
        const lesson = course.Detail[idx];
        if (!lesson) return NextResponse.json({ status: 1, mes: 'Không tìm thấy buổi học.' }, { status: 404 });
        ctx = {
            kind: 'official',
            courseId: course._id,
            code: course.ID,
            buoi: idx + 1,
            day: lesson.Day,
            startTime: (lesson.Time || '').split('-')[0]?.trim() || '',
            lessonFolderId: lesson.Image || '',
            existing: lesson.Checkin?.id || null,
        };
    } else {
        const trial = await TrialCourse.findOne({ 'sessions._id': sessionId }).lean();
        if (!trial) return NextResponse.json({ status: 1, mes: 'Không tìm thấy buổi học.' }, { status: 404 });
        const idx = trial.sessions.findIndex(s => s._id.toString() === sessionId);
        const ses = trial.sessions[idx];
        ctx = {
            kind: 'trial',
            trialId: trial._id,
            code: trial.name,
            buoi: idx + 1,
            day: ses.day,
            startTime: (ses.time || '').split('-')[0]?.trim() || '',
            rootFolderId: trial.rootFolderId || '',
            existing: ses.checkin?.id || null,
        };
    }

    if (ctx.existing) {
        return NextResponse.json({ status: 1, code: 'ALREADY_CHECKED_IN', mes: 'Buổi học này đã được checkin.' }, { status: 409 });
    }

    const status = checkinStatus(ctx.day, ctx.startTime, now);

    let classFolderId;
    if (ctx.kind === 'official') {
        if (!ctx.lessonFolderId) {
            return NextResponse.json({ status: 1, mes: 'Buổi học chưa có thư mục trên Drive.' }, { status: 500 });
        }
        classFolderId = await getClassFolder(drive, ctx.lessonFolderId, ctx.code);
        if (!classFolderId) {
            return NextResponse.json({ status: 1, mes: `Không tìm thấy thư mục lớp ${ctx.code} trên Drive.` }, { status: 500 });
        }
    } else {
        classFolderId = ctx.rootFolderId;
        if (!classFolderId) {
            return NextResponse.json({ status: 1, mes: 'Khóa học thử chưa có thư mục gốc trên Drive.' }, { status: 500 });
        }
    }

    const checkinFolderId = await ensureCheckinFolder(drive, ctx.code, classFolderId);

    const rawExt = (image.name || '').split('.').pop() || '';
    const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const filename = `${ctx.code}_Buoi${ctx.buoi}_${vnDateStr(now)}_${vnTimeStr(now)}.${ext}`;

    const buffer = Buffer.from(await image.arrayBuffer());
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);

    const up = await drive.files.create({
        requestBody: { name: filename, parents: [checkinFolderId] },
        media: { mimeType: image.type || 'image/jpeg', body: readableStream },
        fields: 'id',
        supportsAllDrives: true,
    });
    const fileId = up.data.id;
    if (!fileId) throw new Error('Không lấy được ID file sau khi tải lên.');

    const checkinData = { id: fileId, folderId: checkinFolderId, time: now, status };
    
    // Always update Session collection directly (LMS architecture)
    try {
        const Session = (await import('@/models/session')).default;
        await Session.updateOne(
            { _id: sessionId },
            { $set: { checkin: checkinData } }
        );
    } catch (e) {
        console.error('[Checkin Photo] Session sync error:', e.message);
    }

    if (ctx.kind === 'official') {
        await PostCourse.updateOne(
            { _id: ctx.courseId, 'Detail._id': sessionId },
            { $set: { 'Detail.$.Checkin': checkinData } }
        ).catch(() => {});
        reloadCourse(ctx.courseId);
    } else {
        await TrialCourse.updateOne(
            { _id: ctx.trialId, 'sessions._id': sessionId },
            { $set: { 'sessions.$.checkin': checkinData } }
        ).catch(() => {});
        reloadCoursetry();
    }

    revalidateTag(`data_lesson${sessionId}`, 'max');

    return NextResponse.json(
        {
            status: 2,
            mes: `Checkin thành công (${status === 'tre' ? 'Trễ' : 'Đúng giờ'}).`,
            data: { id: fileId, folderId: checkinFolderId, filename, time: now.toISOString(), status },
        },
        { status: 201 }
    );
}
