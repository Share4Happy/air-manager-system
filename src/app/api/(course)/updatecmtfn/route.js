import { NextResponse } from 'next/server'
import PostCourse from '@/models/course'
import TrialCourse from '@/models/coursetry'
import connectDB from '@/config/connectDB'
import mongoose from 'mongoose'
import jsonRes, { corsHeaders } from '@/utils/response'

const CORS_HEADERS = corsHeaders

export async function POST(req) {
    try {
        const { courseId, studentId, lessonId, commentText } = await req.json()
        if (!courseId || !studentId || !lessonId || commentText === undefined) {
            return jsonRes(400, { status: false, mes: "Request body must include 'courseId', 'studentId', 'lessonId', and 'commentText'.", data: null })
        }

        await connectDB()

        const Attendance = (await import('@/models/attendance')).default;
        await Attendance.updateOne(
            {
                session: new mongoose.Types.ObjectId(lessonId),
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