import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import User from '@/models/users';
import { resetAttempts } from '@/lib/login-attempts';

export async function POST(request) {
    try {
        await connectDB();
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ mes: 'Thiếu ID người dùng' }, { status: 400 });
        }

        const user = await User.findById(userId).select('email').lean();
        if (user?.email) {
            resetAttempts(user.email.toLowerCase().trim());
        }

        return NextResponse.json({ mes: 'Đã reset thời gian khóa đăng nhập' }, { status: 200 });
    } catch (error) {
        console.error('Lỗi reset login:', error);
        return NextResponse.json({ mes: 'Lỗi server' }, { status: 500 });
    }
}
