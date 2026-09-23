import { NextResponse } from 'next/server';
import { runSchedulerTick } from '@/lib/scheduler';
import { authorize } from '@/utils/authorize';

export async function GET(req) {
    try {
        const auth = await authorize(req, ['Admin', 'Academic']);
        if (!auth.authorized) return auth.response;
        const result = await runSchedulerTick();
        if (!result.success) {
            return NextResponse.json(
                { message: 'Internal Server Error', error: result.error },
                { status: 500 }
            );
        }
        return NextResponse.json({
            message: 'Scheduler triggered successfully.',
            result,
        }, { status: 200 });
    } catch (error) {
        console.error('[Scheduler API Route Error]', error);
        return NextResponse.json(
            { message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}

