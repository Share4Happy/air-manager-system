import connectDB from '@/config/connectDB'
import PostCourse from '@/models/course'
import TrialCourse from '@/models/coursetry'
import Student from '@/models/student'
import Invoice from '@/models/invoices'
import ZaloAccount from '@/models/zalo'
import User from '@/models/users'
import Logs from '@/models/log'
import mongoose from 'mongoose'
import ReportConfig from '@/models/reportConfig'
import ReportSetting from '@/models/reportSetting'
import { sendByPhone } from '@/function/zalolite'
import { getStudentRank } from '@/data/database/student'

const TRIAL_ID = '6871bc14ada3650715efc786'

function ReportConfigUpdate(id, update) {
    return ReportConfig.findByIdAndUpdate(id, { $set: update })
}

export function sleep(ms) {
    return new Promise(r => setTimeout(r, ms))
}

export function fmtTime(d) {
    if (!d) return ''
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return ''
    return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

export async function getReportSendSettings() {
    await connectDB()
    let s = await ReportSetting.findOne().lean()
    if (!s) {
        s = { staggerMinMin: 3, staggerMaxMin: 5, hourlyLimit: 30 }
        await ReportSetting.create(s)
    }
    const min = Math.max(1, Number(s.staggerMinMin) || 3)
    return {
        staggerMinMin: min,
        staggerMaxMin: Math.max(min, Number(s.staggerMaxMin) || 5),
        hourlyLimit: Math.max(1, Number(s.hourlyLimit) || 30),
    }
}

export function computeResumeAt(now = new Date()) {
    const d = new Date(now)
    d.setHours(d.getHours() + 1, 30, 0, 0)
    return d
}

export async function countHourlySent(zaloId, now = new Date()) {
    const start = new Date(now)
    start.setMinutes(0, 0, 0)
    return Logs.countDocuments({
        type: { $in: ['sendReport', 'sendCare'] },
        zalo: zaloId,
        createdAt: { $gte: start },
    })
}

function getLastStatus(student) {
    if (!student.Status || student.Status.length === 0) return null
    return student.Status[student.Status.length - 1].status
}

export function fmtNum(n) {
    return new Intl.NumberFormat('vi-VN').format(n || 0)
}

export function fmtDate(d) {
    if (!d) return ''
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return ''
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
}

const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']

function fmtDayHeader(d) {
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return ''
    return `${WEEKDAYS[dt.getDay()]} - ${fmtDate(dt)}`
}

export function parseSendTime(sendTime) {
    const [h, m] = (sendTime || '08:00').split(':').map(Number)
    return {
        hour: Number.isInteger(h) ? h : 8,
        minute: Number.isInteger(m) ? m : 0,
    }
}

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

export function computeNextRunAt({ frequency, sendTime, weekday, monthDay, after = new Date() }) {
    const { hour, minute } = parseSendTime(sendTime);
    const now = new Date(after);
    // Chuyển 'now' sang mốc thời gian Việt Nam (UTC+7)
    const nowVN = new Date(now.getTime() + VN_OFFSET_MS);

    const vnYear = nowVN.getUTCFullYear();
    const vnMonth = nowVN.getUTCMonth();
    const vnDate = nowVN.getUTCDate();
    const vnDay = nowVN.getUTCDay(); // 0 = CN, 1 = T2, ..., 6 = T7

    if (frequency === 'daily') {
        let targetVN = new Date(Date.UTC(vnYear, vnMonth, vnDate, hour, minute, 0, 0));
        let targetUTC = new Date(targetVN.getTime() - VN_OFFSET_MS);

        if (targetUTC <= now) {
            targetVN.setUTCDate(targetVN.getUTCDate() + 1);
            targetUTC = new Date(targetVN.getTime() - VN_OFFSET_MS);
        }
        return targetUTC;
    }

    if (frequency === 'weekly') {
        // weekday: 1 = Thứ 2 ... 7 = Chủ nhật
        const target = weekday >= 1 && weekday <= 7 ? weekday : 1;
        const targetJsDay = target % 7; // 0 = CN, 1 = T2...
        let diff = targetJsDay - vnDay;
        let targetVN = new Date(Date.UTC(vnYear, vnMonth, vnDate + diff, hour, minute, 0, 0));
        let targetUTC = new Date(targetVN.getTime() - VN_OFFSET_MS);

        if (targetUTC <= now) {
            targetVN.setUTCDate(targetVN.getUTCDate() + 7);
            targetUTC = new Date(targetVN.getTime() - VN_OFFSET_MS);
        }
        return targetUTC;
    }

    // monthly
    const targetDay = monthDay >= 1 && monthDay <= 31 ? monthDay : 1;
    let targetVN = new Date(Date.UTC(vnYear, vnMonth, targetDay, hour, minute, 0, 0));
    let targetUTC = new Date(targetVN.getTime() - VN_OFFSET_MS);

    if (targetUTC <= now) {
        targetVN.setUTCMonth(targetVN.getUTCMonth() + 1);
        targetVN.setUTCDate(targetDay);
        targetUTC = new Date(targetVN.getTime() - VN_OFFSET_MS);
    }
    return targetUTC;
}

export function getReportPeriod(cfg, now = new Date()) {
    if (cfg.reportType === 'monthly') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        lastMonth.setDate(0)
        return { year: lastMonth.getFullYear(), month: lastMonth.getMonth() + 1 }
    }
    const start = new Date(now)
    if (cfg.frequency === 'daily') start.setDate(start.getDate() - 1)
    else if (cfg.frequency === 'weekly') start.setDate(start.getDate() - 7)
    else start.setMonth(start.getMonth() - 1)
    return { start, end: now }
}

async function getLessonsInRange(start, end) {
    const officialAgg = PostCourse.aggregate([
        { $unwind: { path: '$Detail', includeArrayIndex: 'lessonIdx' } },
        { $match: { 'Detail.Day': { $gte: start, $lt: end } } },
        { $addFields: { students: { $map: { input: { $filter: { input: '$Student', as: 'st', cond: { $anyElementTrue: [{ $map: { input: '$$st.Learn', as: 'lr', in: { $eq: ['$$lr.Lesson', '$Detail._id'] } } }] } } }, as: 'st', in: { $mergeObjects: ['$$st', { Learn: { $filter: { input: '$$st.Learn', as: 'lr', cond: { $eq: ['$$lr.Lesson', '$Detail._id'] } } } }] } } } } },
        { $lookup: { from: 'books', localField: 'Book', foreignField: '_id', as: 'bk' } },
        { $set: { bk: { $arrayElemAt: ['$bk', 0] } } },
        { $set: { topic: { $arrayElemAt: [{ $filter: { input: '$bk.Topics', as: 'tp', cond: { $eq: ['$$tp._id', '$Detail.Topic'] } } }, 0] } } },
        { $lookup: { from: 'areas', localField: 'Area', foreignField: '_id', as: 'areaDoc' } },
        { $set: { areaName: { $arrayElemAt: ['$areaDoc.name', 0] }, area: '$Area' } },
        { $project: { _id: '$Detail._id', courseId: '$ID', courseName: '$Name', type: { $literal: 'official' }, date: '$Detail.Day', lessonIdx: 1, teacher: '$Detail.Teacher', area: 1, areaName: 1, enrolled: { $size: '$Student' }, image: '$Detail.Image', detailImage: '$Detail.DetailImage', checkin: '$Detail.Checkin', students: '$students' } },
    ])

    const trialAgg = TrialCourse.aggregate([
        { $unwind: { path: '$sessions', includeArrayIndex: 'lessonIdx' } },
        { $match: { 'sessions.day': { $gte: start, $lt: end } } },
        { $project: { _id: '$sessions._id', courseId: '$name', courseName: '$name', type: { $literal: 'trial' }, date: '$sessions.day', lessonIdx: 1, teacher: '$sessions.teacher', area: null, areaName: { $literal: 'Học thử' }, enrolled: { $size: '$sessions.students' }, image: '$sessions.images', detailImage: { $literal: [] }, checkin: '$sessions.checkin', students: '$sessions.students' } },
    ])

    const [official, trial] = await Promise.all([officialAgg, trialAgg])
    return [...official, ...trial].sort((a, b) => new Date(a.date) - new Date(b.date))
}

export async function generateAttendanceReport({ start, end, options }) {
    await connectDB()
    const o = {
        classes: true,
        present: true,
        absent: true,
        lessonCount: false,
        studentTurns: false,
        unchecked: false,
        perClass: true,
        violations: true,
        checkinLate: true,
        ...options,
    }
    if (options && typeof options.absent !== 'boolean'
        && (typeof options.absentWithReason === 'boolean' || typeof options.absentWithoutReason === 'boolean')) {
        o.absent = options.absentWithReason === true || options.absentWithoutReason === true
    }

    const lessons = await getLessonsInRange(start, end)

    const agg = { classes: new Set(), lessonCount: 0, studentTurns: 0, present: 0, absent: 0, unchecked: 0 }
    const rows = []
    const teacherIds = new Set()
    const noCheckin = []
    const noResource = []
    const lateCheckins = []
    const onTimeCheckins = []

    for (const l of lessons) {
        const name = l.courseId || l.courseName || l._id
        if (l.teacher) teacherIds.add(String(l.teacher))
        agg.lessonCount++
        agg.classes.add(name)

        const row = {
            name,
            areaName: l.areaName || 'Khác',
            type: l.type,
            lessonIdx: (Number.isInteger(l.lessonIdx) ? l.lessonIdx : 0) + 1,
            teacher: l.teacher,
            enrolled: l.enrolled || 0,
            present: 0,
            absent: 0,
            unchecked: 0,
        }
        for (const s of l.students || []) {
            agg.studentTurns++
            let present, absent, unchecked
            if (l.type === 'trial') {
                present = s.checkin === true
                unchecked = s.checkin == null
                absent = s.checkin === false
            } else {
                const checkin = s.Learn?.[0]?.Checkin
                present = checkin === 1
                unchecked = checkin === 0 || checkin == null
                absent = checkin === 2 || checkin === 3
            }
            if (present) { agg.present++; row.present++ }
            else if (absent) { agg.absent++; row.absent++ }
            else { agg.unchecked++; row.unchecked++ }
        }
        rows.push(row)

        if (row.enrolled > 0 && row.present + row.absent === 0) noCheckin.push(row)
        const hasImg = (l.image && String(l.image).length > 0) || (Array.isArray(l.detailImage) && l.detailImage.length > 0)
        if (!hasImg) noResource.push(row)
        if (l.checkin?.status === 'tre') lateCheckins.push(row)
        else if (l.checkin?.status === 'dung-gio') onTimeCheckins.push(row)
    }

    const teacherMap = {}
    if (teacherIds.size > 0) {
        const validIds = [...teacherIds].filter(id => mongoose.Types.ObjectId.isValid(id))
        if (validIds.length > 0) {
            const teachers = await User.find({ _id: { $in: validIds } }).select('name').lean()
            teachers.forEach(t => { teacherMap[String(t._id)] = t.name || '' })
        }
    }
    const teacherName = (id) => id ? (teacherMap[String(id)] || '') : ''

    const isSingleDay = (new Date(end).getTime() - new Date(start).getTime()) <= 24 * 60 * 60 * 1000
    const lines = []
    lines.push('BÁO CÁO CHUYÊN CẦN')
    lines.push(isSingleDay ? fmtDayHeader(start) : `Kỳ: ${fmtDate(start)} - ${fmtDate(end)}`)
    lines.push('--------------------------')
    if (o.classes) lines.push(`Tổng số lớp: ${agg.classes.size}`)
    if (o.present) lines.push(`Có mặt: ${agg.present} Học sinh`)
    if (o.absent) lines.push(`Vắng mặt: ${agg.absent} Học sinh`)
    if (o.unchecked) lines.push(`Chưa điểm danh: ${agg.unchecked} Học sinh`)
    if (o.lessonCount) lines.push(`Tổng số buổi học: ${agg.lessonCount}`)
    if (o.studentTurns) lines.push(`Tổng lượt học sinh: ${agg.studentTurns}`)
    lines.push('')

    if (o.perClass && rows.length > 0) {
        lines.push('Chi Tiết:')
        const areaGroups = {}
        rows.forEach(r => {
            if (!areaGroups[r.areaName]) areaGroups[r.areaName] = []
            areaGroups[r.areaName].push(r)
        })
        Object.keys(areaGroups).sort((a, b) => a.localeCompare(b, 'vi')).forEach(area => {
            const list = areaGroups[area].sort((a, b) => a.name.localeCompare(b.name, 'vi'))
            lines.push(`${area}:`)
            for (const r of list) {
                const tn = teacherName(r.teacher)
                lines.push(`• ${r.name}${tn ? ` (${tn})` : ''} : Buổi ${r.lessonIdx} | Sĩ số : ${r.enrolled} | Có mặt : ${r.present} | vắng ${r.absent}`)
            }
        })
    }

    if (o.violations) {
        const noCheckinNames = [...new Set(noCheckin.map(r => teacherName(r.teacher)).filter(Boolean))].join(', ')
        const noResourceNames = [...new Set(noResource.map(r => teacherName(r.teacher)).filter(Boolean))].join(', ')
        lines.push('')
        lines.push('Lỗi vi phạm:')
        lines.push(`Lớp chưa điểm danh: ${noCheckin.length}${noCheckinNames ? ` (${noCheckinNames})` : ''}`)
        lines.push(`Thiếu tài nguyên: ${noResource.length}${noResourceNames ? ` (${noResourceNames})` : ''}`)
    }
    if (o.checkinLate) {
        const lateNames = [...new Set(lateCheckins.map(r => teacherName(r.teacher)).filter(Boolean))]
        const lateLabel = lateNames.length
            ? lateNames.join(', ')
            : [...new Set(lateCheckins.map(r => r.name).filter(Boolean))].join(', ')
        lines.push(`Checkin trễ: ${lateCheckins.length}${lateLabel ? ` (${lateLabel})` : ''}`)
        lines.push(`Checkin đúng giờ: ${onTimeCheckins.length}`)
    }
    lines.push('')
    lines.push('--------------------------')
    return lines.join('\n')
}

async function computeMonthlyStats({ year, month, areas }) {
    await connectDB()
    const start = new Date(Date.UTC(year, month - 1, 1))
    const end = new Date(Date.UTC(year, month, 1))
    const isIn = (dt) => dt && dt >= start && dt < end

    const [invoices, students, trialCourse, courses] = await Promise.all([
        Invoice.find({}).lean(),
        Student.find({}).lean(),
        TrialCourse.findById(TRIAL_ID).lean().catch(() => null),
        PostCourse.find({}).populate('Area').lean(),
    ])

    let tuition = 0
    invoices.forEach(inv => {
        const dt = inv.createdAt ? new Date(inv.createdAt) : new Date(inv._id.getTimestamp())
        if (isIn(dt)) tuition += inv.amountPaid || 0
    })

    let enrollments = 0
    let upgrades = 0
    let quits = 0
    students.forEach(s => {
        const createdDate = s._id ? new mongoose.Types.ObjectId(s._id).getTimestamp() : null
        if (createdDate && isIn(createdDate)) enrollments++
        if (s.Status && s.Status.length > 0) {
            s.Status.forEach(entry => {
                if (!entry.date) return
                const dt = new Date(entry.date)
                if (!isIn(dt)) return
                if (entry.status === 2) {
                    if (createdDate && dt.getTime() - createdDate.getTime() > 3 * 24 * 60 * 60 * 1000) upgrades++
                } else if (entry.status === 0) {
                    quits++
                }
            })
        }
    })

    const trialIds = new Set()
    const sessions = Array.isArray(trialCourse?.sessions) ? trialCourse.sessions : []
    sessions.forEach(s => {
        if (!s.day) return
        const dt = new Date(s.day)
        if (isIn(dt)) {
            ;(s.students || []).forEach(st => {
                if (st.studentId) trialIds.add(String(st.studentId))
            })
        }
    })

    const studentById = new Map(students.map(s => [String(s._id), s]))
    const studentByBusId = new Map(students.map(s => [String(s.ID), s]))
    let trialEnrolled = 0
    trialIds.forEach(id => {
        const st = studentById.get(id)
        if (st && getLastStatus(st) === 2) trialEnrolled++
    })

    const rankMap = {}
    students.forEach(s => {
        if (getLastStatus(s) !== 2) return
        const createdAt = s._id ? new mongoose.Types.ObjectId(s._id).getTimestamp() : null
        const courseCount = s.Course?.length ?? 0
        const rank = getStudentRank(createdAt, courseCount)
        if (!rankMap[rank.name]) rankMap[rank.name] = { level: rank.level, name: rank.name, count: 0 }
        rankMap[rank.name].count++
    })
    const studentsByRank = Object.values(rankMap).sort((a, b) => a.level - b.level)

    const areaSet = areas && areas.length > 0 ? new Set(areas.map(String)) : null
    const areaMap = {}
    courses.forEach(c => {
        const type = (c.Type || '').toLowerCase()
        if (type.includes('thử')) return
        if (areaSet) {
            const areaId = c.Area?._id ? String(c.Area._id) : ''
            if (!areaSet.has(areaId)) return
        }
        const hasSession = Array.isArray(c.Detail) && c.Detail.some(d => {
            const day = new Date(d.Day)
            return !isNaN(day) && day >= start && day < end
        })
        if (!hasSession) return
        const areaId = c.Area?._id ? String(c.Area._id) : 'other'
        if (!areaMap[areaId]) areaMap[areaId] = { id: areaId, name: c.Area?.name || 'Khác', completed: [], inProgress: [] }
        const activeCount = (c.Student || []).filter(s => {
            const st = studentByBusId.get(s.ID)
            return st && getLastStatus(st) === 2
        }).length
        const cls = { name: c.ID || c.Name || 'Chưa đặt tên', students: activeCount }
        if (c.Status) areaMap[areaId].completed.push(cls)
        else areaMap[areaId].inProgress.push(cls)
    })
    const classesByArea = Object.values(areaMap).sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    classesByArea.forEach(a => {
        a.completed.sort((x, y) => y.students - x.students)
        a.inProgress.sort((x, y) => y.students - x.students)
    })

    return {
        tuition,
        enrollments,
        upgrades,
        quits,
        trialCount: trialIds.size,
        trialEnrolled,
        studentsByRank,
        classesByArea,
    }
}

export async function generateMonthlyReport({ year, month, options }) {
    await connectDB()
    const o = {
        tuition: true,
        enrollments: true,
        quits: true,
        upgrades: true,
        classesByArea: true,
        studentRank: true,
        trialCount: true,
        trialRate: true,
        comparePrevMonth: false,
        ...options,
    }
    if (options && typeof options.completions === 'boolean') o.quits = options.completions

    const stats = await computeMonthlyStats({ year, month, areas: o.areas || [] })

    const lines = []
    lines.push('BÁO CÁO THỐNG KÊ THÁNG')
    lines.push(`Tháng ${month}/${year}`)
    lines.push('==========================')
    lines.push('')
    lines.push('I. TÀI CHÍNH')
    if (o.tuition) lines.push(`• Học phí thu: ${fmtNum(stats.tuition)} đ`)
    lines.push('')
    lines.push('II. HỌC SINH')
    if (o.enrollments) lines.push(`• Học sinh mới: ${stats.enrollments}`)
    if (o.upgrades) lines.push(`• Học sinh lên khóa: ${stats.upgrades}`)
    if (o.quits) lines.push(`• Học sinh nghỉ: ${stats.quits}`)
    if (o.studentRank) {
        const rankText = stats.studentsByRank.length
            ? stats.studentsByRank.map(r => `${r.name} ${r.count}`).join(' | ')
            : '0'
        lines.push(`• Học sinh theo xếp hạng (đang học): ${rankText}`)
    }
    lines.push('')
    lines.push('III. HỌC THỬ')
    if (o.trialCount) lines.push(`• Lượt học thử: ${stats.trialCount}`)
    if (o.trialRate) {
        const rate = stats.trialCount > 0 ? Math.round((stats.trialEnrolled / stats.trialCount) * 1000) / 10 : 0
        lines.push(`• Nhập học sau học thử: ${stats.trialEnrolled}/${stats.trialCount} (${rate}%)`)
    }

    const totalActive = stats.classesByArea.reduce((sum, a) => sum + a.inProgress.length, 0)
    const totalDone = stats.classesByArea.reduce((sum, a) => sum + a.completed.length, 0)
    if (o.classesByArea) {
        lines.push('')
        lines.push('IV. LỚP HỌC')
        lines.push(`• Tổng: ${totalActive} lớp đang diễn ra, ${totalDone} lớp đã hoàn thành`)
        for (const area of stats.classesByArea) {
            const active = area.inProgress.filter(c => c.students > 0).slice(0, 10)
            const done = area.completed.filter(c => c.students > 0).slice(0, 10)
            if (active.length === 0 && done.length === 0) continue
            lines.push(`Khu vực ${area.name}:`)
            for (const c of active) lines.push(`• ${c.name} (${c.students} hs) [đang diễn ra]`)
            for (const c of done) lines.push(`• ${c.name} (${c.students} hs) [hoàn thành]`)
            const moreActive = area.inProgress.filter(c => c.students > 0).length - active.length
            const moreDone = area.completed.filter(c => c.students > 0).length - done.length
            if (moreActive > 0) lines.push(`• …và ${moreActive} lớp đang diễn ra khác`)
            if (moreDone > 0) lines.push(`• …và ${moreDone} lớp đã hoàn thành khác`)
        }
    }

    if (o.comparePrevMonth) {
        const prevDate = new Date(Date.UTC(year, month - 2, 1))
        const prev = await computeMonthlyStats({ year: prevDate.getUTCFullYear(), month: prevDate.getUTCMonth() + 1, areas: o.areas || [] })
        const prevActive = prev.classesByArea.reduce((sum, a) => sum + a.inProgress.length, 0)
        const prevRankTotal = prev.studentsByRank.reduce((sum, r) => sum + r.count, 0)
        const rankTotal = stats.studentsByRank.reduce((sum, r) => sum + r.count, 0)
        lines.push('')
        lines.push('SO SÁNH VỚI THÁNG TRƯỚC')
        if (o.tuition) lines.push(`• Học phí thu: ${fmtNum(prev.tuition)} đ → ${fmtNum(stats.tuition)} đ`)
        if (o.enrollments) lines.push(`• Học sinh mới: ${prev.enrollments} → ${stats.enrollments}`)
        if (o.upgrades) lines.push(`• Học sinh lên khóa: ${prev.upgrades} → ${stats.upgrades}`)
        if (o.quits) lines.push(`• Học sinh nghỉ: ${prev.quits} → ${stats.quits}`)
        if (o.trialCount) lines.push(`• Lượt học thử: ${prev.trialCount} → ${stats.trialCount}`)
        if (o.trialRate) lines.push(`• Nhập học sau học thử: ${prev.trialEnrolled} → ${stats.trialEnrolled}`)
        if (o.studentRank) lines.push(`• Học sinh xếp hạng (đang học): ${prevRankTotal} → ${rankTotal}`)
        if (o.classesByArea) lines.push(`• Lớp đang diễn ra: ${prevActive} → ${totalActive}`)
    }
    return lines.join('\n')
}

export function normalizeMessageText(text) {
    return (text || '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

export async function renderReportTemplate(template, { body = '', period = '', date = '' } = {}) {
    if (!template) return body
    let message = template
    message = message.replace(/{body}/g, body)
    message = message.replace(/{period}/g, period)
    message = message.replace(/{date}/g, date)
    return message
}

export async function executeReportConfig(cfg) {
    await connectDB()
    const now = new Date()
    const settings = await getReportSendSettings()
    const ids = Array.isArray(cfg.recipientUserIds) && cfg.recipientUserIds.length
        ? cfg.recipientUserIds
        : (cfg.recipientUserId ? [cfg.recipientUserId] : [])
    const [recipients, zalo] = await Promise.all([
        User.find({ _id: { $in: ids } }).select('name phone').lean(),
        ZaloAccount.findById(cfg.zaloAccountId).lean(),
    ])
    if (!zalo || !zalo.botId) throw new Error('Tài khoản Zalo chưa có botId (ZaloLite).')

    const pendingQueue = Array.isArray(cfg.pendingQueue) ? cfg.pendingQueue : []
    const resumeMode = pendingQueue.length > 0
    const queueDue = resumeMode && (!cfg.queueResumeAt || new Date(cfg.queueResumeAt) <= now)

    if (resumeMode && !queueDue) {
        return {
            status: false,
            queued: true,
            message: `Tin báo cáo đang trong hàng chờ do giới hạn tin/giờ, sẽ tiếp tục gửi lúc ${fmtTime(cfg.queueResumeAt)}.`,
        }
    }

    let targets
    if (resumeMode && queueDue) {
        targets = pendingQueue.filter(t => t && t.phone).map(t => ({ phone: t.phone, name: t.name || '' }))
    } else {
        const withPhone = recipients.filter(r => r && r.phone)
        if (withPhone.length === 0) throw new Error('Người nhận báo cáo không có số điện thoại.')
        targets = withPhone.map(r => ({ phone: r.phone, name: r.name || '' }))
    }
    if (targets.length === 0) {
        await ReportConfigUpdate(cfg._id, { pendingQueue: [], queueResumeAt: null, pendingText: '' })
        return { status: true, message: 'Không còn tin nào trong hàng chờ.' }
    }

    let text = cfg.pendingText || ''
    if (!text) {
        const period = getReportPeriod(cfg, now)
        let body
        if (cfg.reportType === 'attendance') {
            body = await generateAttendanceReport({ start: period.start, end: period.end, options: cfg.reportOptions?.attendance })
        } else {
            body = await generateMonthlyReport({ year: period.year, month: period.month, options: cfg.reportOptions?.monthly })
        }
        const periodLabel = cfg.reportType === 'monthly'
            ? `Tháng ${period.month}/${period.year}`
            : `${fmtDate(period.start)} - ${fmtDate(period.end)}`
        text = normalizeMessageText(await renderReportTemplate(cfg.messageTemplate || '{body}', {
            body,
            period: periodLabel,
            date: fmtDate(now),
        }))
    }

    const zaloId = zalo._id || cfg.zaloAccountId
    const limit = settings.hourlyLimit
    const attempted = []
    const queuedTargets = []
    const batchId = new mongoose.Types.ObjectId().toString()
    let blocked = false

    for (let i = 0; i < targets.length; i++) {
        if (i > 0) {
            const delayMin = settings.staggerMinMin + Math.random() * (settings.staggerMaxMin - settings.staggerMinMin)
            await sleep(Math.round(delayMin * 60 * 1000))
        }
        const sentCount = await countHourlySent(zaloId)
        if (sentCount >= limit) {
            blocked = true
            queuedTargets.push(...targets.slice(i))
            break
        }
        const target = targets[i]
        let ok = false
        let errMsg = ''
        try {
            const resp = await sendByPhone(zalo.botId, { phone: target.phone, text, mode: 'safe' })
            if (resp.async) {
                ok = true
            } else if (Array.isArray(resp.data?.results)) {
                const r = resp.data.results[0] || {}
                ok = r.status === 'success'
                errMsg = r.error_message || r.message || ''
            } else {
                ok = resp.data?.success !== false
            }
        } catch (err) {
            ok = false
            errMsg = err?.message || 'Lỗi gửi tin nhắn'
        }
        attempted.push({ target, ok, errMsg })
        await Logs.create({
            status: {
                status: ok,
                message: ok ? 'Gửi báo cáo thành công' : (errMsg || 'Gửi báo cáo thất bại'),
                data: {
                    error_code: ok ? 0 : -1,
                    error_message: ok ? '' : errMsg,
                    message: text,
                    recipients: [target.phone],
                    recipientNames: [target.name || ''],
                    batchId,
                },
            },
            type: 'sendReport',
            createBy: cfg.createdBy || ids[0] || null,
            zalo: cfg.zaloAccountId,
            schedule: null,
        })
    }

    if (blocked) {
        const resumeAt = computeResumeAt()
        await ReportConfigUpdate(cfg._id, {
            pendingQueue: queuedTargets.map(t => ({ phone: t.phone, name: t.name })),
            pendingText: text,
            queueResumeAt: resumeAt,
            nextRunAt: resumeAt,
        })
        return {
            status: false,
            queued: true,
            message: `Đạt giới hạn tin nhắn trong giờ (${limit} tin/giờ). ${queuedTargets.length} tin còn lại trong hàng chờ, sẽ tiếp tục gửi lúc ${fmtTime(resumeAt)}.`,
        }
    }

    if (resumeMode) {
        await ReportConfigUpdate(cfg._id, { pendingQueue: [], pendingText: '', queueResumeAt: null })
    }

    const failed = attempted.filter(a => !a.ok)
    const success = failed.length === 0
    return {
        status: success,
        message: success
            ? `Đã gửi báo cáo cho ${attempted.length} người nhận.`
            : `Gửi báo cáo thất bại ${failed.length}/${attempted.length}. ${failed.map(a => a.errMsg).filter(Boolean).join('; ')}`.trim(),
    }
}

export async function prepareReportSend(cfg) {
    await connectDB()
    const now = new Date()
    const ids = Array.isArray(cfg.recipientUserIds) && cfg.recipientUserIds.length
        ? cfg.recipientUserIds
        : (cfg.recipientUserId ? [cfg.recipientUserId] : [])
    const [recipients, zalo] = await Promise.all([
        User.find({ _id: { $in: ids } }).select('name phone').lean(),
        ZaloAccount.findById(cfg.zaloAccountId).lean(),
    ])
    if (!zalo || !zalo.botId) throw new Error('Tài khoản Zalo chưa có botId (ZaloLite).')
    const withPhone = recipients.filter(r => r && r.phone)
    if (withPhone.length === 0) throw new Error('Người nhận báo cáo không có số điện thoại.')
    const targets = withPhone.map(r => ({ phone: r.phone, name: r.name || '' }))

    const period = getReportPeriod(cfg, now)
    let body
    if (cfg.reportType === 'attendance') {
        body = await generateAttendanceReport({ start: period.start, end: period.end, options: cfg.reportOptions?.attendance })
    } else {
        body = await generateMonthlyReport({ year: period.year, month: period.month, options: cfg.reportOptions?.monthly })
    }
    const periodLabel = cfg.reportType === 'monthly'
        ? `Tháng ${period.month}/${period.year}`
        : `${fmtDate(period.start)} - ${fmtDate(period.end)}`
    const text = normalizeMessageText(await renderReportTemplate(cfg.messageTemplate || '{body}', {
        body,
        period: periodLabel,
        date: fmtDate(now),
    }))

    return {
        zaloName: zalo.name || '',
        botId: zalo.botId,
        zaloId: String(zalo._id || cfg.zaloAccountId),
        createBy: cfg.createdBy ? String(cfg.createdBy) : null,
        targets,
        text,
    }
}

export async function sendSingleReport({ botId, zaloId, createBy, target, text }) {
    text = normalizeMessageText(text)
    let ok = false
    let errMsg = ''
    try {
        const resp = await sendByPhone(botId, { phone: target.phone, text, mode: 'safe' })
        if (resp.async) {
            ok = true
        } else if (Array.isArray(resp.data?.results)) {
            const r = resp.data.results[0] || {}
            ok = r.status === 'success'
            errMsg = r.error_message || r.message || ''
        } else {
            ok = resp.data?.success !== false
        }
    } catch (err) {
        ok = false
        errMsg = err?.message || 'Lỗi gửi tin nhắn'
    }
    await Logs.create({
        status: {
            status: ok,
            message: ok ? 'Gửi báo cáo thành công' : (errMsg || 'Gửi báo cáo thất bại'),
            data: {
                error_code: ok ? 0 : -1,
                error_message: ok ? '' : errMsg,
                message: text,
                recipients: [target.phone],
                recipientNames: [target.name || ''],
                batchId: new mongoose.Types.ObjectId().toString(),
            },
        },
        type: 'sendReport',
        createBy,
        zalo: zaloId,
        schedule: null,
    })
    return { ok, errMsg }
}
