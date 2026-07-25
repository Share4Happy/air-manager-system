import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import TrialCourse from '@/models/coursetry';
import PostStudent from '@/models/student'; // Import model student để tra cứu
import { Re_coursetry } from '@/data/course';

export async function POST(req) {
    await connectDB();

    try {
        const body = await req.json();
        const { studentId, lessonId, newImages } = body;

        // --- Kiểm tra đầu vào ---
        if (!studentId || !lessonId || !newImages) {
            return NextResponse.json(
                { success: false, message: "Thiếu trường 'studentId', 'lessonId', hoặc 'newImages'." },
                { status: 400 }
            );
        }
        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
            return NextResponse.json(
                { success: false, message: "Trường 'lessonId' không phải là một ObjectId hợp lệ." },
                { status: 400 }
            );
        }
        if (!Array.isArray(newImages)) {
            return NextResponse.json(
                { success: false, message: "'newImages' phải là một mảng." },
                { status: 400 }
            );
        }

        const lessonIdObj = new mongoose.Types.ObjectId(lessonId);

        // --- Trường hợp 1: Cập nhật cho Khóa học chính thức ---
        let result = await PostCourse.updateOne(
            { "Detail._id": lessonIdObj, "Student.ID": studentId },
            {
                $set: {
                    "Student.$[stuElem].Learn.$[learnElem].Image": newImages
                }
            },
            {
                arrayFilters: [
                    { "stuElem.ID": studentId },
                    { "learnElem.Lesson": lessonIdObj }
                ]
            }
        );

        // --- Trường hợp 2: Nếu không tìm thấy trong khóa chính thức, thử cập nhật cho Khóa học thử ---
        if (result.matchedCount === 0) {
            const studentDoc = await PostStudent.findOne({ ID: studentId }).select('_id').lean();

            if (!studentDoc) {
                return NextResponse.json(
                    { success: false, message: `Học sinh với ID: ${studentId} không tồn tại.` },
                    { status: 404 }
                );
            }
            const studentObjectId = studentDoc._id;

            result = await TrialCourse.updateOne(
                { 'sessions._id': lessonIdObj },
                {
                    $set: {
                        'sessions.$[sesElem].students.$[stuElem].images': newImages
                    }
                },
                {
                    arrayFilters: [
                        { 'sesElem._id': lessonIdObj },
                        { 'stuElem.studentId': studentObjectId }
                    ]
                }
            );

            if (result.matchedCount === 0) {
                return NextResponse.json(
                    { success: false, message: `Không tìm thấy khóa học thử nào phù hợp.` },
                    { status: 404 }
                );
            }
        }

        if (result.modifiedCount === 0 && result.matchedCount > 0) {
            return NextResponse.json(
                { success: true, message: 'Dữ liệu không thay đổi.' },
                { status: 200 }
            );
        }
        Re_coursetry();
        return NextResponse.json(
            { success: true, message: `Cập nhật ảnh cho học sinh ${studentId} thành công.` },
            { status: 200 }
        );

    } catch (error) {
        console.error('API Error [add-lesson-images]:', error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ success: false, message: 'Dữ liệu JSON trong body không hợp lệ.' }, { status: 400 });
        }
        return NextResponse.json({ success: false, message: 'Lỗi máy chủ.', error: error.message }, { status: 500 });
    }
}