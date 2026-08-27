import { google } from 'googleapis';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import TrialCourse from '@/models/coursetry';
import { lessonFolderName } from '@/function/drive/folder';

const TARGET_DRIVE_ID = '0AK_Z4-cveE6dUk9PVA';
const CONCURRENCY = 5;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry(fn, attempts = 4) {
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (error) {
            const msg = error?.message || '';
            const retriable = (error?.code === 403 && /rate|quota/i.test(msg))
                || /oauth2\.googleapis\.com\/token/i.test(msg)
                || /ETIMEDOUT|ECONNRESET|socket hang up/i.test(msg);
            if (!retriable || i === attempts - 1) throw error;
            await sleep(2000 * Math.pow(2, i));
        }
    }
}

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

async function restoreFolder(drive, folderId) {
    await withRetry(() => drive.files.update({
        fileId: folderId,
        requestBody: { trashed: false },
        supportsAllDrives: true,
    }));
}

async function createFolder(drive, name, parentId) {
    const res = await withRetry(() => drive.files.create({
        requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
        supportsAllDrives: true,
        fields: 'id',
    }));
    return res.data.id;
}

async function moveFolder(drive, folderId, newParentId, oldParentId) {
    await withRetry(() => drive.files.update({
        fileId: folderId,
        addParents: [newParentId],
        removeParents: [oldParentId],
        supportsAllDrives: true,
    }));
}

async function renameFolder(drive, folderId, name) {
    await withRetry(() => drive.files.update({
        fileId: folderId,
        requestBody: { name },
        supportsAllDrives: true,
    }));
}

async function getFolder(drive, folderId) {
    const res = await withRetry(() => drive.files.get({
        fileId: folderId,
        fields: 'id,name,trashed,driveId,parents',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
    }));
    return res.data;
}

async function repointDb(ref, newId) {
    if (ref.kind === 'session-image') {
        const Session = (await import('@/models/session')).default;
        await Session.updateOne({ _id: ref._id }, { $set: { image: newId } });
        if (ref.courseId) {
            await PostCourse.updateOne(
                { _id: ref.courseId, 'Detail.Image': ref.folderId },
                { $set: { 'Detail.$.Image': newId } }
            ).catch(err => console.error('PostCourse.updateOne Detail.Image repointDb error:', err.message));
        }
    } else if (ref.kind === 'course-detail') {
        await PostCourse.updateOne(
            { _id: ref._id, 'Detail.Image': ref.folderId },
            { $set: { 'Detail.$.Image': newId } }
        );
    } else if (ref.kind === 'trial-session') {
        await TrialCourse.updateOne(
            { _id: ref._id, 'sessions.folderId': ref.folderId },
            { $set: { 'sessions.$[].folderId': newId } }
        );
    } else if (ref.kind === 'trial-root') {
        await TrialCourse.updateOne(
            { _id: ref._id, rootFolderId: ref.folderId },
            { $set: { rootFolderId: newId } }
        );
    }
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
                const rootId = process.env.DRIVE_COURSE_FOLDER_ID;
                const Session = (await import('@/models/session')).default;

                send({ type: 'progress', current: 0, total: 1, label: 'Đang quét dữ liệu từ MongoDB...' });

                const [courses, trials, sessions] = await Promise.all([
                    PostCourse.find({}).select('ID Detail').lean(),
                    TrialCourse.find({}).select('name rootFolderId sessions').lean(),
                    Session.find({}).select('_id course courseCode image day type').lean(),
                ]);

                const refs = [];
                const seenFolders = new Set();

                for (const s of sessions) {
                    if (s.image && !seenFolders.has(s.image)) {
                        seenFolders.add(s.image);
                        refs.push({ folderId: s.image, kind: 'session-image', _id: s._id, courseId: s.course, name: s.courseCode, date: s.day });
                    }
                }
                for (const c of courses) {
                    for (const d of c.Detail || []) {
                        if (d.Image && !seenFolders.has(d.Image)) {
                            seenFolders.add(d.Image);
                            refs.push({ folderId: d.Image, kind: 'course-detail', _id: c._id, name: c.ID, date: d.Day });
                        }
                    }
                }
                for (const t of trials) {
                    if (t.rootFolderId && !seenFolders.has(t.rootFolderId)) {
                        seenFolders.add(t.rootFolderId);
                        refs.push({ folderId: t.rootFolderId, kind: 'trial-root', _id: t._id, name: t.name });
                    }
                    for (const s of t.sessions || []) {
                        if (s.folderId && !seenFolders.has(s.folderId)) {
                            seenFolders.add(s.folderId);
                            refs.push({ folderId: s.folderId, kind: 'trial-session', _id: t._id, name: t.name, date: s.day, rootId: t.rootFolderId });
                        }
                    }
                }

                const total = refs.length;
                const counts = { total, ok: 0, restored: 0, moved: 0, renamed: 0, recreated: 0, createdClass: 0, failed: 0, dbUpdated: 0 };
                const details = [];

                const lessonIdSet = new Set(
                    refs.filter(r => r.kind === 'course-detail' || r.kind === 'trial-session').map(r => r.folderId)
                );

                const containerCache = new Map();
                const ensureContainer = (name) => {
                    if (!containerCache.has(name)) {
                        containerCache.set(name, (async () => {
                            const list = await withRetry(() => drive.files.list({
                                q: `name='${name}' and '${rootId}' in parents and mimeType='application/vnd.google-apps.folder'`,
                                fields: 'files(id,trashed)',
                                supportsAllDrives: true,
                                includeItemsFromAllDrives: true,
                                pageSize: 50,
                            }));
                            const existing = (list.data.files || []).find(f => !lessonIdSet.has(f.id));
                            if (existing) {
                                if (existing.trashed) await restoreFolder(drive, existing.id);
                                return existing.id;
                            }
                            counts.createdClass++;
                            return createFolder(drive, name, rootId);
                        })());
                    }
                    return containerCache.get(name);
                };

                send({ type: 'progress', current: 0, total, label: `Đang đồng bộ ${total} thư mục...` });

                const fixRef = async (ref) => {
                    const isRoot = ref.kind === 'trial-root';
                    const expectedName = isRoot ? ref.name : lessonFolderName(ref.name, ref.date);

                    let info;
                    try {
                        info = await getFolder(drive, ref.folderId);
                    } catch (error) {
                        if (error?.code === 404) {
                            const containerId = isRoot ? rootId : await ensureContainer(ref.name);
                            const newId = await createFolder(drive, expectedName, containerId);
                            await repointDb(ref, newId);
                            counts.dbUpdated++;
                            return { action: 'recreated', message: `Tạo mới ${expectedName}`, newId };
                        }
                        return { action: 'failed', message: error.message };
                    }

                    const inWrongDrive = info.driveId && info.driveId !== TARGET_DRIVE_ID;
                    if (inWrongDrive) {
                        const containerId = isRoot ? rootId : await ensureContainer(ref.name);
                        const newId = await createFolder(drive, expectedName, containerId);
                        await repointDb(ref, newId);
                        counts.dbUpdated++;
                        return { action: 'recreated', message: `Đang ở drive khác (${info.driveId})`, newId };
                    }

                    const wasTrashed = info.trashed;
                    if (wasTrashed) {
                        await restoreFolder(drive, ref.folderId);
                        counts.restored++;
                    }

                    const containerId = isRoot ? rootId : await ensureContainer(ref.name);
                    const currentParent = info.parents?.[0];
                    const msg = [];
                    const actionsDone = [];

                    if (currentParent !== containerId) {
                        await moveFolder(drive, ref.folderId, containerId, currentParent);
                        actionsDone.push('moved');
                        msg.push(isRoot ? 'Đã di chuyển lên thư mục gốc' : 'Đã di chuyển vào lớp');
                    }
                    if (info.name !== expectedName) {
                        await renameFolder(drive, ref.folderId, expectedName);
                        actionsDone.push('renamed');
                        msg.push(`Đổi tên -> ${expectedName}`);
                    }

                    if (actionsDone.includes('moved')) counts.moved++;
                    if (actionsDone.includes('renamed')) counts.renamed++;
                    if (actionsDone.length === 0) counts.ok++;
                    if (wasTrashed && actionsDone.length === 0) {
                        return { action: 'restored', message: 'Đã khôi phục từ thùng rác' };
                    }
                    return { action: actionsDone[0] || (wasTrashed ? 'restored' : 'ok'), message: msg.join('; ') || 'OK' };
                };

                for (let i = 0; i < refs.length; i += CONCURRENCY) {
                    const batch = refs.slice(i, i + CONCURRENCY);
                    const results = await Promise.allSettled(batch.map(ref => fixRef(ref)));
                    results.forEach((r, j) => {
                        const ref = batch[j];
                        if (r.status === 'fulfilled') {
                            details.push({ name: ref.name, folderId: ref.folderId, action: r.value.action, message: r.value.message, newId: r.value.newId });
                        } else {
                            counts.failed++;
                            details.push({ name: ref.name, folderId: ref.folderId, action: 'failed', message: r.reason?.message });
                        }
                    });
                    send({ type: 'progress', current: i + batch.length, total, label: `Đang đồng bộ thư mục (${i + batch.length}/${total})...` });
                }

                send({ type: 'done', data: { summary: counts, details, targetDriveId: TARGET_DRIVE_ID, checkedAt: new Date().toISOString() } });
            } catch (error) {
                console.error('[Verify Drive] Error:', error);
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
