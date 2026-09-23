import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import EventTag from '@/models/eventTag';
import Event from '@/models/event';
import checkAuthToken from '@/utils/checktoken';
import mongoose from 'mongoose';

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
        const { name, color, bg, textColor, borderColor, description } = body;

        await connectDB();

        const tag = await EventTag.findById(id);
        if (!tag) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy thẻ' }, { status: 404 });
        }

        const oldName = tag.name;
        const newName = name ? name.trim() : oldName;

        if (newName !== oldName) {
            const existing = await EventTag.findOne({
                _id: { $ne: id },
                name: { $regex: new RegExp(`^${newName}$`, 'i') },
            });
            if (existing) {
                return NextResponse.json({ success: false, message: `Thẻ "${newName}" đã tồn tại` }, { status: 400 });
            }
        }

        tag.name = newName;
        if (color) tag.color = color;
        if (bg) tag.bg = bg;
        if (textColor) tag.textColor = textColor;
        if (borderColor) tag.borderColor = borderColor;
        if (description !== undefined) tag.description = description.trim();

        await tag.save();

        // If name was updated, sync with all events using the old tag name
        if (newName !== oldName) {
            await Event.updateMany(
                { tags: oldName },
                { $set: { 'tags.$[elem]': newName } },
                { arrayFilters: [{ elem: oldName }] }
            );
        }

        const usageCount = await Event.countDocuments({ tags: newName });

        return NextResponse.json({
            success: true,
            message: 'Cập nhật thẻ thành công',
            tag: {
                ...tag.toObject(),
                usageCount,
            },
        }, { status: 200 });
    } catch (error) {
        console.error('Error updating event tag:', error);
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

        const tag = await EventTag.findById(id);
        if (!tag) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy thẻ cần xóa' }, { status: 404 });
        }

        // Integrity Protection: Check if any event is currently using this tag
        const usageCount = await Event.countDocuments({ tags: tag.name });
        if (usageCount > 0) {
            return NextResponse.json({
                success: false,
                message: `Không thể xóa thẻ "${tag.name}" vì đang được sử dụng trong ${usageCount} sự kiện. Vui lòng gỡ thẻ ở các sự kiện trước!`,
                usageCount,
            }, { status: 400 });
        }

        await EventTag.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: `Đã xóa thẻ "${tag.name}" thành công`,
        }, { status: 200 });
    } catch (error) {
        console.error('Error deleting event tag:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
