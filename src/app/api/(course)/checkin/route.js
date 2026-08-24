import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import PostCourse from '@/models/course'
import TrialCourse from '@/models/coursetry'
import PostStudent from '@/models/student'
import mongoose from 'mongoose'
import { revalidateTag } from 'next/cache'
import { Re_coursetry } from '@/data/course'
import { reloadCourse, reloadCoursetry } from '@/data/actions/reload'

import { getMonthlyCalendar } from '@/data/database/calendar'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const month = +searchParams.get('month')
    const year = +searchParams.get('year')
    const teacherId = searchParams.get('teacherId')
    if (!Number.isInteger(month) || !Number.isInteger(year) || month < 1 || month > 12)
      return NextResponse.json({ error: 'month/year không hợp lệ' }, { status: 400 })

    const data = await getMonthlyCalendar({ month, year, teacherId })
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Calendar API error:', err)
    return NextResponse.json({ success: false, error: err.message || 'internal error' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { courseId, sessionId, attendanceData } = await req.json()
    if (!courseId || !sessionId || !Array.isArray(attendanceData))
      return NextResponse.json({ status: 1, mes: 'Thiếu tham số' }, { status: 400 })

    await connectDB()
    let sessionDate;
    const sessionIdObj = new mongoose.Types.ObjectId(sessionId);

    // Trường hợp 1: Khóa học chính thức
    const course = await PostCourse.findOne({ _id: courseId, 'Detail._id': sessionIdObj }).lean()
    if (course) {
      const lesson = course.Detail.find(d => d._id.equals(sessionIdObj));
      if (lesson) sessionDate = lesson.Day;

      for (const a of attendanceData) {
        const updateFields = {
          'Student.$[stu].Learn.$[les].Checkin': Number(a.checkin),
          'Student.$[stu].Learn.$[les].Cmt': a.comment || [],
        };
        if (a.absenceReason !== undefined) {
          updateFields['Student.$[stu].Learn.$[les].absenceReason'] = a.absenceReason;
        }
        await PostCourse.updateOne(
          { _id: course._id },
          { $set: updateFields },
          { arrayFilters: [{ 'stu.ID': a.studentId }, { 'les.Lesson': sessionIdObj }] }
        )

        // Dual-write to Attendance collection for LMS architecture
        try {
          const Attendance = (await import('@/models/attendance')).default;
          await Attendance.updateOne(
            { session: sessionIdObj, studentId: a.studentId },
            {
              $set: {
                session: sessionIdObj,
                course: course._id,
                courseCode: course.ID,
                studentId: a.studentId,
                checkin: Number(a.checkin),
                cmt: a.comment || [],
                absenceReason: a.absenceReason || ''
              }
            },
            { upsert: true }
          );
        } catch (e) {
          console.error('[Checkin] Attendance sync error:', e.message);
        }
      }
    } else {
      // Trường hợp 2: Khóa học thử
      const trialCourse = await TrialCourse.findOne({ 'sessions._id': sessionIdObj }).lean()
      if (!trialCourse) return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học.' }, { status: 404 })

      const lesson = trialCourse.sessions.find(s => s._id.equals(sessionIdObj));
      if (lesson) sessionDate = lesson.day;

      const studentHumanIds = attendanceData.map(a => a.studentId);
      const studentsFound = await PostStudent.find({ ID: { $in: studentHumanIds } }, { _id: 1, ID: 1 }).lean();
      const studentIdMap = new Map(studentsFound.map(s => [s.ID, s._id]));

      for (const a of attendanceData) {
        const student_id = studentIdMap.get(a.studentId);
        if (!student_id) {
          console.warn(`Không tìm thấy học sinh với ID: ${a.studentId}.`);
          continue;
        }

        await TrialCourse.updateOne(
          { _id: trialCourse._id },
          {
            $set: {
              // Giữ nguyên logic mới: lưu checkin dưới dạng Boolean
              'sessions.$[ses].students.$[stu].checkin': (a.checkin != 2 && a.checkin != 0),
              'sessions.$[ses].students.$[stu].cmt': a.comment || []
            }
          },
          { arrayFilters: [{ 'ses._id': sessionIdObj }, { 'stu.studentId': student_id }] }
        )

        // Dual-write to Attendance collection for LMS architecture
        try {
          const Attendance = (await import('@/models/attendance')).default;
          await Attendance.updateOne(
            { session: sessionIdObj, studentId: a.studentId },
            {
              $set: {
                session: sessionIdObj,
                course: trialCourse._id,
                courseCode: trialCourse.name,
                studentId: a.studentId,
                checkin: (a.checkin != 2 && a.checkin != 0) ? 1 : 0,
                cmt: a.comment || [],
                absenceReason: ''
              }
            },
            { upsert: true }
          );
        } catch (e) {
          console.error('[Checkin Trial] Attendance sync error:', e.message);
        }
      }
    }
    reloadCoursetry();
    revalidateTag(`data_lesson${sessionId}`, 'max');
    reloadCourse(courseId);
    return NextResponse.json({ status: 2, mes: 'Cập nhật điểm danh thành công!' })
  } catch (err) {
    console.error('Checkin update error:', err)
    return NextResponse.json({ status: 1, mes: err.message || 'internal error' }, { status: 500 })
  }
}