import { NextResponse } from 'next/server';
import PostStudent from '@/models/student';
import connectToDB from '@/config/connectDB';
import { sendByPhone, getActiveZaloAccount, extractSendUid, sendResponseOk, sendResponseError } from '@/function/zalolite';

export async function POST(request) {
    let body;

    try {
        body = await request.json();
    } catch (error) {
        return NextResponse.json({ message: 'Lỗi: Body không phải là JSON hợp lệ.' }, { status: 400 });
    }

    const { mes, id } = body;

    if (!id || !mes) {
        return NextResponse.json(
            { message: 'Vui lòng cung cấp đủ ID học sinh và nội dung tin nhắn (mes).' },
            { status: 400 }
        );
    }

    try {
        await connectToDB();
        const student = await PostStudent.findOne({ ID: id }).lean();
        if (!student) {
            return NextResponse.json(
                { message: 'Không tìm thấy học sinh với ID này.' },
                { status: 404 }
            );
        }

        if (!student.Phone) {
            return NextResponse.json(
                { message: 'Dữ liệu không hợp lệ: Học sinh này không có số điện thoại để gửi tin.' },
                { status: 400 }
            );
        }

        let personalizedMessage = mes;

        if (personalizedMessage.includes('{namestudent}')) {
            personalizedMessage = personalizedMessage.replaceAll('{namestudent}', student.Name || '');
        }

        if (personalizedMessage.includes('{nameparents}')) {
            personalizedMessage = personalizedMessage.replaceAll('{nameparents}', student.ParentName || '');
        }

        const zaloAccount = await getActiveZaloAccount();
        const response = await sendByPhone(zaloAccount.botId, {
            phone: student.Phone,
            text: personalizedMessage,
            mode: 'safe',
        });

        if (sendResponseOk(response)) {
            const resolvedUid = extractSendUid(response) || student.Uid;
            if (!student.Uid && resolvedUid) {
                await PostStudent.updateOne(
                    { ID: id },
                    { $set: { Uid: resolvedUid } }
                );
            }

            return NextResponse.json({
                status: 2,
                message: 'Gửi tin nhắn thành công',
                data: {
                    name: response?.data?.results?.[0]?.name || student.Name,
                    uid: resolvedUid,
                },
            }, { status: 200 });

        } else {
            throw new Error(sendResponseError(response) || 'ZaloLite Gateway xử lý thất bại.');
        }

    } catch (error) {
        return NextResponse.json(
            {
                status: 1,
                message: error.message,
                data: null
            },
            { status: 500 }
        );
    }
}