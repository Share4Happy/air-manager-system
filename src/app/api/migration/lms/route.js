import { NextResponse } from 'next/server';
import checkAuthToken from '@/utils/checktoken';
import { getMigrationStats, runLmsMigration } from '@/lib/migration/lms-migration';

export async function GET() {
    try {
        const user = await checkAuthToken();
        if (!user || !user.role?.includes('Admin')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        const stats = await getMigrationStats();
        return NextResponse.json({ success: true, data: stats });
    } catch (err) {
        console.error('Migration GET error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await checkAuthToken();
        if (!user || !user.role?.includes('Admin')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
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
