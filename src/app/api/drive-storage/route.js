import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const DRIVE_ID = '0AK_Z4-cveE6dUk9PVA';

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

export async function GET() {
    try {
        const drive = await getDrive();
        const [driveInfo] = await Promise.all([
            drive.drives.get({ driveId: DRIVE_ID }),
        ]);
        const parentId = process.env.DRIVE_COURSE_FOLDER_ID;

        const courseFolders = [];
        let pageToken;
        do {
            const res = await drive.files.list({
                q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'nextPageToken,files(id,name,createdTime)',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
                pageSize: 200,
                pageToken,
            });
            courseFolders.push(...(res.data.files || []));
            pageToken = res.data.nextPageToken;
        } while (pageToken);

        const courseData = courseFolders.map(f => ({
            id: f.id,
            name: f.name,
            createdTime: f.createdTime,
        }));

        return NextResponse.json({
            driveName: driveInfo.data.name,
            driveId: DRIVE_ID,
            parentId,
            totalCourses: courseData.length,
            courseFolders: courseData.sort((a, b) => a.name.localeCompare(b.name)),
        });
    } catch (error) {
        console.error('Drive storage error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
