import { google } from 'googleapis';
import { NextResponse } from 'next/server';

async function getDrive() {
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

async function calcFolderSize(drive, folderId) {
    let totalSize = 0, fileCount = 0;
    const queue = [folderId];
    const visited = new Set();

    while (queue.length) {
        const id = queue.shift();
        if (visited.has(id)) continue;
        visited.add(id);
        let pageToken;
        do {
            const res = await drive.files.list({
                q: `'${id}' in parents and trashed=false`,
                fields: 'nextPageToken,files(id,mimeType,size)',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
                pageSize: 1000,
                pageToken,
            });
            for (const f of res.data.files || []) {
                if (f.mimeType === 'application/vnd.google-apps.folder') {
                    queue.push(f.id);
                } else if (f.size) {
                    totalSize += parseInt(f.size, 10);
                    fileCount++;
                }
            }
            pageToken = res.data.nextPageToken;
        } while (pageToken);
    }
    return { totalSize, fileCount };
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        const drive = await getDrive();
        const result = await calcFolderSize(drive, id);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Size error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
