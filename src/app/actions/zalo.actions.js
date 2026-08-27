
'use server';

import connectDB from '@/config/connectDB';
import ZaloAccount from '@/models/zalo';
import checkAuthToken from '@/utils/checktoken';
import { reloadUser, reloadZalo } from '@/data/actions/reload';
import User from '@/models/users';
import { fetchBot } from '@/function/zalolite';

export async function addZaloAccountAction(previousState, formData) {
    const user = await checkAuthToken();
    if (!user || !user.id) return { message: 'Bạn cần đăng nhập để thực hiện hành động này.', status: false };
    if (!user.role.includes('Admin') && !user.role.includes('Sale') && !user.role.includes('Academic')) {
        return { message: 'Bạn không có quyền thực hiện chức năng này', status: false };
    }

    const botId = String(formData.get('botId') || '').trim();
    if (!botId) return { status: false, message: 'Vui lòng nhập bot_id (UUID của bot trên ZaloLite).' };
    try {
        const bot = await fetchBot(botId);
        if (!bot) return { status: false, message: 'Không tìm thấy bot với bot_id này trên ZaloLite Gateway.' };

        const dataForMongo = {
            botId,
            uid: bot.zalo_global_uid || bot.uid || '',
            name: bot.name || 'Bot chưa có tên',
            phone: bot.phone || bot.raw_profile?.phoneNumber || '',
            avt: bot.avatar || '',
            is_active: bot.is_active ?? true,
        };
        await connectDB();
        await ZaloAccount.findOneAndUpdate(
            { $or: [{ botId }, { uid: dataForMongo.uid }] },
            dataForMongo,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        reloadZalo();
        return { status: true, message: `Thêm bot "${dataForMongo.name}" thành công!` };
    } catch (error) {
        console.error('Add Zalo Account Action Error:', error);
        return { status: false, message: error.message || 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.' };
    }
}

export async function selectZaloAccountAction(previousState, formData) {
    try {
        const user = await checkAuthToken();
        if (!user || !user.id) {
            return { status: false, message: 'Xác thực không thành công.' };
        }
        if (!user.role.includes('Admin') && !user.role.includes('Sale') && !user.role.includes('Academic')) {
            return { status: false, message: 'Bạn không có quyền thực hiện chức năng này.' };
        }

        const zaloAccountId = formData.get('zaloAccountId');
        await connectDB();

        // Trường hợp 1: Thoát/Bỏ chọn tài khoản (ID rỗng)
        if (!zaloAccountId) {
            await User.findByIdAndUpdate(user.id, { $set: { zalo: null } });
            reloadUser(user.id);
            return { status: true, message: 'Đã hủy chọn tài khoản Zalo.' };
        }

        // Trường hợp 2: Chọn tài khoản mới (ID hợp lệ)
        if (zaloAccountId.length !== 24) {
            return { status: false, message: 'ID tài khoản Zalo không hợp lệ.' };
        }

        const accountToSelect = await ZaloAccount.findById(zaloAccountId);
        if (!accountToSelect) {
            return { status: false, message: 'Không tìm thấy tài khoản Zalo này.' };
        }

        await User.findByIdAndUpdate(user.id, { $set: { zalo: zaloAccountId } });
        reloadUser(user.id);
        return { status: true, message: `Đã chọn tài khoản ${accountToSelect.name}.` };

    } catch (error) {
        console.error('Select Zalo Account Error:', error);
        return { status: false, message: 'Đã xảy ra lỗi không xác định.' };
    }
}

export async function updateZaloRolesAction(previousState, formData) {
    // 1. Xác thực và kiểm tra quyền người dùng
    const user = await checkAuthToken();
    if (!user || !user.id) {
        return { message: 'Bạn cần đăng nhập để thực hiện hành động này.', status: false };
    }
    // Chỉ Admin hoặc Học vụ mới có quyền phân quyền
    if (!user.role.includes('Admin') && !user.role.includes('Academic')) {
        return { message: 'Bạn không có quyền thực hiện chức năng này.', status: false };
    }

    try {
        // 2. Lấy và kiểm tra dữ liệu từ form
        const zaloAccountId = formData.get('zaloAccountId');
        const userIdsJSON = formData.get('userIds');

        if (!zaloAccountId || !userIdsJSON) {
            return { message: 'Dữ liệu không hợp lệ.', status: false };
        }

        let userIds;
        try {
            userIds = JSON.parse(userIdsJSON);
            if (!Array.isArray(userIds)) throw new Error();
        } catch (e) {
            return { message: 'Định dạng danh sách người dùng không chính xác.', status: false };
        }

        // 3. Kết nối DB và cập nhật
        await connectDB();

        const updatedAccount = await ZaloAccount.findByIdAndUpdate(
            zaloAccountId,
            { $set: { roles: userIds } },
            { new: true } // Trả về document sau khi đã cập nhật
        );
        if (!updatedAccount) {
            return { message: 'Không tìm thấy tài khoản Zalo để cập nhật.', status: false };
        }
        reloadZalo();
        return { status: true, message: `Cập nhật quyền cho tài khoản ${updatedAccount.name} thành công!` };
    } catch (error) {
        console.error('Update Zalo Roles Action Error:', error);
        return { status: false, message: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.' };
    }
}