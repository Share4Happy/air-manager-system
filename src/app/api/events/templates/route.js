import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import EventTemplate from '@/models/eventTemplate';
import { DEFAULT_EVENT_TEMPLATES } from '@/lib/defaultEventTemplates';
import checkAuthToken from '@/utils/checktoken';

export async function GET(req) {
    try {
        await connectDB();
        let templates = await EventTemplate.find({}).sort({ createdAt: -1 }).lean();

        if (!templates || templates.length === 0) {
            // Seed default templates
            await EventTemplate.insertMany(DEFAULT_EVENT_TEMPLATES);
            templates = await EventTemplate.find({}).sort({ createdAt: 1 }).lean();
        }

        return NextResponse.json({ success: true, templates }, { status: 200 });
    } catch (error) {
        console.error('Error fetching event templates:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await checkAuthToken();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        await connectDB();

        const newTemplate = new EventTemplate({
            ...body,
            createdBy: user.id || user._id,
        });

        await newTemplate.save();
        return NextResponse.json({ success: true, template: newTemplate }, { status: 201 });
    } catch (error) {
        console.error('Error creating event template:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
