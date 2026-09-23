import { NextResponse } from 'next/server';
import { authorize } from '@/utils/authorize';
import { getMigrationStats, runLmsMigration, cleanupLegacyEmbeddedData, cleanupNotificationCollections } from '@/lib/migration/lms-migration';

export async function GET(req) {
    try {
        const auth = await authorize(req, ['Admin', 'Academic']);
        if (!auth.authorized) return auth.response;

        const stats = await getMigrationStats();
        return NextResponse.json({ success: true, data: stats });
    } catch (err) {
        console.error('Migration GET error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const auth = await authorize(req, ['Admin', 'Academic']);
        if (!auth.authorized) return auth.response;

        const body = await req.json().catch(() => ({}));

        if (body.mode === 'cleanup') {
            const cleanupResult = await cleanupLegacyEmbeddedData();
            return NextResponse.json({
                success: true,
                data: cleanupResult
            });
        }

        if (body.mode === 'cleanup-notifications') {
            const cleanupResult = await cleanupNotificationCollections();
            return NextResponse.json({
                success: true,
                data: cleanupResult
            });
        }

        const isDryRun = body.mode === 'dry-run';
        const result = await runLmsMigration({ dryRun: isDryRun });
        const updatedStats = await getMigrationStats();

        return NextResponse.json({
            success: true,
            data: {
                ...result,
                stats: updatedStats
            }
        });
    } catch (err) {
        console.error('Migration POST error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
