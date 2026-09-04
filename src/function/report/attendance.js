import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import TrialCourse from '@/models/coursetry';
import User from '@/models/users';
import mongoose from 'mongoose';
import { fmtDate, fmtDayHeader } from './datetime';

export async function getLessonsInRange(start, end) {
    const Session = (await import('@/models/session')).default;
    const Attendance = (await import('@/models/attendance')).default;
    const Course = (await import('@/models/course')).default;

    const sessions = await Session.find({ day: { $gte: start, $lt: end } })
        .populate('topic', 'Name')
        .lean();

    if (sessions.length > 0) {
        const sessionIds = sessions.map(s => s._id);
        const courseIds = [...new Set(sessions.map(s => s.course).filter(Boolean))];

        const [attendances, courses] = await Promise.all([
            Attendance.find({ session: { $in: sessionIds } })
                .select('session studentId checkin absenceReason note images')
                .lean(),
            Course.find({ _id: { $in: courseIds } })
                .select('Name Area')
                .populate('Area', 'name')
                .lean(),
        ]);

        const courseMap = new Map();
        courses.forEach(c => courseMap.set(String(c._id), c));

        const attBySession = new Map();
        attendances.forEach(a => {
            const sid = String(a.session);
            if (!attBySession.has(sid)) attBySession.set(sid, []);
            attBySession.get(sid).push({
                ID: a.studentId,
                Learn: [{
                    Lesson: a.session,
                    Checkin: a.checkin,
                    absenceReason: a.absenceReason,
                    Note: a.note,
                    Image: a.images,
                }],
            });
        });

        return sessions.map(s => {
            const c = courseMap.get(String(s.course));
            const isTrial = s.type === 'Học thử' || !s.course;
            return {
                _id: s._id,
                courseId: s.courseCode,
                courseName: c?.Name || s.courseCode,
                type: isTrial ? 'trial' : 'official',
                sessionType: s.type || 'Chính khóa',
                note: s.note || '',
                date: s.day,
                lessonIdx: (s.buoi || 1) - 1,
                teacher: s.teacher,
                area: c?.Area?._id || null,
                areaName: isTrial ? 'Học thử' : (c?.Area?.name || 'Khác'),
                enrolled: attBySession.get(String(s._id))?.length || 0,
                image: s.image,
                detailImage: s.detailImage || [],
                checkin: s.checkin,
                students: attBySession.get(String(s._id)) || [],
            };
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    const officialAgg = PostCourse.aggregate([
        { $unwind: { path: '$Detail', includeArrayIndex: 'lessonIdx' } },
        { $match: { 'Detail.Day': { $gte: start, $lt: end } } },
        { $addFields: { students: { $map: { input: { $filter: { input: { $ifNull: ['$Student', []] }, as: 'st', cond: { $anyElementTrue: [{ $map: { input: { $ifNull: ['$$st.Learn', []] }, as: 'lr', in: { $eq: ['$$lr.Lesson', '$Detail._id'] } } }] } } }, as: 'st', in: { $mergeObjects: ['$$st', { Learn: { $filter: { input: { $ifNull: ['$$st.Learn', []] }, as: 'lr', cond: { $eq: ['$$lr.Lesson', '$Detail._id'] } } } }] } } } } },
        { $lookup: { from: 'books', localField: 'Book', foreignField: '_id', as: 'bk' } },
        { $set: { bk: { $arrayElemAt: ['$bk', 0] } } },
        { $set: { topic: { $arrayElemAt: [{ $filter: { input: { $ifNull: ['$bk.Topics', []] }, as: 'tp', cond: { $eq: ['$$tp._id', '$Detail.Topic'] } } }, 0] } } },
        { $lookup: { from: 'areas', localField: 'Area', foreignField: '_id', as: 'areaDoc' } },
        { $set: { areaName: { $arrayElemAt: ['$areaDoc.name', 0] }, area: '$Area' } },
        { $project: { _id: '$Detail._id', courseId: '$ID', courseName: '$Name', type: { $literal: 'official' }, sessionType: { $ifNull: ['$Detail.Type', 'Chính khóa'] }, note: { $ifNull: ['$Detail.Note', ''] }, date: '$Detail.Day', lessonIdx: 1, teacher: '$Detail.Teacher', area: 1, areaName: 1, enrolled: { $size: { $ifNull: ['$Student', []] } }, image: '$Detail.Image', detailImage: '$Detail.DetailImage', checkin: '$Detail.Checkin', students: '$students' } },
    ]);

    const trialAgg = TrialCourse.aggregate([
        { $unwind: { path: '$sessions', includeArrayIndex: 'lessonIdx' } },
        { $match: { 'sessions.day': { $gte: start, $lt: end } } },
        { $project: { _id: '$sessions._id', courseId: '$name', courseName: '$name', type: { $literal: 'trial' }, sessionType: { $literal: 'Học thử' }, note: { $literal: '' }, date: '$sessions.day', lessonIdx: 1, teacher: '$sessions.teacher', area: null, areaName: { $literal: 'Học thử' }, enrolled: { $size: { $ifNull: ['$sessions.students', []] } }, image: '$sessions.images', detailImage: { $literal: [] }, checkin: '$sessions.checkin', students: '$sessions.students' } },
    ]);

    const [official, trial] = await Promise.all([officialAgg, trialAgg]);
    return [...official, ...trial].sort((a, b) => new Date(a.date) - new Date(b.date));
}

export async function buildAttendanceReportData({ start, end, options }) {
    await connectDB();
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
    };
    if (options && typeof options.absent !== 'boolean'
        && (typeof options.absentWithReason === 'boolean' || typeof options.absentWithoutReason === 'boolean')) {
        o.absent = options.absentWithReason === true || options.absentWithoutReason === true;
    }

    const lessons = await getLessonsInRange(start, end);

    const agg = {
        allClasses: new Set(),
        activeClasses: new Set(),
        cancelledClasses: new Set(),
        lessonCount: 0,
        activeLessonCount: 0,
        cancelledLessonCount: 0,
        studentTurns: 0,
        present: 0,
        excused: 0,
        absent: 0,
        unchecked: 0,
    };
    const rows = [];
    const cancelledRows = [];
    const teacherIds = new Set();
    const noCheckin = [];
    const noResource = [];
    const lateCheckins = [];
    const onTimeCheckins = [];

    for (const l of lessons) {
        const name = l.courseId || l.courseName || l._id;
        if (l.teacher) teacherIds.add(String(l.teacher));
        agg.lessonCount++;
        agg.allClasses.add(name);

        const isCancelled = l.sessionType === 'Báo nghỉ' || l.type === 'Báo nghỉ';

        if (isCancelled) {
            agg.cancelledClasses.add(name);
            agg.cancelledLessonCount++;
            cancelledRows.push({
                name,
                areaName: l.areaName || 'Khác',
                lessonIdx: (Number.isInteger(l.lessonIdx) ? l.lessonIdx : 0) + 1,
                teacher: l.teacher,
                note: l.note || 'Báo nghỉ',
            });
            continue;
        }

        agg.activeClasses.add(name);
        agg.activeLessonCount++;

        const row = {
            name,
            areaName: l.areaName || 'Khác',
            type: l.type,
            lessonIdx: (Number.isInteger(l.lessonIdx) ? l.lessonIdx : 0) + 1,
            teacher: l.teacher,
            enrolled: l.enrolled || 0,
            present: 0,
            excused: 0,
            absent: 0,
            unchecked: 0,
        };
        for (const s of l.students || []) {
            agg.studentTurns++;
            let present, excused, absent, unchecked;
            if (l.type === 'trial') {
                present = s.checkin === true;
                unchecked = s.checkin == null;
                absent = s.checkin === false;
                excused = false;
            } else {
                const checkin = s.Learn?.[0]?.Checkin;
                present = checkin === 1;
                excused = checkin === 2;
                absent = checkin === 3;
                unchecked = checkin === 0 || checkin == null;
            }
            if (present) { agg.present++; row.present++; }
            else if (excused) { agg.excused++; row.excused++; }
            else if (absent) { agg.absent++; row.absent++; }
            else { agg.unchecked++; row.unchecked++; }
        }
        rows.push(row);

        if (row.enrolled > 0 && row.present + row.excused + row.absent === 0) noCheckin.push(row);
        const hasImg = (l.image && String(l.image).length > 0) || (Array.isArray(l.detailImage) && l.detailImage.length > 0);
        if (!hasImg) noResource.push(row);
        if (l.checkin?.status === 'tre') lateCheckins.push(row);
        else if (l.checkin?.status === 'dung-gio') onTimeCheckins.push(row);
    }

    const teacherMap = {};
    if (teacherIds.size > 0) {
        const validIds = [...teacherIds].filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validIds.length > 0) {
            const teachers = await User.find({ _id: { $in: validIds } }).select('name').lean();
            teachers.forEach(t => { teacherMap[String(t._id)] = t.name || ''; });
        }
    }
    const teacherName = (id) => id ? (teacherMap[String(id)] || '') : '';

    const isSingleDay = (new Date(end).getTime() - new Date(start).getTime()) <= 24 * 60 * 60 * 1000 + 1000;
    const lines = [];
    lines.push('BÁO CÁO CHUYÊN CẦN');
    lines.push(isSingleDay ? fmtDayHeader(start) : `Kỳ: ${fmtDate(start)} - ${fmtDate(new Date(new Date(end).getTime() - 1000))}`);
    lines.push('--------------------------');
    if (o.classes) {
        if (agg.cancelledClasses.size > 0) {
            lines.push(`Tổng số lớp: ${agg.allClasses.size} (Học: ${agg.activeClasses.size} | Báo nghỉ: ${agg.cancelledClasses.size})`);
        } else {
            lines.push(`Tổng số lớp: ${agg.allClasses.size}`);
        }
    }
    if (o.present) lines.push(`Có mặt: ${agg.present} Học sinh`);
    if (agg.excused > 0) lines.push(`Xin nghỉ: ${agg.excused} Học sinh`);
    if (o.absent) lines.push(`Vắng mặt: ${agg.absent} Học sinh`);
    if (o.unchecked) lines.push(`Chưa điểm danh: ${agg.unchecked} Học sinh`);
    if (o.lessonCount) lines.push(`Tổng số buổi học: ${agg.activeLessonCount || agg.lessonCount}`);
    if (o.studentTurns) lines.push(`Tổng lượt học sinh: ${agg.studentTurns}`);
    lines.push('');

    const detailLines = [];
    if (rows.length > 0) {
        const areaGroups = {};
        rows.forEach(r => {
            if (!areaGroups[r.areaName]) areaGroups[r.areaName] = [];
            areaGroups[r.areaName].push(r);
        });
        Object.keys(areaGroups).sort((a, b) => a.localeCompare(b, 'vi')).forEach(area => {
            const list = areaGroups[area].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
            detailLines.push(`${area}:`);
            for (const r of list) {
                const tn = teacherName(r.teacher);
                let attStr = `Có mặt : ${r.present}`;
                if (r.excused > 0) attStr += ` | Xin nghỉ : ${r.excused}`;
                attStr += ` | Vắng : ${r.absent}`;
                detailLines.push(`• ${r.name}${tn ? ` (${tn})` : ''} : Buổi ${r.lessonIdx} | Sĩ số : ${r.enrolled} | ${attStr}`);
            }
        });
    }

    if (o.perClass && detailLines.length > 0) {
        lines.push('Chi Tiết:');
        lines.push(...detailLines);
    }

    const cancelledDetailLines = [];
    if (cancelledRows.length > 0) {
        const areaGroups = {};
        cancelledRows.forEach(r => {
            if (!areaGroups[r.areaName]) areaGroups[r.areaName] = [];
            areaGroups[r.areaName].push(r);
        });
        Object.keys(areaGroups).sort((a, b) => a.localeCompare(b, 'vi')).forEach(area => {
            const list = areaGroups[area].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
            cancelledDetailLines.push(`${area}:`);
            for (const r of list) {
                const tn = teacherName(r.teacher);
                const reason = r.note ? ` - Lý do: ${r.note}` : '';
                cancelledDetailLines.push(`• ${r.name}${tn ? ` (${tn})` : ''} : Buổi ${r.lessonIdx}${reason}`);
            }
        });
    }

    if (cancelledDetailLines.length > 0) {
        lines.push('');
        lines.push('Lớp Báo Nghỉ:');
        lines.push(...cancelledDetailLines);
    }

    const noCheckinNames = [...new Set(noCheckin.map(r => teacherName(r.teacher)).filter(Boolean))].join(', ');
    const noResourceNames = [...new Set(noResource.map(r => teacherName(r.teacher)).filter(Boolean))].join(', ');
    const violationsLines = [
        `Lớp chưa điểm danh: ${noCheckin.length}${noCheckinNames ? ` (${noCheckinNames})` : ''}`,
        `Thiếu tài nguyên: ${noResource.length}${noResourceNames ? ` (${noResourceNames})` : ''}`,
    ];

    const trialRows = rows.filter(r => r.type === 'trial');
    const officialRows = rows.filter(r => r.type === 'official');
    const trialClasses = new Set(trialRows.map(r => r.name));
    const officialClasses = new Set(officialRows.map(r => r.name));

    const trialDetailLines = [];
    if (trialRows.length > 0) {
        for (const r of trialRows) {
            const tn = teacherName(r.teacher);
            let attStr = `Có mặt : ${r.present}`;
            if (r.excused > 0) attStr += ` | Xin nghỉ : ${r.excused}`;
            attStr += ` | Vắng : ${r.absent}`;
            trialDetailLines.push(`• ${r.name}${tn ? ` (${tn})` : ''} : Buổi ${r.lessonIdx} | Sĩ số : ${r.enrolled} | ${attStr}`);
        }
    }

    if (o.violations) {
        lines.push('');
        lines.push('Lỗi vi phạm:');
        lines.push(...violationsLines);
    }

    const lateNames = [...new Set(lateCheckins.map(r => teacherName(r.teacher)).filter(Boolean))];
    const lateLabel = lateNames.length
        ? lateNames.join(', ')
        : [...new Set(lateCheckins.map(r => r.name).filter(Boolean))].join(', ');

    if (o.checkinLate) {
        lines.push(`Checkin trễ: ${lateCheckins.length}${lateLabel ? ` (${lateLabel})` : ''}`);
        lines.push(`Checkin đúng giờ: ${onTimeCheckins.length}`);
    }
    lines.push('');
    lines.push('--------------------------');

    const fullText = lines.join('\n');

    const variables = {
        tong_so_lop: String(agg.allClasses.size),
        so_lop: String(agg.allClasses.size),
        total_classes: String(agg.allClasses.size),
        so_lop_hoc: String(agg.activeClasses.size),
        active_classes: String(agg.activeClasses.size),
        so_lop_nghi: String(agg.cancelledClasses.size),
        lop_bao_nghi: String(agg.cancelledClasses.size),
        cancelled_classes: String(agg.cancelledClasses.size),
        so_lop_hoc_thu: String(trialClasses.size),
        lop_hoc_thu: String(trialClasses.size),
        trial_classes: String(trialClasses.size),
        so_lop_chinh_khoa: String(officialClasses.size),
        co_mat: `${agg.present} Học sinh`,
        co_mat_so: String(agg.present),
        present: `${agg.present} Học sinh`,
        xin_nghi: `${agg.excused} Học sinh`,
        xin_nghi_so: String(agg.excused),
        excused: `${agg.excused} Học sinh`,
        vang_mat: `${agg.absent} Học sinh`,
        vang_mat_so: String(agg.absent),
        absent: `${agg.absent} Học sinh`,
        chua_diem_danh: `${agg.unchecked} Học sinh`,
        chua_diem_danh_so: String(agg.unchecked),
        unchecked: `${agg.unchecked} Học sinh`,
        tong_buoi: String(agg.lessonCount),
        lesson_count: String(agg.lessonCount),
        so_buoi_hoc: String(agg.activeLessonCount),
        so_buoi_nghi: String(agg.cancelledLessonCount),
        tong_luot_hs: String(agg.studentTurns),
        student_turns: String(agg.studentTurns),
        chi_tiet_lop: detailLines.length > 0 ? detailLines.join('\n') : 'Không có lớp học trong kỳ.',
        class_details: detailLines.length > 0 ? detailLines.join('\n') : 'Không có lớp học trong kỳ.',
        chi_tiet_lop_nghi: cancelledDetailLines.length > 0 ? cancelledDetailLines.join('\n') : 'Không có lớp báo nghỉ.',
        cancelled_class_details: cancelledDetailLines.length > 0 ? cancelledDetailLines.join('\n') : 'Không có lớp báo nghỉ.',
        chi_tiet_hoc_thu: trialDetailLines.length > 0 ? trialDetailLines.join('\n') : 'Không có lớp học thử trong kỳ.',
        trial_class_details: trialDetailLines.length > 0 ? trialDetailLines.join('\n') : 'Không có lớp học thử trong kỳ.',
        vi_pham: violationsLines.join('\n'),
        violations: violationsLines.join('\n'),
        checkin_tre: `${lateCheckins.length}${lateLabel ? ` (${lateLabel})` : ''}`,
        checkin_late: `${lateCheckins.length}${lateLabel ? ` (${lateLabel})` : ''}`,
        checkin_dung_gio: String(onTimeCheckins.length),
        checkin_ontime: String(onTimeCheckins.length),
        body: fullText,
    };

    return {
        fullText,
        variables,
        classCount: agg.allClasses.size,
        lessonCount: agg.lessonCount,
    };
}

export async function generateAttendanceReport({ start, end, options }) {
    const res = await buildAttendanceReportData({ start, end, options });
    return res.fullText;
}
