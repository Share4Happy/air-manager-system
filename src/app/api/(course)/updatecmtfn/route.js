import { NextResponse } from 'next/server'
import PostCourse from '@/models/course'
import TrialCourse from '@/models/coursetry'
import connectDB from '@/config/connectDB'
import mongoose from 'mongoose'
import jsonRes, { corsHeaders } from '@/utils/response'
import { authorize } from '@/utils/authorize'

const CORS_HEADERS = corsHeaders

export async function POST(req) {
    try {
        const auth = await authorize(req, ['Admin', 'Academic', 'Teacher']);
        if (!auth.authorized) return auth.response;

        const { courseId, studentId, lessonId, commentText } = await req.json()
        if (!courseId || !studentId || !lessonId || commentText === undefined) {
            return jsonRes(400, { status: false, mes: "Request body must include 'courseId', 'studentId', 'lessonId', and 'commentText'.", data: null })
        }

        await connectDB()

        const Attendance = (await import('@/models/attendance')).default;
        const lessonObjectId = new mongoose.Types.ObjectId(lessonId);

        // Kiểm tra tính hợp lệ của học sinh trong khóa
        let isAllowed = false;
        if (mongoose.Types.ObjectId.isValid(courseId)) {
            const course = await PostCourse.findById(courseId, { Student: 1 }).lean();
            if (course && (course.Student || []).some(s => s.ID === studentId || s._id?.toString() === studentId)) {
                isAllowed = true;
            }
            if (!isAllowed) {
                const trialCourse = await TrialCourse.findById(courseId).lean();
                const trialSes = (trialCourse?.sessions || []).find(s => s._id?.toString() === lessonId);
                if (trialSes && (trialSes.students || []).some(s => s.studentId === studentId)) {
                    isAllowed = true;
                }
            }
        }
        if (!isAllowed) {
            const existingAtt = await Attendance.findOne({ session: lessonObjectId, studentId }).lean();
            if (existingAtt && ((existingAtt.makeupStatus && existingAtt.makeupStatus !== 'NOT_REQUIRED') || (typeof existingAtt.checkin === 'number' && existingAtt.checkin > 0))) {
                isAllowed = true;
            }
        }

        if (!isAllowed) {
            return jsonRes(400, { status: false, mes: 'Học sinh không thuộc khóa học này hoặc không có lịch học bù hợp lệ.', data: null });
        }

        await Attendance.updateOne(
            {
                session: lessonObjectId,
                studentId: studentId
            },
            { $set: { cmtFn: commentText } },
            { upsert: true }
        );

        // Fallback cập nhật vào CSDL cũ nếu còn
        await PostCourse.updateOne(
            { _id: courseId },
            { $set: { 'Student.$[stu].Learn.$[les].CmtFn': commentText } },
            {
                arrayFilters: [
                    { 'stu.ID': studentId },
                    { 'les.Lesson': new mongoose.Types.ObjectId(lessonId) }
                ]
            }
        ).catch(err => console.error('PostCourse.updateOne CmtFn error:', err.message));

        await TrialCourse.updateOne(
            { _id: courseId },
            { $set: { 'sessions.$[ses].students.$[stu].cmt': commentText } },
            { arrayFilters: [{ 'ses._id': new mongoose.Types.ObjectId(lessonId) }, { 'stu.studentId': studentId }] }
        ).catch(err => console.error('TrialCourse.updateOne cmt error:', err.message));

        return jsonRes(200, { status: true, mes: 'Comment updated successfully.', data: null })

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return jsonRes(500, { status: false, mes: errorMessage, data: null })
    }
}

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}