import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import Course from '@/models/course'
import Student from '@/models/student'
import User from '@/models/users'
import Area from '@/models/area'
import LessonNotify from '@/models/lessonNotify'
import CareTemplate from '@/models/careTemplate'
import Logs from '@/models/log'
import checkAuthToken from '@/utils/checktoken'
import { processPendingCareSends } from '@/app/actions/lessonCancel.actions'
import mongoose from 'mongoose'

async function requireAdminSale() {
    const auth = await checkAuthToken()
    if (!auth || !auth.id) return { ok: false, message: 'Bạn cần đăng nhập.' }
    if (!auth.role?.includes('Admin') && !auth.role?.includes('Sale') && !auth.role?.includes('Academic')) {
        return { ok: false, message: 'Bạn không có quyền thực hiện chức năng này.' }
    }
    return { ok: true, auth }
}

function buildLessonData(course, detailId, attendances = []) {
    const dId = String(detailId)
    const byId = {}
    let enrolled = 0
    let rollCallChecked = 0
    let withImage = 0
    let withComment = 0

    const attMap = new Map()
    ;(attendances || []).forEach(att => {
        if (att.studentId) attMap.set(String(att.studentId), att)
    })

    ;(course?.Student || []).forEach(s => {
        const studentId = String(s.ID)
        const learn = (s.Learn || []).find(x => x.Lesson && String(x.Lesson) === dId)
        const att = attMap.get(studentId)

        enrolled++
        const checkin = att ? (att.checkin || 0) : (learn?.Checkin || 0)
        const cmtfn = att?.cmtFn || learn?.CmtFn || ''
        const images = (att?.images && att.images.length)
            ? att.images.map(img => ({ id: img.id || img, type: img.type || '' }))
            : ((learn?.Image || []).map(img => ({ id: img.id, type: img.type || '' })))

        if (checkin >= 1) rollCallChecked++
        if (images.length > 0) withImage++
        if (cmtfn && String(cmtfn).trim()) withComment++

        byId[studentId] = {
            checkin,
            cmtfn,
            images,
        }
    })
    return { enrolled, rollCallChecked, withImage, withComment, byId }
}

export async function GET(request) {
    const authRes = await requireAdminSale()
    if (!authRes.ok) return NextResponse.json({ success: false, error: authRes.message }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const history = searchParams.get('history') === '1'
    const templatesOnly = searchParams.get('templates') === '1'
    const logsOnly = searchParams.get('logs') === '1'

    try {
        await connectDB()
        if (templatesOnly) {
            const templates = await CareTemplate.find({}).sort({ createdAt: -1 }).lean()
            return NextResponse.json({ success: true, data: templates })
        }
        if (logsOnly) {
            processPendingCareSends()
            const logs = await Logs.find({ type: 'sendCare' })
                .populate('zalo', 'name')
                .populate('createBy', 'name phone')
                .populate('student', 'Name')
                .sort({ createdAt: -1 })
                .limit(100)
                .lean()
            const groups = new Map()
            logs.forEach(l => {
                const bid = l.status?.data?.batchId
                const key = bid || l._id
                const g = groups.get(key) || { logs: [] }
                g.logs.push(l)
                groups.set(key, g)
            })
            const merged = Array.from(groups.values()).map(g => {
                const list = g.logs
                const first = list[0]
                const allOk = list.every(x => !!x.status?.status)
                const recipients = list.flatMap(x => x.status?.data?.recipients || [])
                const names = list.flatMap(x => x.status?.data?.recipientNames || []).filter(Boolean)
                return {
                    _id: first._id,
                    createdAt: first.createdAt,
                    zalo: first.zalo,
                    createBy: first.createBy,
                    student: first.student,
                    status: {
                        ...(first.status || {}),
                        status: allOk,
                        message: list.length > 1
                            ? (allOk
                                ? `Đã gửi cho ${list.length} người nhận.`
                                : `${list.filter(x => !x.status?.status).length}/${list.length} người nhận gửi thất bại.`)
                            : first.status?.message,
                    },
                    _recipients: recipients,
                    _recipientNames: names,
                }
            })
            return NextResponse.json({ success: true, data: JSON.parse(JSON.stringify(merged)) })
        }
        processPendingCareSends()
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const todayEnd = new Date(todayStart)
        todayEnd.setDate(todayEnd.getDate() + 1)
        const windowEnd = new Date(todayStart)
        windowEnd.setDate(windowEnd.getDate() + 11)

        const dateParam = searchParams.get('date')
        let dayStart = null
        let dayEnd = null
        if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
            const [yy, mm, dd] = dateParam.split('-').map(Number)
            if (!isNaN(yy) && !isNaN(mm) && !isNaN(dd)) {
                dayStart = new Date(yy, mm - 1, dd)
                dayEnd = new Date(dayStart)
                dayEnd.setDate(dayEnd.getDate() + 1)
            }
        }

        const Session = (await import('@/models/session')).default;
        const Attendance = (await import('@/models/attendance')).default;
        const sessions = await Session.find({
            $or: [
                { type: 'Báo nghỉ' },
                { day: { $gte: todayStart, $lt: todayEnd } },
            ],
        }).lean();

        const rows = [];

        if (sessions.length > 0) {
            const courseIds = [...new Set(sessions.map(s => s.course).filter(Boolean))];
            const courses = await Course.find({ _id: { $in: courseIds } })
                .populate('Area', 'name')
                .lean();
            const courseMap = new Map(courses.map(c => [String(c._id), c]));

            const sessionIds = sessions.map(s => s._id);
            const attendances = await Attendance.find({ session: { $in: sessionIds } }).lean();
            const attBySession = new Map();
            attendances.forEach(a => {
                const sid = String(a.session);
                const list = attBySession.get(sid) || [];
                list.push(a);
                attBySession.set(sid, list);
            });

            sessions.forEach(s => {
                const isCancel = s.type === 'Báo nghỉ';
                const day = s.day ? new Date(s.day) : null;
                const inDay = dayStart ? (!!day && day >= dayStart && day < dayEnd) : false;
                const isToday = !!day && day >= todayStart && day < todayEnd;

                if (isCancel) {
                    if (history) {
                    } else if (dayStart) {
                        if (!inDay) return;
                    } else {
                        if (!day || day < todayStart || day >= windowEnd) return;
                    }
                } else {
                    if (history) return;
                    if (dayStart) {
                        if (!inDay) return;
                    } else {
                        if (!isToday) return;
                    }
                }

                const course = courseMap.get(String(s.course));
                const areaName = course?.Area?.name || 'Khác';
                const sessionAtts = attBySession.get(String(s._id)) || [];

                rows.push({
                    kind: isCancel ? 'cancel' : 'today',
                    courseId: course ? String(course._id) : (s.course ? String(s.course) : ''),
                    courseID: course?.ID || s.courseCode || '',
                    courseName: course?.Name || course?.ID || s.courseCode || '',
                    areaName,
                    detailId: String(s._id),
                    day: s.day || null,
                    time: s.time || '',
                    room: s.room ? String(s.room) : '',
                    reason: s.note || '',
                    statusType: s.type || '',
                    teacher: s.teacher ? String(s.teacher) : null,
                    students: (course?.Student || []).map(st => st.ID).filter(Boolean),
                    lesson: isCancel ? null : buildLessonData(course, s._id, sessionAtts),
                });
            });
        } else {
            const courses = await Course.find({
                $or: [
                    { 'Detail.Type': 'Báo nghỉ' },
                    { 'Detail.Day': { $gte: todayStart, $lt: todayEnd } },
                ],
            })
                .populate('Area', 'name')
                .lean();

            courses.forEach(course => {
                ;(course.Detail || []).forEach(d => {
                    const isCancel = d.Type === 'Báo nghỉ'
                    const day = d.Day ? new Date(d.Day) : null
                    const inDay = dayStart ? (!!day && day >= dayStart && day < dayEnd) : false
                    const isToday = !!day && day >= todayStart && day < todayEnd

                    if (isCancel) {
                        if (history) {
                            // hiển thị toàn bộ lịch sử lớp nghỉ
                        } else if (dayStart) {
                            if (!inDay) return
                        } else {
                            if (!day || day < todayStart || day >= windowEnd) return
                        }
                    } else {
                        if (history) return
                        if (dayStart) {
                            if (!inDay) return
                        } else {
                            if (!isToday) return
                        }
                    }
                    rows.push({
                        kind: isCancel ? 'cancel' : 'today',
                        courseId: String(course._id),
                        courseID: course.ID,
                        courseName: course.Name || course.ID,
                        areaName: course.Area?.name || 'Khác',
                        detailId: String(d._id),
                        day,
                        reason: d.Note || '',
                        teacher: d.Teacher ? String(d.Teacher) : null,
                        students: (course.Student || []).map(s => s.ID).filter(Boolean),
                        lesson: isCancel ? null : buildLessonData(course, d),
                    })
                })
            })
        }

        rows.sort((a, b) => (a.day ? a.day - 0 : 0) - (b.day ? b.day - 0 : 0))

        const allStudentIds = [...new Set(rows.flatMap(c => c.students))]
        const students = allStudentIds.length
            ? await Student.find({ ID: { $in: allStudentIds } })
                .select('ID Name ParentName Phone Uid Avt')
                .lean()
            : []
        const studentById = new Map(students.map(s => [String(s.ID), s]))

        const teacherIds = [...new Set(rows.map(c => c.teacher).filter(Boolean))]
        const teachers = teacherIds.length
            ? await User.find({ _id: { $in: teacherIds } }).select('name').lean()
            : []
        const teacherMap = new Map(teachers.map(t => [String(t._id), t.name || '']))

        const detailIds = rows.map(c => c.detailId).filter(id => mongoose.isValidObjectId(id))
        const notifies = detailIds.length
            ? await LessonNotify.find({ detailId: { $in: detailIds } }).lean()
            : []
        const notifyByDetail = new Map(notifies.map(n => [String(n.detailId), n]))

        const confirmUserIds = [...new Set(notifies.flatMap(n => (n.confirmations || []).map(cf => cf.by && String(cf.by)).filter(Boolean)))]
        const confirmUsers = confirmUserIds.length
            ? await User.find({ _id: { $in: confirmUserIds } }).select('name').lean()
            : []
        const confirmUserMap = new Map(confirmUsers.map(u => [String(u._id), u.name || '']))

        const grouped = rows.map(c => {
            const rec = notifyByDetail.get(c.detailId)
            return {
                kind: c.kind,
                courseId: c.courseId,
                courseID: c.courseID,
                courseName: c.courseName,
                areaName: c.areaName,
                detailId: c.detailId,
                day: c.day,
                reason: c.reason,
                teacherName: c.teacher ? (teacherMap.get(c.teacher) || '') : '',
                lesson: c.kind === 'today' && c.lesson
                    ? {
                        enrolled: c.lesson.enrolled,
                        rollCallChecked: c.lesson.rollCallChecked,
                        withImage: c.lesson.withImage,
                        withComment: c.lesson.withComment,
                    }
                    : null,
                students: c.students.map(id => {
                    const st = studentById.get(id)
                    const stRec = rec?.students?.find(x => String(x.ID) === String(id))
                    const lrn = c.lesson?.byId[String(id)]
                    return {
                        ID: id,
                        Name: st?.Name || '',
                        ParentName: st?.ParentName || '',
                        Phone: st?.Phone || '',
                        Uid: st?.Uid || '',
                        Avt: st?.Avt || '',
                        checkin: lrn?.checkin ?? 0,
                        cmtfn: lrn?.cmtfn ?? '',
                        images: lrn?.images ?? [],
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
                        pendingQueueCount: Array.isArray(rec.pendingQueue) ? rec.pendingQueue.length : 0,
                        queueResumeAt: rec.queueResumeAt || null,
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
        let lesson = (course?.Detail || []).find(d => String(d._id) === String(detailId))
        if (!lesson) {
            const Session = (await import('@/models/session')).default
            const sess = await Session.findById(detailId).lean()
            if (sess) {
                lesson = {
                    Day: sess.day,
                    Note: sess.note
                }
            }
        }

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
