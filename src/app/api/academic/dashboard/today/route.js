import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import PostCourse from '@/models/course'
import TrialCourse from '@/models/coursetry'
import mongoose from 'mongoose'

function getTodayRange() {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    return { start, end, now }
}

export async function GET() {
    try {
        await connectDB()
        const { start, end, now } = getTodayRange()

        const Session = (await import('@/models/session')).default;
        const Attendance = (await import('@/models/attendance')).default;

        const todaySessions = await Session.find({ day: { $gte: start, $lt: end } }).populate('teacher', 'name').lean();
        let sessions = [];

        if (todaySessions.length > 0) {
            const sessionIds = todaySessions.map(s => s._id);
            const attendances = await Attendance.find({ session: { $in: sessionIds } }).lean();

            const attCountMap = new Map();
            const checkedCountMap = new Map();
            attendances.forEach(a => {
                const k = String(a.session);
                attCountMap.set(k, (attCountMap.get(k) || 0) + 1);
                if (a.checkin > 0) {
                    checkedCountMap.set(k, (checkedCountMap.get(k) || 0) + 1);
                }
            });

            sessions = todaySessions.map(s => ({
                _id: s.course || s._id,
                ID: s.courseCode,
                Name: s.courseCode,
                lessonId: s._id,
                lessonDay: s.day,
                lessonTime: s.time,
                lessonType: s.type,
                lessonNote: s.note,
                teacherName: s.teacher?.name,
                teacherId: s.teacher?._id || s.teacher,
                totalStudents: attCountMap.get(String(s._id)) || 0,
                checkedStudents: checkedCountMap.get(String(s._id)) || 0
            }));
        } else {
            const agg = PostCourse.aggregate([
                { $unwind: '$Detail' },
                { $match: { 'Detail.Day': { $gte: start, $lt: end } } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'Detail.Teacher',
                        foreignField: '_id',
                        as: 'teacher'
                    }
                },
                { $set: { teacher: { $arrayElemAt: ['$teacher', 0] } } },
                {
                    $addFields: {
                        lessonStart: '$Detail.Day',
                        lessonEnd: {
                            $dateAdd: {
                                startDate: '$Detail.Day',
                                unit: 'minute',
                                amount: 90
                            }
                        },
                        studentCount: { $size: { $ifNull: ['$Student', []] } },
                        checkedStudents: {
                            $size: {
                                $filter: {
                                    input: { $ifNull: ['$Student', []] },
                                    as: 'st',
                                    cond: {
                                        $gt: [
                                            { $size: { $ifNull: ['$$st.Learn', []] } },
                                            0
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        ID: 1,
                        Name: 1,
                        lessonId: '$Detail._id',
                        lessonDay: '$Detail.Day',
                        lessonTime: '$Detail.Time',
                        lessonType: '$Detail.Type',
                        lessonNote: '$Detail.Note',
                        teacherName: '$teacher.name',
                        teacherId: '$Detail.Teacher',
                        totalStudents: '$studentCount',
                        checkedStudents: 1
                    }
                }
            ]);

            const trialAgg = TrialCourse.aggregate([
                { $unwind: '$sessions' },
                { $match: { 'sessions.day': { $gte: start, $lt: end } } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'sessions.teacher',
                        foreignField: '_id',
                        as: 'teacher'
                    }
                },
                { $set: { teacher: { $arrayElemAt: ['$teacher', 0] } } },
                {
                    $project: {
                        _id: 1,
                        ID: '$name',
                        Name: '$name',
                        lessonId: '$sessions._id',
                        lessonDay: '$sessions.day',
                        lessonTime: '$sessions.time',
                        lessonType: { $literal: null },
                        lessonNote: { $literal: null },
                        teacherName: '$teacher.name',
                        teacherId: '$sessions.teacher',
                        totalStudents: { $size: { $ifNull: ['$sessions.students', []] } },
                        checkedStudents: {
                            $size: {
                                $filter: {
                                    input: { $ifNull: ['$sessions.students', []] },
                                    as: 'st',
                                    cond: { $eq: ['$$st.checkin', true] }
                                }
                            }
                        }
                    }
                }
            ]);

            const [official, trial] = await Promise.all([agg, trialAgg]);
            sessions = [...official, ...trial];
        }

        let total = sessions.length
        let scheduled = 0, inProgress = 0, ended = 0
        let waitingReport = 0, completed = 0
        let slaWarning = 0, slaViolation = 0

        for (const s of sessions) {
            const startTime = new Date(s.lessonDay)
            const endTime = new Date(startTime.getTime() + 90 * 60 * 1000)

            if (now < startTime) scheduled++
            else if (now >= startTime && now <= endTime) inProgress++
            else {
                ended++
                const hasCheckin = s.checkedStudents > 0
                if (hasCheckin) completed++
                else waitingReport++
            }
        }

        return NextResponse.json({
            date: start.toISOString().split('T')[0],
            total_sessions: total,
            scheduled_sessions: scheduled,
            in_progress_sessions: inProgress,
            ended_sessions: ended,
            waiting_report_sessions: waitingReport,
            completed_sessions: completed,
            sla_warning_sessions: slaWarning,
            sla_violation_sessions: slaViolation,
            open_incidents: 0,
            sessions
        })
    } catch (err) {
        console.error('Academic dashboard today error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
