import connectDB from '@/config/connectDB';
import PostStudent from '@/models/student';
import Invoice from '@/models/invoices';
import Bank from '@/models/bank';
import Debt from '@/models/debt';
import '@/models/course';
import '@/models/book';
import '@/models/users';
import { NextResponse } from 'next/server';
import authenticate from '@/utils/authenticate';
import { authorize } from '@/utils/authorize';
import { revalidateTag } from 'next/cache';

export async function GET(request, { params }) {
    try {
        const { errorResponse } = await authorize(request, ['Admin', 'Academic']);
        if (errorResponse) return errorResponse;

        const { searchParams } = new URL(request.url);
        const _id = searchParams.get('_id');

        if (!_id) {
            return NextResponse.json(
                { status: 1, mes: 'Vui lòng cung cấp ID của hóa đơn.', data: [] },
                { status: 400 }
            );
        }

        await connectDB();

        const invoice = await Invoice.findById(_id)
            .populate({
                path: 'studentId',
                select: 'ID Name Phone Email BD Address'
            })
            .populate({
                path: 'courseId',
                select: 'ID Book',
                populate: {
                    path: 'Book',
                    model: 'book',
                    select: 'Name Price'
                }
            })
            .populate({
                path: 'createBy',
                select: 'name phone',
            })
            .lean();
        if (!invoice) {
            return NextResponse.json(
                { status: 1, mes: `Không tìm thấy hóa đơn với ID: ${_id}`, data: [] },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { status: 2, mes: 'Lấy thông tin hóa đơn thành công.', data: [invoice] },
            { status: 200 }
        );

    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return NextResponse.json(
                { status: 1, mes: 'ID hóa đơn không hợp lệ.', data: [] },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { status: 0, mes: 'Lỗi máy chủ khi lấy thông tin hóa đơn.', data: [] },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const { user, body } = await authenticate(request);
        if (!user) {
            return NextResponse.json(
                { status: 1, mes: 'Xác thực không thành công.', data: [] },
                { status: 401 }
            );
        }

        if (!user.role.includes('Admin') && !user.role.includes('Academic')) {
            return NextResponse.json(
                { status: 1, mes: 'Không có quyền truy cập chức năng này.', data: [] },
                { status: 403 }
            );
        }

        await connectDB();
        const { studentId, courseId, amountInitial, amountPaid, paymentMethod, discount } = body;

        if (!studentId || !courseId || amountInitial === undefined || amountPaid === undefined) {
            return NextResponse.json(
                { status: 1, mes: 'Vui lòng cung cấp đủ thông tin bắt buộc.', data: [] },
                { status: 400 }
            );
        }

        if (paymentMethod === 1) {
            const defaultBank = await Bank.findOne({ isDefault: true }).lean();
            if (!defaultBank) {
                return NextResponse.json(
                    { status: 1, mes: 'Chưa có tài khoản ngân hàng nào được thiết lập mặc định trong hệ thống.', data: [] },
                    { status: 400 }
                );
            }
        }

        const newInvoice = new Invoice({
            studentId, courseId, amountInitial, amountPaid, paymentMethod, discount, createBy: user._id,
        });
        const savedInvoice = await newInvoice.save();

        const updatedStudent = await PostStudent.findOneAndUpdate(
            { _id: studentId, 'Course.course': courseId },
            { $set: { 'Course.$.tuition': savedInvoice._id } },
            { new: true }
        );

        if (!updatedStudent) {
            await Debt.findOneAndUpdate(
                { _id: courseId },
                { $set: { status: 1 } }
            );
        }

        revalidateTag(`student:${studentId}`, 'max');
        revalidateTag('students', 'max');
        revalidateTag(`course:${courseId}`, 'max');
        revalidateTag('courses', 'max');
        return NextResponse.json(
            { status: 2, mes: 'Tạo hóa đơn và ghi nhận thanh toán thành công.', data: [savedInvoice] },
            { status: 201 }
        );

    } catch (error) {
        console.error('API POST Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message).join(' ');
            return NextResponse.json(
                { status: 1, mes: `Lỗi xác thực dữ liệu: ${messages}`, data: [] },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { status: 0, mes: 'Lỗi từ máy chủ, không thể xử lý yêu cầu.', data: [] },
            { status: 500 }
        );
    }
}