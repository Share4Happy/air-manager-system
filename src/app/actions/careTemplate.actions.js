'use server';
import connectDB from '@/config/connectDB';
import mongoose from 'mongoose';
import CareTemplate from '@/models/careTemplate';
import checkAuthToken from '@/utils/checktoken';

async function requireAdminSale() {
    const user = await checkAuthToken();
    if (!user || !user.id) return { ok: false, message: 'Bạn cần đăng nhập.' };
    if (!user.role?.includes('Admin') && !user.role?.includes('Sale')) {
        return { ok: false, message: 'Bạn không có quyền thực hiện chức năng này.' };
    }
    return { ok: true, user };
}

export async function saveCareTemplateAction(_prevState, formData) {
    const auth = await requireAdminSale();
    if (!auth.ok) return { status: false, message: auth.message };
    const name = (formData.get('name') || '').toString().trim();
    const content = (formData.get('content') || '').toString().trim();
    const messageType = (formData.get('messageType') || 'other').toString();
    if (!name) return { status: false, message: 'Vui lòng nhập tên mẫu.' };
    if (!content) return { status: false, message: 'Vui lòng nhập nội dung mẫu.' };
    try {
        await connectDB();
        const id = (formData.get('_id') || '').toString();
        if (id && mongoose.isValidObjectId(id)) {
            await CareTemplate.findByIdAndUpdate(id, { name, content, messageType });
        } else {
            await CareTemplate.create({ name, content, messageType, createdBy: auth.user.id });
        }
        return { status: true, message: 'Đã lưu mẫu tin nhắn chăm sóc.' };
    } catch (error) {
        console.error('Save Care Template Error:', error);
        return { status: false, message: 'Lỗi hệ thống, không thể lưu mẫu.' };
    }
}

export async function deleteCareTemplateAction(_prevState, formData) {
    const auth = await requireAdminSale();
    if (!auth.ok) return { status: false, message: auth.message };
    try {
        await connectDB();
        await CareTemplate.findByIdAndDelete((formData.get('_id') || '').toString());
        return { status: true, message: 'Đã xóa mẫu tin nhắn.' };
    } catch (error) {
        console.error('Delete Care Template Error:', error);
        return { status: false, message: 'Lỗi hệ thống, không thể xóa mẫu.' };
    }
}
