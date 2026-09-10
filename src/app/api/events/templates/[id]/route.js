import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import EventTemplate from '@/models/eventTemplate';
import checkAuthToken from '@/utils/checktoken';
import mongoose from 'mongoose';

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'ID không hợp lệ' }, { status: 400 });
        }

        await connectDB();
        const template = await EventTemplate.findById(id).lean();
        if (!template) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy mẫu sự kiện' }, { status: 404 });
        }

        return NextResponse.json({ success: true, template }, { status: 200 });
    } catch (error) {
        console.error('Error fetching template:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const user = await checkAuthToken();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'ID không hợp lệ' }, { status: 400 });
        }

        const body = await req.json();
        await connectDB();

        const updated = await EventTemplate.findByIdAndUpdate(
            id,
            { ...body },
            { new: true, runValidators: true }
        ).lean();

        if (!updated) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy mẫu để cập nhật' }, { status: 404 });
        }

        return NextResponse.json({ success: true, template: updated }, { status: 200 });
    } catch (error) {
        console.error('Error updating template:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const user = await checkAuthToken();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'ID không hợp lệ' }, { status: 400 });
        }

        await connectDB();
        const deleted = await EventTemplate.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy mẫu để xóa' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Đã xóa mẫu sự kiện thành công' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting template:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
