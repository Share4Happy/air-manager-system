import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import TrialCourse from '@/models/coursetry';
import Student from '@/models/student';
import Invoice from '@/models/invoices';
import mongoose from 'mongoose';
import { getStudentRank } from '@/data/database/student';
import { fmtNum } from './datetime';

const TRIAL_ID = '6871bc14ada3650715efc786';

export function getLastStatus(student) {
    if (!student.Status || student.Status.length === 0) return null;
    return student.Status[student.Status.length - 1].status;
}

export async function computeMonthlyStats({ year, month, areas }) {
    await connectDB();
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    const isIn = (dt) => dt && dt >= start && dt < end;

    const [invoices, students, trialCourse, courses] = await Promise.all([
        Invoice.find({}).select('createdAt amountPaid _id').lean(),
        Student.find({}).select('ID Status Course createdAt _id').lean(),
        TrialCourse.findById(TRIAL_ID).select('sessions').lean().catch(() => null),
        PostCourse.find({}).select('ID Name Type Area Detail Student Status').populate('Area', 'name').lean(),
    ]);

    let tuition = 0;
    invoices.forEach(inv => {
        const dt = inv.createdAt ? new Date(inv.createdAt) : new Date(inv._id.getTimestamp());
        if (isIn(dt)) tuition += inv.amountPaid || 0;
    });

    let enrollments = 0;
    let upgrades = 0;
    let quits = 0;
    students.forEach(s => {
        const createdDate = s.createdAt
            ? new Date(s.createdAt)
            : (s._id ? new mongoose.Types.ObjectId(s._id).getTimestamp() : null);
        if (createdDate && isIn(createdDate)) enrollments++;
        if (s.Status && s.Status.length > 0) {
            s.Status.forEach(entry => {
                if (!entry.date) return;
                const dt = new Date(entry.date);
                if (!isIn(dt)) return;
                if (entry.status === 2) {
                    if (createdDate && dt.getTime() - createdDate.getTime() > 3 * 24 * 60 * 60 * 1000) upgrades++;
                } else if (entry.status === 0) {
                    quits++;
                }
            });
        }
    });

    const trialIds = new Set();
    const sessions = Array.isArray(trialCourse?.sessions) ? trialCourse.sessions : [];
    sessions.forEach(s => {
        if (!s.day) return;
        const dt = new Date(s.day);
        if (isIn(dt)) {
            (s.students || []).forEach(st => {
                if (st.studentId) trialIds.add(String(st.studentId));
            });
        }
    });

    const studentById = new Map(students.map(s => [String(s._id), s]));
    const studentByBusId = new Map(students.map(s => [String(s.ID), s]));
    let trialEnrolled = 0;
    trialIds.forEach(id => {
        const st = studentById.get(id);
        if (st && getLastStatus(st) === 2) trialEnrolled++;
    });

    const rankMap = {};
    students.forEach(s => {
        if (getLastStatus(s) !== 2) return;
        const createdAt = s.createdAt
            ? new Date(s.createdAt)
            : (s._id ? new mongoose.Types.ObjectId(s._id).getTimestamp() : null);
        const courseCount = s.Course?.length ?? 0;
        const rank = getStudentRank(createdAt, courseCount);
        if (!rankMap[rank.name]) rankMap[rank.name] = { level: rank.level, name: rank.name, count: 0 };
        rankMap[rank.name].count++;
    });
    const studentsByRank = Object.values(rankMap).sort((a, b) => a.level - b.level);

    const areaSet = areas && areas.length > 0 ? new Set(areas.map(String)) : null;
    const areaMap = {};
    courses.forEach(c => {
        const type = (c.Type || '').toLowerCase();
        if (type.includes('thử')) return;
        if (areaSet) {
            const areaId = c.Area?._id ? String(c.Area._id) : '';
            if (!areaSet.has(areaId)) return;
        }
        const hasSession = Array.isArray(c.Detail) && c.Detail.some(d => {
            const day = new Date(d.Day);
            return !isNaN(day) && day >= start && day < end;
        });
        if (!hasSession) return;
        const areaId = c.Area?._id ? String(c.Area._id) : 'other';
        if (!areaMap[areaId]) areaMap[areaId] = { id: areaId, name: c.Area?.name || 'Khác', completed: [], inProgress: [] };
        const activeCount = (c.Student || []).filter(s => {
            const st = studentByBusId.get(s.ID);
            return st && getLastStatus(st) === 2;
        }).length;
        const cls = { name: c.ID || c.Name || 'Chưa đặt tên', students: activeCount };
        if (c.Status) areaMap[areaId].completed.push(cls);
        else areaMap[areaId].inProgress.push(cls);
    });
    const classesByArea = Object.values(areaMap).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    classesByArea.forEach(a => {
        a.completed.sort((x, y) => y.students - x.students);
        a.inProgress.sort((x, y) => y.students - x.students);
    });

    return {
        tuition,
        enrollments,
        upgrades,
        quits,
        trialCount: trialIds.size,
        trialEnrolled,
        studentsByRank,
        classesByArea,
    };
}

export async function buildMonthlyReportData({ year, month, options }) {
    await connectDB();
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
    };
    if (options && typeof options.completions === 'boolean') o.quits = options.completions;

    const stats = await computeMonthlyStats({ year, month, areas: o.areas || [] });

    const lines = [];
    lines.push('BÁO CÁO THỐNG KÊ THÁNG');
    lines.push(`Tháng ${month}/${year}`);
    lines.push('==========================');
    lines.push('');
    lines.push('I. TÀI CHÍNH');
    if (o.tuition) lines.push(`• Học phí thu: ${fmtNum(stats.tuition)} đ`);
    lines.push('');
    lines.push('II. HỌC SINH');
    if (o.enrollments) lines.push(`• Học sinh mới: ${stats.enrollments}`);
    if (o.upgrades) lines.push(`• Học sinh lên khóa: ${stats.upgrades}`);
    if (o.quits) lines.push(`• Học sinh nghỉ: ${stats.quits}`);
    const rankText = stats.studentsByRank.length
        ? stats.studentsByRank.map(r => `${r.name} ${r.count}`).join(' | ')
        : '0';
    if (o.studentRank) {
        lines.push(`• Học sinh theo xếp hạng (đang học): ${rankText}`);
    }
    lines.push('');
    lines.push('III. HỌC THỬ');
    if (o.trialCount) lines.push(`• Lượt học thử: ${stats.trialCount}`);
    const rate = stats.trialCount > 0 ? Math.round((stats.trialEnrolled / stats.trialCount) * 1000) / 10 : 0;
    if (o.trialRate) {
        lines.push(`• Nhập học sau học thử: ${stats.trialEnrolled}/${stats.trialCount} (${rate}%)`);
    }

    const totalActive = stats.classesByArea.reduce((sum, a) => sum + a.inProgress.length, 0);
    const totalDone = stats.classesByArea.reduce((sum, a) => sum + a.completed.length, 0);
    const classesLines = [];
    classesLines.push(`• Tổng: ${totalActive} lớp đang diễn ra, ${totalDone} lớp đã hoàn thành`);
    for (const area of stats.classesByArea) {
        const active = area.inProgress.filter(c => c.students > 0).slice(0, 10);
        const done = area.completed.filter(c => c.students > 0).slice(0, 10);
        if (active.length === 0 && done.length === 0) continue;
        classesLines.push(`Khu vực ${area.name}:`);
        for (const c of active) classesLines.push(`• ${c.name} (${c.students} hs) [đang diễn ra]`);
        for (const c of done) classesLines.push(`• ${c.name} (${c.students} hs) [hoàn thành]`);
        const moreActive = area.inProgress.filter(c => c.students > 0).length - active.length;
        const moreDone = area.completed.filter(c => c.students > 0).length - done.length;
        if (moreActive > 0) classesLines.push(`• …và ${moreActive} lớp đang diễn ra khác`);
        if (moreDone > 0) classesLines.push(`• …và ${moreDone} lớp đã hoàn thành khác`);
    }

    if (o.classesByArea) {
        lines.push('');
        lines.push('IV. LỚP HỌC');
        lines.push(...classesLines);
    }

    let compareLines = [];
    try {
        const prevDate = new Date(Date.UTC(year, month - 2, 1));
        const prev = await computeMonthlyStats({ year: prevDate.getUTCFullYear(), month: prevDate.getUTCMonth() + 1, areas: o.areas || [] });
        const prevActive = prev.classesByArea.reduce((sum, a) => sum + a.inProgress.length, 0);
        const prevRankTotal = prev.studentsByRank.reduce((sum, r) => sum + r.count, 0);
        const rankTotal = stats.studentsByRank.reduce((sum, r) => sum + r.count, 0);
        compareLines = [
            'SO SÁNH VỚI THÁNG TRƯỚC',
            `• Học phí thu: ${fmtNum(prev.tuition)} đ → ${fmtNum(stats.tuition)} đ`,
            `• Học sinh mới: ${prev.enrollments} → ${stats.enrollments}`,
            `• Học sinh lên khóa: ${prev.upgrades} → ${stats.upgrades}`,
            `• Học sinh nghỉ: ${prev.quits} → ${stats.quits}`,
            `• Lượt học thử: ${prev.trialCount} → ${stats.trialCount}`,
            `• Nhập học sau học thử: ${prev.trialEnrolled} → ${stats.trialEnrolled}`,
            `• Học sinh xếp hạng (đang học): ${prevRankTotal} → ${rankTotal}`,
            `• Lớp đang diễn ra: ${prevActive} → ${totalActive}`,
        ];
        if (o.comparePrevMonth !== false) {
            lines.push('');
            lines.push(...compareLines);
        }
    } catch (e) {
        console.error('Compute prev month stats error:', e);
    }

    const fullText = lines.join('\n');

    const variables = {
        hoc_phi: `${fmtNum(stats.tuition)} đ`,
        tuition: `${fmtNum(stats.tuition)} đ`,
        hs_moi: String(stats.enrollments),
        enrollments: String(stats.enrollments),
        hs_len_khoa: String(stats.upgrades),
        upgrades: String(stats.upgrades),
        hs_nghi: String(stats.quits),
        quits: String(stats.quits),
        xep_hang_hs: rankText,
        student_rank: rankText,
        luot_hoc_thu: String(stats.trialCount),
        trial_count: String(stats.trialCount),
        nhap_hoc_thu: String(stats.trialEnrolled),
        trial_enrolled: String(stats.trialEnrolled),
        ti_le_hoc_thu: `${rate}%`,
        trial_rate: `${rate}%`,
        lop_theo_khu_vuc: classesLines.join('\n'),
        classes_by_area: classesLines.join('\n'),
        so_sanh_thang_truoc: compareLines.length > 0 ? compareLines.join('\n') : 'Chưa bật so sánh với tháng trước.',
        compare_prev_month: compareLines.length > 0 ? compareLines.join('\n') : 'Chưa bật so sánh với tháng trước.',
        body: fullText,
    };

    return {
        fullText,
        variables,
        classCount: stats.classesByArea.reduce((sum, a) => sum + a.inProgress.length + a.completed.length, 0),
    };
}

export async function generateMonthlyReport({ year, month, options }) {
    const res = await buildMonthlyReportData({ year, month, options });
    return res.fullText;
}
