import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import DriveStorageConfig from '@/models/driveStorageConfig';
import Area from '@/models/area';
import checkAuthToken from '@/utils/checktoken';
import { computeNextRunAt } from '@/function/report';

export async function GET() {
    try {
        await connectDB();
        const [config, areas] = await Promise.all([
            DriveStorageConfig.findOne({}).populate('areas', 'name color').lean(),
            Area.find({}).select('name color').lean(),
        ]);

        const defaultData = {
            isActive: false,
            frequency: 'daily',
            scanTime: '03:00',
            weekday: 1,
            monthDay: 1,
            areas: [],
            nextRunAt: null,
            lastRunAt: null,
            lastRunStats: {
                totalFiles: 0,
                updatedFiles: 0,
                durationMs: 0,
                status: 'idle',
                error: '',
            },
        };

        return NextResponse.json({
            config: config || defaultData,
            areas: areas || [],
        });
    } catch (error) {
        console.error('Get Drive Storage Schedule Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const auth = await checkAuthToken();
        if (!auth || !auth.id) {
            return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
        }

        const body = await request.json();
        const {
            isActive = false,
            frequency = 'daily',
            scanTime = '03:00',
            weekday = 1,
            monthDay = 1,
            areas = [],
        } = body;

        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(scanTime)) {
            return NextResponse.json({ error: 'Giờ quét không hợp lệ (định dạng HH:MM).' }, { status: 400 });
        }

        await connectDB();

        let nextRunAt = null;
        if (isActive) {
            nextRunAt = computeNextRunAt({
                frequency,
                sendTime: scanTime,
                weekday: Number(weekday),
                monthDay: Number(monthDay),
            });
        }

        const updated = await DriveStorageConfig.findOneAndUpdate(
            {},
            {
                $set: {
                    isActive: Boolean(isActive),
                    frequency,
                    scanTime,
                    weekday: Number(weekday),
                    monthDay: Number(monthDay),
                    areas: Array.isArray(areas) ? areas : [],
                    nextRunAt,
                    updatedBy: auth.id,
                },
            },
            { new: true, upsert: true }
        ).populate('areas', 'name color').lean();

        return NextResponse.json({
            success: true,
            message: 'Đã lưu cài đặt lịch quét Google Drive thành công!',
            config: updated,
        });
    } catch (error) {
        console.error('Save Drive Storage Schedule Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
