import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import Course from '@/models/course'
import Student from '@/models/student'
import User from '@/models/users'
import Area from '@/models/area'
import LessonNotify from '@/models/lessonNotify'
import CareTemplate from '@/models/careTemplate'
import checkAuthToken from '@/utils/checktoken'
import mongoose from 'mongoose'

async function requireAdminSale() {
    const auth = await checkAuthToken()
    if (!auth || !auth.id) return { ok: false, message: 'Bạn cần đăng nhập.' }
    if (!auth.role?.includes('Admin') && !auth.role?.includes('Sale')) {
        return { ok: false, message: 'Bạn không có quyền thực hiện chức năng này.' }
    }
    return { ok: true, auth }
}

export async function GET(request) {
    const authRes = await requireAdminSale()
    if (!authRes.ok) return NextResponse.json({ success: false, error: authRes.message }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const history = searchParams.get('history') === '1'
    const templatesOnly = searchParams.get('templates') === '1'

    try {
        await connectDB()
        if (templatesOnly) {
            const templates = await CareTemplate.find({}).sort({ createdAt: -1 }).lean()
            return NextResponse.json({ success: true, data: templates })
        }
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        const courses = await Course.find({ 'Detail.Type': 'Báo nghỉ' })
            .populate('Area', 'name')
            .lean()

        const cancelled = []
        courses.forEach(course => {
            ;(course.Detail || []).forEach(d => {
                if (d.Type !== 'Báo nghỉ') return
                const day = d.Day ? new Date(d.Day) : null
                if (!history && (!day || day < todayStart)) return
                cancelled.push({
                    courseId: String(course._id),
                    courseID: course.ID,
                    courseName: course.Name || course.ID,
                    areaName: course.Area?.name || 'Khác',
                    detailId: String(d._id),
                    day,
                    reason: d.Note || '',
                    teacher: d.Teacher ? String(d.Teacher) : null,
                    students: (course.Student || []).map(s => s.ID).filter(Boolean),
                })
            })
        })

        cancelled.sort((a, b) => (a.day ? a.day - 0 : 0) - (b.day ? b.day - 0 : 0))

        const allStudentIds = [...new Set(cancelled.flatMap(c => c.students))]
        const students = allStudentIds.length
            ? await Student.find({ ID: { $in: allStudentIds } })
                .select('ID Name ParentName Phone Uid')
                .lean()
            : []
        const studentById = new Map(students.map(s => [String(s.ID), s]))

        const teacherIds = [...new Set(cancelled.map(c => c.teacher).filter(Boolean))]
        const teachers = teacherIds.length
            ? await User.find({ _id: { $in: teacherIds } }).select('name').lean()
            : []
        const teacherMap = new Map(teachers.map(t => [String(t._id), t.name || '']))

        const detailIds = cancelled.map(c => c.detailId).filter(id => mongoose.isValidObjectId(id))
        const notifies = detailIds.length
            ? await LessonNotify.find({ detailId: { $in: detailIds } }).lean()
            : []
        const notifyByDetail = new Map(notifies.map(n => [String(n.detailId), n]))

        const confirmUserIds = [...new Set(notifies.flatMap(n => (n.confirmations || []).map(cf => cf.by && String(cf.by)).filter(Boolean)))]
        const confirmUsers = confirmUserIds.length
            ? await User.find({ _id: { $in: confirmUserIds } }).select('name').lean()
            : []
        const confirmUserMap = new Map(confirmUsers.map(u => [String(u._id), u.name || '']))

        const grouped = cancelled.map(c => {
            const rec = notifyByDetail.get(c.detailId)
            return {
                courseId: c.courseId,
                courseID: c.courseID,
                courseName: c.courseName,
                areaName: c.areaName,
                detailId: c.detailId,
                day: c.day,
                reason: c.reason,
                teacherName: c.teacher ? (teacherMap.get(c.teacher) || '') : '',
                students: c.students.map(id => {
                    const st = studentById.get(id)
                    const stRec = rec?.students?.find(x => String(x.ID) === String(id))
                    return {
                        ID: id,
                        Name: st?.Name || '',
                        ParentName: st?.ParentName || '',
                        Phone: st?.Phone || '',
                        Uid: st?.Uid || '',
                        notifyStatus: stRec?.status || 'pending',
                        zaloStatus: stRec?.zaloStatus || 'pending',
                        zaloAt: stRec?.zaloAt || null,
                    }
                }),
                notify: rec
                    ? {
                        status: rec.status,
                        method: rec.method,
                        notifiedBy: rec.notifiedBy,
                        notifiedAt: rec.notifiedAt,
                        confirmations: (rec.confirmations || []).map(cf => ({
                            by: cf.by,
                            name: cf.by ? (confirmUserMap.get(String(cf.by)) || '') : '',
                            at: cf.at,
                            action: cf.action || 'care',
                        })),
                    }
                    : null,
            }
        })

        return NextResponse.json({ success: true, data: grouped })
    } catch (err) {
        console.error('Lesson Cancel GET error:', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}

export async function POST(request) {
    const authRes = await requireAdminSale()
    if (!authRes.ok) return NextResponse.json({ success: false, error: authRes.message }, { status: 403 })

    try {
        const { courseId, detailId, method = 'care', staffId = null, studentId = null, studentIds = null, status = null } = await request.json()
        if (!courseId || !detailId) {
            return NextResponse.json({ success: false, error: 'Thiếu courseId hoặc detailId.' }, { status: 400 })
        }

        await connectDB()
        const course = await Course.findById(courseId).select('ID Detail').lean()
        const lesson = (course?.Detail || []).find(d => String(d._id) === String(detailId))

        // Cập nhật trạng thái chăm sóc cho TỪNG học sinh / NHIỀU học sinh cùng lúc
        const bulkIds = Array.isArray(studentIds) ? studentIds.filter(Boolean) : (studentId ? [studentId] : [])
        if (bulkIds.length > 0 && status) {
            if (!['pending', 'done', 'failed'].includes(status)) {
                return NextResponse.json({ success: false, error: 'Trạng thái không hợp lệ.' }, { status: 400 })
            }
            let rec = await LessonNotify.findOne({ course: courseId, detailId })
            if (!rec) {
                rec = await LessonNotify.create({
                    course: courseId,
                    detailId,
                    day: lesson?.Day || null,
                    reason: lesson?.Note || '',
                    students: bulkIds.map(ID => ({ ID, status })),
                })
            } else {
                bulkIds.forEach(id => {
                    const idx = rec.students.findIndex(x => String(x.ID) === String(id))
                    if (idx >= 0) rec.students[idx].status = status
                    else rec.students.push({ ID: id, status })
                })
                await rec.save()
            }
            return NextResponse.json({ success: true, data: { count: bulkIds.length, status } })
        }

        const update = {
            status: 'notified',
            method: method === 'zalo' ? 'zalo' : 'care',
            notifiedAt: new Date(),
            notifiedBy: authRes.auth.id,
        }
        if (lesson) {
            update.day = lesson.Day || null
            update.reason = lesson.Note || ''
        }

        const rec = await LessonNotify.findOneAndUpdate(
            { course: courseId, detailId },
            {
                $set: update,
                $push: { confirmations: { by: authRes.auth.id, at: new Date(), action: method === 'zalo' ? 'zalo' : 'care' } },
            },
            { new: true, upsert: true }
        )
        return NextResponse.json({
            success: true,
            data: {
                status: rec.status,
                method: rec.method,
                notifiedBy: rec.notifiedBy,
                notifiedAt: rec.notifiedAt,
            },
        })
    } catch (err) {
        console.error('Lesson Cancel POST error:', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
