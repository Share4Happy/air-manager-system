import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/config/connectDB';
import Debt from '@/models/debt';
import { clearCacheByTag, clearAllCache } from '@/lib/cache';
import { revalidatePath } from 'next/cache';

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { studentId, courseId, courseName, amount, sessions, startDate, endDate, note, type } = body;

        if (!studentId || amount == null) {
            return NextResponse.json({ mes: 'Thiếu thông tin bắt buộc' }, { status: 400 });
        }

        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return NextResponse.json({ mes: 'Mã học sinh không hợp lệ' }, { status: 400 });
        }

        await Debt.create({
            studentId,
            courseId: courseId && mongoose.Types.ObjectId.isValid(courseId) ? new mongoose.Types.ObjectId(courseId) : null,
            courseName: courseName || '',
            amount: Number(amount),
            sessions: Number(sessions) || 0,
            startDate: startDate || '',
            endDate: endDate || '',
            note: note || '',
            status: 0,
            createBy: 'admin',
        });

        clearCacheByTag('students');
        clearAllCache();
        revalidatePath('/academic/debt');

        return NextResponse.json({ mes: 'Tạo học phí thành công' }, { status: 200 });
    } catch (error) {
        console.error('Lỗi tạo học phí:', error);
        return NextResponse.json({ mes: 'Lỗi server: ' + error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        await connectDB();
        const debts = await Debt.find({}).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ data: debts }, { status: 200 });
    } catch (error) {
        console.error('Lỗi lấy danh sách học phí:', error);
        return NextResponse.json({ mes: 'Lỗi server' }, { status: 500 });
    }
}
