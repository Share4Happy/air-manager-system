import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import EventTag from '@/models/eventTag';
import Event from '@/models/event';
import { authorize } from '@/utils/authorize';

const DEFAULT_TAGS = [
    {
        name: 'Phục vụ cộng đồng',
        color: '#059669',
        bg: '#ecfdf5',
        textColor: '#047857',
        borderColor: '#a7f3d0',
        description: 'Các sự kiện STEM & Robotics vì cộng đồng, phi lợi nhuận',
        isDefault: true,
    },
];

export async function GET(req) {
    try {
        const auth = await authorize(req);
        if (!auth.authorized) return auth.response;

        await connectDB();

        let tags = await EventTag.find().sort({ isDefault: -1, createdAt: -1 }).lean();

        // Auto-seed default tags if none exist
        if (!tags || tags.length === 0) {
            for (const dt of DEFAULT_TAGS) {
                await EventTag.findOneAndUpdate(
                    { name: dt.name },
                    { $setOnInsert: dt },
                    { upsert: true, new: true }
                );
            }
            tags = await EventTag.find().sort({ isDefault: -1, createdAt: -1 }).lean();
        }

        // Calculate usage count for each tag
        const tagsWithUsage = await Promise.all(
            tags.map(async (tag) => {
                const usageCount = await Event.countDocuments({ tags: tag.name });
                return {
                    ...tag,
                    usageCount,
                };
            })
        );

        return NextResponse.json({
            success: true,
            tags: tagsWithUsage,
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching event tags:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const auth = await authorize(req);
        if (!auth.authorized) return auth.response;
        const user = auth.user;

        const body = await req.json();
        const { name, color, bg, textColor, borderColor, description } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ success: false, message: 'Tên thẻ không được để trống' }, { status: 400 });
        }

        await connectDB();

        const trimmedName = name.trim();
        const existing = await EventTag.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
        if (existing) {
            return NextResponse.json({ success: false, message: `Thẻ "${trimmedName}" đã tồn tại trong hệ thống` }, { status: 400 });
        }

        const newTag = await EventTag.create({
            name: trimmedName,
            color: color || '#059669',
            bg: bg || '#ecfdf5',
            textColor: textColor || '#047857',
            borderColor: borderColor || '#a7f3d0',
            description: description?.trim() || '',
            isDefault: false,
            createdBy: user.id || user._id || null,
        });

        return NextResponse.json({
            success: true,
            message: 'Tạo thẻ thành công',
            tag: {
                ...newTag.toObject(),
                usageCount: 0,
            },
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating event tag:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
