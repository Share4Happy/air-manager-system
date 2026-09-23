import connectDB from '@/config/connectDB';
import { reloadUser } from '@/data/actions/reload';
import PostUser from '@/models/users';
import jsonRes from '@/utils/response';
import { authorize } from '@/utils/authorize';

export async function PATCH(request, { params }) {
    try {
        const { user: currentAdmin, errorResponse } = await authorize(request, ['Admin', 'Academic']);
        if (errorResponse) return errorResponse;

        const { id } = await params;
        if (!id) {
            return jsonRes(400, { error: 'Thiếu ID người dùng.' });
        }

        if (currentAdmin._id.toString() === id) {
            return jsonRes(400, { error: 'Không thể tự vô hiệu hóa tài khoản của chính mình.' });
        }

        await connectDB();

        const user = await PostUser.findById(id);
        if (!user) {
            return jsonRes(404, { error: 'Không tìm thấy người dùng.' });
        }

        user.status = !user.status;
        await user.save();

        await reloadUser();
        return jsonRes(200, { message: 'Cập nhật trạng thái thành công.', status: user.status });

    } catch (err) {
        console.error('Lỗi cập nhật trạng thái user:', err);
        return jsonRes(500, { error: 'Lỗi máy chủ' });
    }
}

