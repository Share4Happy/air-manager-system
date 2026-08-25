import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import PostCourse from '@/models/course'
import TrialCourse from '@/models/coursetry'
import PostStudent from '@/models/student'
import mongoose from 'mongoose'
import { revalidateTag } from 'next/cache'
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
    if (!sessionId || !Array.isArray(attendanceData))
      return NextResponse.json({ status: 1, mes: 'Thiếu tham số bắt buộc (sessionId, attendanceData)' }, { status: 400 })

    if (!mongoose.Types.ObjectId.isValid(sessionId))
      return NextResponse.json({ status: 1, mes: 'sessionId không hợp lệ' }, { status: 400 })

    await connectDB()
    const sessionIdObj = new mongoose.Types.ObjectId(sessionId)
    const Session = (await import('@/models/session')).default
    const Attendance = (await import('@/models/attendance')).default

    // Tìm thông tin buổi học trong Session collection (LMS chuẩn)
    const sessionDoc = await Session.findById(sessionIdObj).lean()

    // Tìm khóa học chính thức (PostCourse)
    let course = null
    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      course = await PostCourse.findById(courseId).lean()
    }
    if (!course && courseId && typeof courseId === 'string') {
      course = await PostCourse.findOne({ ID: courseId.trim() }).lean()
    }
    if (!course && sessionDoc?.course) {
      course = await PostCourse.findById(sessionDoc.course).lean()
    }
    if (!course && sessionDoc?.courseCode) {
      course = await PostCourse.findOne({ ID: sessionDoc.courseCode }).lean()
    }
    if (!course) {
      course = await PostCourse.findOne({ 'Detail._id': sessionIdObj }).lean()
    }

    // Tìm khóa học thử (TrialCourse) nếu không phải khóa chính thức
    let trialCourse = null
    if (!course) {
      if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
        trialCourse = await TrialCourse.findById(courseId).lean()
      }
      if (!trialCourse) {
        trialCourse = await TrialCourse.findOne({ 'sessions._id': sessionIdObj }).lean()
      }
    }

    // Cập nhật điểm danh và nhận xét
    for (const a of attendanceData) {
      if (!a || !a.studentId) continue

      const checkinNum = (a.checkin !== undefined && a.checkin !== null && a.checkin !== '') ? Number(a.checkin) : undefined
      const updateAtt = {
        session: sessionIdObj,
        course: course?._id || trialCourse?._id || sessionDoc?.course || (courseId && mongoose.Types.ObjectId.isValid(courseId) ? new mongoose.Types.ObjectId(courseId) : null),
        courseCode: course?.ID || trialCourse?.name || sessionDoc?.courseCode || (typeof courseId === 'string' ? courseId : ''),
        studentId: a.studentId
      }

      if (checkinNum !== undefined && !isNaN(checkinNum)) updateAtt.checkin = checkinNum
      if (a.comment !== undefined) updateAtt.cmt = a.comment || []
      if (a.cmtFn !== undefined) updateAtt.cmtFn = a.cmtFn || ''
      if (a.absenceReason !== undefined) updateAtt.absenceReason = a.absenceReason || ''
      if (a.note !== undefined) updateAtt.note = a.note || ''

      // 1. Cập nhật vào Attendance collection (nguồn chuẩn)
      await Attendance.updateOne(
        { session: sessionIdObj, studentId: a.studentId },
        { $set: updateAtt },
        { upsert: true }
      )

      // 2. Đồng bộ vào PostCourse.Student nếu có
      if (course) {
        const updateCourseFields = {}
        if (checkinNum !== undefined && !isNaN(checkinNum)) {
          updateCourseFields['Student.$[stu].Learn.$[les].Checkin'] = checkinNum
        }
        if (a.comment !== undefined) {
          updateCourseFields['Student.$[stu].Learn.$[les].Cmt'] = a.comment || []
        }
        if (a.absenceReason !== undefined) {
          updateCourseFields['Student.$[stu].Learn.$[les].absenceReason'] = a.absenceReason
        }
        if (a.cmtFn !== undefined) {
          updateCourseFields['Student.$[stu].Learn.$[les].CmtFn'] = a.cmtFn
        }

        if (Object.keys(updateCourseFields).length > 0) {
          await PostCourse.updateOne(
            { _id: course._id },
            { $set: updateCourseFields },
            { arrayFilters: [{ 'stu.ID': a.studentId }, { 'les.Lesson': sessionIdObj }] }
          ).catch(() => {})
        }
      }

      // 3. Đồng bộ vào TrialCourse nếu là khóa học thử
      if (trialCourse) {
        const stuDoc = await PostStudent.findOne({ ID: a.studentId }, { _id: 1 }).lean()
        if (stuDoc?._id) {
          const updateTrial = {}
          if (checkinNum !== undefined && !isNaN(checkinNum)) {
            updateTrial['sessions.$[ses].students.$[stu].checkin'] = (checkinNum !== 2 && checkinNum !== 0)
          }
          if (a.comment !== undefined) {
            updateTrial['sessions.$[ses].students.$[stu].cmt'] = a.comment || []
          }
          if (Object.keys(updateTrial).length > 0) {
            await TrialCourse.updateOne(
              { _id: trialCourse._id },
              { $set: updateTrial },
              { arrayFilters: [{ 'ses._id': sessionIdObj }, { 'stu.studentId': stuDoc._id }] }
            ).catch(() => {})
          }
        }
      }
    }

    // Revalidate cache
    revalidateTag(`data_lesson${sessionId}`, 'max')
    revalidateTag('running-schedules', 'max')
    if (course?._id) reloadCourse(course._id)
    if (courseId && (!course || String(course._id) !== String(courseId))) reloadCourse(courseId)
    reloadCoursetry()

    return NextResponse.json({ status: 2, mes: 'Cập nhật điểm danh và nhận xét thành công!' })
  } catch (err) {
    console.error('Checkin update error:', err)
    return NextResponse.json({ status: 1, mes: err.message || 'internal error' }, { status: 500 })
  }
}