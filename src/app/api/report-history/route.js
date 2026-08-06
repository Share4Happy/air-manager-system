import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import Logs from '@/models/log'

export async function GET() {
    try {
        await connectDB()
        const logs = await Logs.find({
            $or: [
                { type: 'sendReport' },
                { type: 'sendMessage', schedule: null },
            ],
        })
            .populate('zalo', 'name avt')
            .populate('createBy', 'name phone')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean()
        return NextResponse.json({
            success: true,
            data: JSON.parse(JSON.stringify(logs)),
        })
    } catch (err) {
        console.error('Report History API Error:', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
