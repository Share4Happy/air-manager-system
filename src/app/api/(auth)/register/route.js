import bcrypt from 'bcryptjs';
import connectDB from '@/config/connectDB';
import PostUser from '@/models/users';
import { reloadUser } from '@/data/actions/reload';
import jsonRes from '@/utils/response';

export async function POST(req) {
    try {
        await connectDB();
        const {
            name,
            address = '',
            avt = '',
            phone = '',
            email,
            password
        } = await req.json();

        if (!email || !password) {
            return jsonRes(400, { error: 'Email và mật khẩu là bắt buộc' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const exists = await PostUser.exists({ email: normalizedEmail });
        if (exists) {
            return jsonRes(409, { error: 'Email đã tồn tại' });
        }

        const hash = await bcrypt.hash(password, 10);

        await PostUser.create({
            name,
            address,
            avt,
            role: ['Teacher'], // Cố định role mặc định, không cho phép client tự gán Admin
            phone,
            email: normalizedEmail,
            uid: hash,
            status: true
        });

        reloadUser();
        return jsonRes(201, { message: 'Tạo tài khoản thành công' });
    } catch (err) {
        console.error('Lỗi đăng ký tài khoản:', err);
        return jsonRes(500, { error: 'Lỗi máy chủ' });
    }
}

