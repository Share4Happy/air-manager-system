import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { clearAllCache } from '@/lib/cache';
import { authorize } from '@/utils/authorize';

const DATA_CACHE_TAGS = [
    'combined-data',
    'data_client',
    'get_label',
    'get_hissmes',
    'coursetry',
    'students',
    'users',
    'forms',
    'zalo',
    'labels',
    'running-schedules',
];

export async function POST(request) {
    const auth = await authorize(request, ['Admin', 'Academic']);
    if (!auth.authorized) return auth.response;

    clearAllCache();
    for (const tag of DATA_CACHE_TAGS) {
        revalidateTag(tag, 'max');
    }
    return NextResponse.json({ ok: true });
}
