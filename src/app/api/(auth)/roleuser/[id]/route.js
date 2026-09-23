import bcrypt from 'bcryptjs';
import connectDB from '@/config/connectDB';
import { reloadUser } from '@/data/actions/reload';
import PostUser from '@/models/users';
import jsonRes from '@/utils/response';
import { authorize } from '@/utils/authorize';

export async function PATCH(request, { params }) {
    try {
        const { user: currentAdmin, body: authBody, errorResponse } = await authorize(request, ['Admin', 'Academic']);
        if (errorResponse) return errorResponse;

        const { id } = await params;
        if (!id) {
            return jsonRes(400, { error: 'Thiếu ID người dùng.' });
        }

        await connectDB();

        const body = authBody || await request.json();
        const { name, address, phone, role, email, password } = body;

        const updateData = {};
        if (name) updateData.name = name;
        if (address) updateData.address = address;
        if (phone) updateData.phone = phone;
        if (role && typeof role === 'string') {
            updateData.role = [role];
        }
        if (email) {
            const normalizedEmail = email.trim().toLowerCase();
            const dup = await PostUser.findOne({ email: normalizedEmail, _id: { $ne: id } });
            if (dup) {
                return jsonRes(409, { error: 'Email đã tồn tại.' });
            }
            updateData.email = normalizedEmail;
        }
        if (password) {
            updateData.uid = await bcrypt.hash(password, 10);
        }

        const updatedUser = await PostUser.findByIdAndUpdate(id, { $set: updateData }, { new: true });

        if (!updatedUser) {
            return jsonRes(404, { error: 'Không tìm thấy người dùng để cập nhật.' });
        }
        reloadUser();
        return jsonRes(200, { message: 'Cập nhật thông tin thành công.', user: updatedUser });

    } catch (err) {
        console.error('Lỗi cập nhật role/user:', err);
        return jsonRes(500, { error: 'Lỗi máy chủ' });
    }
}