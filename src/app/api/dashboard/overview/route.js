import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import Student from '@/models/student'
import Course from '@/models/course'
import Invoice from '@/models/invoices'
import Area from '@/models/area'
import TrialCourse from '@/models/coursetry'
import mongoose from 'mongoose'
import { getStudentRank } from '@/data/database/student'

const TRIAL_ID = '6871bc14ada3650715efc786'

function getLastStatus(student) {
    if (!student.Status || student.Status.length === 0) return null
    return student.Status[student.Status.length - 1].status
}

function computeAge(birthDate) {
    if (!birthDate) return null
    const bd = new Date(birthDate)
    if (isNaN(bd.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - bd.getFullYear()
    const m = today.getMonth() - bd.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--
    return age
}

function getPeriodKey(date, period) {
    const d = new Date(date)
    const y = d.getFullYear()
    if (period === 'year') return `${y}`
    const m = d.getMonth() + 1
    if (period === 'quarter') {
        const q = Math.ceil(m / 3)
        return `${y}-Q${q}`
    }
    return `${y}-${String(m).padStart(2, '0')}`
}

function isDateInRange(date, fromMonth, toMonth, fromQuarter, toQuarter, fromYear, toYear, period) {
    const d = new Date(date)
    const y = d.getFullYear()
    if (y < fromYear || y > toYear) return false
    if (period === 'year') return true
    const m = d.getMonth() + 1
    if (period === 'quarter') {
        const q = Math.ceil(m / 3)
        if (y === fromYear && q < fromQuarter) return false
        if (y === toYear && q > toQuarter) return false
        if (y > fromYear && y < toYear) return true
        return true
    }
    if (period === 'month') {
        if (y === fromYear && m < fromMonth) return false
        if (y === toYear && m > toMonth) return false
        if (y > fromYear && y < toYear) return true
        return true
    }
    return true
}

export async function GET(request) {
    try {
        await connectDB()
        const { searchParams } = new URL(request.url)
        const areaId = searchParams.get('areaId')
        const classId = searchParams.get('classId')
        const statusFilter = searchParams.get('status')
        const period = searchParams.get('period') || 'month'

        const now = new Date()
        const cy = now.getFullYear()
        const cm = now.getMonth() + 1

        const fromYear = parseInt(searchParams.get('fromYear')) || cy
        const toYear = parseInt(searchParams.get('toYear')) || cy
        const fromMonth = parseInt(searchParams.get('fromMonth')) || 1
        const toMonth = parseInt(searchParams.get('toMonth')) || cm
        const fromQuarter = parseInt(searchParams.get('fromQuarter')) || 1
        const toQuarter = parseInt(searchParams.get('toQuarter')) || Math.ceil(cm / 3)

        const allStudents = await Student.find({}).lean()
        let allCourses = await Course.find({}).populate('Area').lean()
        const allInvoices = await Invoice.find({}).lean()

        if (areaId) {
            allCourses = allCourses.filter(c => String(c.Area?._id || c.Area) === areaId)
        }

        let courses = [...allCourses]

        if (classId) {
            courses = courses.filter(c => classId.split(',').includes(String(c._id)))
        }

        const validStudentIds = new Set()
        courses.forEach(c => c.Student?.forEach(s => validStudentIds.add(s.ID)))

        let students = allStudents.filter(s => validStudentIds.has(s.ID))

        if (statusFilter) {
            const statusNum = parseInt(statusFilter)
            if (!isNaN(statusNum)) {
                students = students.filter(s => getLastStatus(s) === statusNum)
            }
        }

        const totalStudents = allStudents.length

        const ages = allStudents.map(s => computeAge(s.BD)).filter(a => a != null && !isNaN(a))
        const avgAge = ages.length > 0 ? Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 10) / 10 : null

        // Compute rank for every student
        const studentRanks = allStudents.map(s => {
            const createdAt = s._id ? new mongoose.Types.ObjectId(s._id).getTimestamp() : null
            const courseCount = s.Course?.length ?? 0
            return getStudentRank(createdAt, courseCount)
        })
        const byRank = {}
        studentRanks.forEach(r => {
            const key = r.level
            if (!byRank[key]) byRank[key] = { level: key, name: r.name, color: r.color, bg: r.bg, count: 0 }
            byRank[key].count++
        })
        const studentsByRank = Object.values(byRank).sort((a, b) => a.level - b.level)

        const totalTuition = allInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0)
        const totalTuitionInitial = allInvoices.reduce((sum, inv) => sum + (inv.amountInitial || 0), 0)
        const totalClasses = courses.length

        const classCountMap = {}
        courses.forEach(c => {
            let count = 0
            if (c.Student?.length) {
                c.Student.forEach(s => {
                    const student = allStudents.find(st => st.ID === s.ID)
                    if (student) {
                        const createdDate = student._id ? new mongoose.Types.ObjectId(student._id).getTimestamp() : null
                        if (!createdDate || isDateInRange(createdDate, fromMonth, toMonth, fromQuarter, toQuarter, fromYear, toYear, period)) {
                            count++
                        }
                    }
                })
            }
            if (count > 0) {
                const name = c.ID || c._id?.toString() || 'Unknown'
                classCountMap[name] = (classCountMap[name] || 0) + count
            }
        })
        let studentsByClass = Object.entries(classCountMap).map(([className, count]) => ({ className, count }))
        studentsByClass.sort((a, b) => b.count - a.count)

        const studentsInPeriod = students.filter(s => {
            const cd = s._id ? new mongoose.Types.ObjectId(s._id).getTimestamp() : null
            return cd && isDateInRange(cd, fromMonth, toMonth, fromQuarter, toQuarter, fromYear, toYear, period)
        })
        const statusLabels = { 2: 'Đang học', 1: 'Đang chờ xếp lớp', 0: 'Kết thúc' }
        const statusCount = { 2: 0, 1: 0, 0: 0 }
        studentsInPeriod.forEach(s => {
            const st = getLastStatus(s)
            if (st !== null && st in statusCount) statusCount[st]++
        })
        let studentsByStatus = Object.entries(statusCount).map(([code, count]) => ({
            status: statusLabels[code] || `Unknown (${code})`,
            code: parseInt(code),
            count
        }))

        function buildPeriods() {
            if (period === 'year') {
                const result = []
                for (let y = fromYear; y <= toYear; y++) {
                    result.push({ key: `${y}`, label: `${y}`, year: y })
                }
                return result
            }
            if (period === 'quarter') {
                const result = []
                for (let y = fromYear; y <= toYear; y++) {
                    const qStart = y === fromYear ? fromQuarter : 1
                    const qEnd = y === toYear ? toQuarter : 4
                    for (let q = qStart; q <= qEnd; q++) {
                        result.push({ key: `${y}-Q${q}`, label: `Q${q} ${y}`, year: y, quarter: q })
                    }
                }
                return result
            }
            const result = []
            for (let y = fromYear; y <= toYear; y++) {
                const mStart = y === fromYear ? fromMonth : 1
                const mEnd = y === toYear ? toMonth : 12
                const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
                for (let m = mStart; m <= mEnd; m++) {
                    const key = `${y}-${String(m).padStart(2, '0')}`
                    result.push({ key, label: `${monthNames[m - 1]} ${y}`, year: y, month: m })
                }
            }
            return result
        }

        const periods = buildPeriods()

        // --- Trial course metrics ---
        const trialCourse = await TrialCourse.findById(TRIAL_ID).lean().catch(() => null)
        const trialSessions = Array.isArray(trialCourse?.sessions) ? trialCourse.sessions : []

        const trialStudentsByMonth = {}
        const trialParticipantIds = new Set()
        trialSessions.forEach(s => {
            if (!s.day) return
            const dt = new Date(s.day)
            if (isNaN(dt.getTime())) return
            if (!isDateInRange(dt, fromMonth, toMonth, fromQuarter, toQuarter, fromYear, toYear, period)) return
            const key = getPeriodKey(dt, period)
            if (!trialStudentsByMonth[key]) trialStudentsByMonth[key] = new Set()
            ;(s.students || []).forEach(st => {
                if (st.studentId && mongoose.Types.ObjectId.isValid(st.studentId)) {
                    trialStudentsByMonth[key].add(String(st.studentId))
                    trialParticipantIds.add(String(st.studentId))
                }
            })
        })
        const trialStudentsByPeriod = periods.map(p => ({
            ...p,
            count: trialStudentsByMonth[p.key] ? trialStudentsByMonth[p.key].size : 0,
        }))

        const trialStudents = trialParticipantIds.size > 0
            ? await Student.find(
                { _id: { $in: [...trialParticipantIds].map(id => new mongoose.Types.ObjectId(id)) } },
                { Trial: 1 }
            ).lean()
            : []

        let trialEnrolled = 0
        let trialNotEnrolled = 0
        trialStudents.forEach(st => {
            const entries = Array.isArray(st.Trial) ? st.Trial : []
            if (!entries.length) return
            const latest = entries[entries.length - 1]
            if (latest?.status === 2) trialEnrolled++
            else trialNotEnrolled++
        })
        const trialEnrollment = { enrolled: trialEnrolled, notEnrolled: trialNotEnrolled }

        const tuitionMap = {}
        allInvoices.forEach(inv => {
            const dt = inv.createdAt || inv._id.getTimestamp()
            if (isDateInRange(dt, fromMonth, toMonth, fromQuarter, toQuarter, fromYear, toYear, period)) {
                const key = getPeriodKey(dt, period)
                tuitionMap[key] = (tuitionMap[key] || 0) + (inv.amountPaid || 0)
            }
        })
        const monthlyTuition = periods.map(p => ({ ...p, total: tuitionMap[p.key] || 0 }))

        const enrollmentMap = {}
        const waitingMap = {}
        const upgradeMap = {}
        students.forEach(s => {
            const createdDate = s._id ? new mongoose.Types.ObjectId(s._id).getTimestamp() : null
            if (createdDate && isDateInRange(createdDate, fromMonth, toMonth, fromQuarter, toQuarter, fromYear, toYear, period)) {
                const key = getPeriodKey(createdDate, period)
                enrollmentMap[key] = (enrollmentMap[key] || 0) + 1
            }
            if (s.Status && s.Status.length > 0) {
                s.Status.forEach((entry, idx) => {
                    if (entry.date) {
                        const dt = new Date(entry.date)
                        if (isDateInRange(dt, fromMonth, toMonth, fromQuarter, toQuarter, fromYear, toYear, period)) {
                            const key = getPeriodKey(dt, period)
                            if (entry.status === 1) {
                                if (idx > 0) waitingMap[key] = (waitingMap[key] || 0) + 1
                            } else if (entry.status === 2) {
                                if (createdDate && dt.getTime() - createdDate.getTime() > 3 * 24 * 60 * 60 * 1000) {
                                    upgradeMap[key] = (upgradeMap[key] || 0) + 1
                                }
                            }
                        }
                    }
                })
            }
        })
        const monthlyEnrollments = periods.map(p => ({ ...p, count: enrollmentMap[p.key] || 0 }))
        const monthlyWaiting = periods.map(p => ({ ...p, count: waitingMap[p.key] || 0 }))
        const monthlyUpgrades = periods.map(p => ({ ...p, count: upgradeMap[p.key] || 0 }))

        const completionMap = {}
        students.forEach(s => {
            if (s.Status && s.Status.length > 0) {
                const completedEntry = s.Status.find(entry => entry.status === 0)
                if (completedEntry && completedEntry.date) {
                    const dt = new Date(completedEntry.date)
                    if (isDateInRange(dt, fromMonth, toMonth, fromQuarter, toQuarter, fromYear, toYear, period)) {
                        const key = getPeriodKey(dt, period)
                        completionMap[key] = (completionMap[key] || 0) + 1
                    }
                }
            }
        })
        const monthlyCompletions = periods.map(p => ({ ...p, count: completionMap[p.key] || 0 }))

        // --- Courses in-progress vs completed per period ---
        const courseStatusMap = {}
        courses.forEach(c => {
            const dt = c._id.getTimestamp()
            if (isDateInRange(dt, fromMonth, toMonth, fromQuarter, toQuarter, fromYear, toYear, period)) {
                const key = getPeriodKey(dt, period)
                if (!courseStatusMap[key]) courseStatusMap[key] = { active: 0, completed: 0 }
                if (c.Status) courseStatusMap[key].completed++
                else courseStatusMap[key].active++
            }
        })
        const coursesByStatus = periods.map(p => ({
            ...p,
            active: courseStatusMap[p.key]?.active || 0,
            completed: courseStatusMap[p.key]?.completed || 0,
        }))
        const activeCourses = courses.filter(c => !c.Status).length
        const completedCourses = courses.filter(c => c.Status).length

        const classOptions = allCourses.map(c => ({ _id: c._id, name: c.ID || 'Unknown' }))

        const allAreas = await Area.find({}).lean()
        const areaOptions = allAreas.map(a => ({ _id: a._id, name: a.name }))

        const yearOptions = []
        for (let y = now.getFullYear(); y >= 2020; y--) yearOptions.push(y)

        const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }))
        const quarterOptions = [
            { value: 1, label: 'Q1 (T1-T3)' },
            { value: 2, label: 'Q2 (T4-T6)' },
            { value: 3, label: 'Q3 (T7-T9)' },
            { value: 4, label: 'Q4 (T10-T12)' },
        ]

        // --- Growth computation (compare current period vs prior year) ---
        const priorFromYear = fromYear - 1
        const priorToYear = toYear - 1

        function filterByPeriod(studentList, courseList, theClassId, theStatusFilter, pFromMonth, pToMonth, pFromQuarter, pToQuarter, pFromYear, pToYear, thePeriod) {
            let c = [...courseList]
            if (theClassId) {
                c = c.filter(crs => theClassId.split(',').includes(String(crs._id)))
            }
            const ids = new Set()
            c.forEach(crs => crs.Student?.forEach(st => ids.add(st.ID)))
            let s = studentList.filter(st => ids.has(st.ID))
            if (theStatusFilter) {
                const sn = parseInt(theStatusFilter)
                if (!isNaN(sn)) s = s.filter(st => getLastStatus(st) === sn)
            }
            s = s.filter(st => {
                const cd = st._id ? new mongoose.Types.ObjectId(st._id).getTimestamp() : null
                return cd && isDateInRange(cd, pFromMonth, pToMonth, pFromQuarter, pToQuarter, pFromYear, pToYear, thePeriod)
            })
            return s
        }

        const filteredStudentsArr = filterByPeriod(allStudents, allCourses, classId, statusFilter, fromMonth, toMonth, fromQuarter, toQuarter, fromYear, toYear, period)
        const growthStudents = filteredStudentsArr.length
        const priorGrowthStudents = filterByPeriod(allStudents, allCourses, classId, statusFilter, fromMonth, toMonth, fromQuarter, toQuarter, priorFromYear, priorToYear, period).length
        const filteredAges = filteredStudentsArr.map(s => computeAge(s.BD)).filter(a => a != null && !isNaN(a))
        const filteredAvgAge = filteredAges.length > 0 ? Math.round((filteredAges.reduce((a, b) => a + b, 0) / filteredAges.length) * 10) / 10 : null

        const priorFilteredStudentsArr = filterByPeriod(allStudents, allCourses, classId, statusFilter, fromMonth, toMonth, fromQuarter, toQuarter, priorFromYear, priorToYear, period)
        const priorFilteredAges = priorFilteredStudentsArr.map(s => computeAge(s.BD)).filter(a => a != null && !isNaN(a))
        const priorFilteredAvgAge = priorFilteredAges.length > 0 ? Math.round((priorFilteredAges.reduce((a, b) => a + b, 0) / priorFilteredAges.length) * 10) / 10 : null

        const growthTuition = allInvoices.reduce((sum, inv) => {
            const dt = inv.createdAt || inv._id.getTimestamp()
            return isDateInRange(dt, fromMonth, toMonth, fromQuarter, toQuarter, fromYear, toYear, period) ? sum + (inv.amountPaid || 0) : sum
        }, 0)
        const priorGrowthTuition = allInvoices.reduce((sum, inv) => {
            const dt = inv.createdAt || inv._id.getTimestamp()
            return isDateInRange(dt, fromMonth, toMonth, fromQuarter, toQuarter, priorFromYear, priorToYear, period) ? sum + (inv.amountPaid || 0) : sum
        }, 0)

        function countClassesInRange(courseList, studentList, theClassId, pFromMonth, pToMonth, pFromQuarter, pToQuarter, pFromYear, pToYear, thePeriod) {
            let c = [...courseList]
            if (theClassId) c = c.filter(crs => theClassId.split(',').includes(String(crs._id)))
            let count = 0
            c.forEach(crs => {
                const hasStudent = crs.Student?.some(s => {
                    const st = studentList.find(x => x.ID === s.ID)
                    if (st) {
                        const cd = st._id ? new mongoose.Types.ObjectId(st._id).getTimestamp() : null
                        return cd && isDateInRange(cd, pFromMonth, pToMonth, pFromQuarter, pToQuarter, pFromYear, pToYear, thePeriod)
                    }
                    return false
                })
                if (hasStudent) count++
            })
            return count
        }
        const growthClasses = countClassesInRange(allCourses, allStudents, classId, fromMonth, toMonth, fromQuarter, toQuarter, fromYear, toYear, period)
        const priorGrowthClasses = countClassesInRange(allCourses, allStudents, classId, fromMonth, toMonth, fromQuarter, toQuarter, priorFromYear, priorToYear, period)

        const growth = {
            totalStudents: priorGrowthStudents > 0 ? Math.round((growthStudents - priorGrowthStudents) / priorGrowthStudents * 1000) / 10 : null,
            totalTuition: priorGrowthTuition > 0 ? Math.round((growthTuition - priorGrowthTuition) / priorGrowthTuition * 1000) / 10 : null,
            totalClasses: priorGrowthClasses > 0 ? Math.round((growthClasses - priorGrowthClasses) / priorGrowthClasses * 1000) / 10 : null,
            avgAge: (filteredAvgAge != null && priorFilteredAvgAge != null && priorFilteredAvgAge > 0) ? Math.round((filteredAvgAge - priorFilteredAvgAge) / priorFilteredAvgAge * 1000) / 10 : null,
        }

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalStudents,
                    avgAge: Math.round(avgAge * 10) / 10,
                    totalTuition,
                    totalTuitionInitial,
                    totalClasses,
                    filteredStudents: growthStudents,
                    filteredAvgAge,
                    filteredTuition: growthTuition,
                    filteredClasses: growthClasses,
                    activeCourses: courses.filter(c => !c.Status).length,
                    completedCourses: courses.filter(c => c.Status).length,
                    growth,
                },
                studentsByClass,
                studentsByStatus,
                studentsByRank,
                monthlyTuition,
                monthlyEnrollments,
                monthlyWaiting,
                monthlyUpgrades,
                monthlyCompletions,
                coursesByStatus,
                trialStudentsByPeriod,
                trialEnrollment,
                classOptions,
                areaOptions,
                yearOptions,
                monthOptions,
                quarterOptions,
            }
        })
    } catch (error) {
        console.error('Dashboard overview error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
