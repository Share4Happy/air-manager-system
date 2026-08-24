import { NextResponse } from 'next/server';
import { getMonthlyCalendar } from '@/data/database/calendar';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const month = +searchParams.get('month');
        const year = +searchParams.get('year');
        const teacherId = searchParams.get('teacherId');

        if (!Number.isInteger(month) || !Number.isInteger(year) || month < 1 || month > 12) {
            return NextResponse.json({ error: 'month/year không hợp lệ' }, { status: 400 });
        }

        const data = await getMonthlyCalendar({ month, year, teacherId });
        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error('Calendar API error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
