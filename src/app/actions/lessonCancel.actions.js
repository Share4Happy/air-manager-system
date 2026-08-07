'use server';
import connectDB from '@/config/connectDB';
import Course from '@/models/course';
import Student from '@/models/student';
import User from '@/models/users';
import ZaloAccount from '@/models/zalo';
import LessonNotify from '@/models/lessonNotify';
import Logs from '@/models/log';
import checkAuthToken from '@/utils/checktoken';
import { user_data } from '@/data/actions/get';
import { getReportSendSettings, countHourlySent, sleep, fmtDate } from '@/function/report';
import { sendByPhone } from '@/function/zalolite';
import { getEportfolioUrl } from '@/utils/env';
import { srcImage } from '@/function/index';

function checkinText(code) {
    if (code === 1) return 'Có mặt';
    if (code === 2) return 'Xin nghỉ';
    if (code === 3) return 'Vắng mặt';
    return 'Chưa điểm danh';
}

function renderCareTemplate(content, vars) {
    return String(content).replace(/\{(\w+)\}/g, (m, key) => {
        const val = vars[key];
        return val === undefined || val === null ? m : String(val);
    });
}

async function requireAdminSale() {
    const user = await checkAuthToken();
    if (!user || !user.id) return { ok: false, message: 'Bạn cần đăng nhập.' };
    if (!user.role?.includes('Admin') && !user.role?.includes('Sale')) {
        return { ok: false, message: 'Bạn không có quyền thực hiện chức năng này.' };
    }
    return { ok: true, user };
}

async function runCancelSendLoop({ courseId, detailId, recipients, message, zaloId, zalo, createBy }) {
    const settings = await getReportSendSettings();
    let rec = await LessonNotify.findOne({ course: courseId, detailId });
    let sent = 0;
    for (let i = 0; i < recipients.length; i++) {
        if (i > 0) {
            const delayMin = settings.staggerMinMin + Math.random() * (settings.staggerMaxMin - settings.staggerMinMin);
            await sleep(Math.round(delayMin * 60 * 1000));
        }
        const sentCount = await countHourlySent(zaloId);
        if (sentCount >= settings.hourlyLimit) break;
        const r = recipients[i];
        let ok = false;
        let errMsg = '';
        try {
            const text = renderCareTemplate(message, r.vars);
            const resp = await sendByPhone(zalo.botId, { phone: r.phone, text, mode: 'safe' });
            if (resp.async) {
                ok = true;
            } else if (Array.isArray(resp.data?.results)) {
                const rr = resp.data.results[0] || {};
                ok = rr.status === 'success';
                errMsg = rr.error_message || rr.message || '';
            } else {
                ok = resp.data?.success !== false;
            }
        } catch (err) {
            ok = false;
            errMsg = err?.message || 'Lỗi gửi tin nhắn';
        }
        sent++;
        if (!rec) {
            rec = await LessonNotify.findOne({ course: courseId, detailId });
        }
        if (rec) {
            const idx = rec.students.findIndex(x => String(x.ID) === String(r.ID));
            const st = { ID: r.ID, status: 'pending', zaloStatus: ok ? 'sent' : 'failed', zaloAt: new Date() };
            if (idx >= 0) {
                rec.students[idx].zaloStatus = ok ? 'sent' : 'failed';
                rec.students[idx].zaloAt = new Date();
            } else {
                rec.students.push(st);
            }
            await rec.save();
        }
        try {
            await Logs.create({
                status: {
                    status: ok,
                    message: ok ? 'Đã gửi thông báo nghỉ' : (errMsg || 'Gửi thông báo nghỉ thất bại'),
                    data: {
                        error_code: ok ? 0 : -1,
                        error_message: ok ? '' : errMsg,
                        message: renderCareTemplate(message, r.vars),
                        recipients: [r.phone],
                    },
                },
                type: 'sendCare',
                createBy,
                student: r._id,
                zalo: zaloId,
                schedule: null,
            });
        } catch (e) {
            console.error('[sendCare] log error:', e.message);
        }
    }
    console.log(`[sendCare] done: sent ${sent}/${recipients.length}`);
}

export async function sendCancelNotificationAction(formData) {
    const auth = await requireAdminSale();
    if (!auth.ok) return { status: false, message: auth.message };
    const courseId = (formData.get('courseId') || '').toString();
    const detailId = (formData.get('detailId') || '').toString();
    const message = (formData.get('message') || '').toString().trim();
    if (!courseId || !detailId) return { status: false, message: 'Thiếu thông tin buổi học.' };
    if (!message) return { status: false, message: 'Vui lòng nhập nội dung tin nhắn.' };

    try {
        await connectDB();
        const dbUser = (await user_data({ _id: auth.user.id }))[0] || {};
        const zaloId = dbUser?.zalo?._id;
        if (!zaloId) return { status: false, message: 'Chưa chọn tài khoản Zalo hoạt động.' };
        const zalo = await ZaloAccount.findById(zaloId).lean();
        if (!zalo || !zalo.botId) return { status: false, message: 'Tài khoản Zalo chưa có botId (ZaloLite).' };

        const course = await Course.findById(courseId).select('ID Name Detail Student').lean();
        const lesson = (course?.Detail || []).find(d => String(d._id) === String(detailId));
        if (!course || !lesson) return { status: false, message: 'Không tìm thấy buổi học.' };

        let teacherName = '';
        if (lesson.Teacher) {
            const t = await User.findById(lesson.Teacher).select('name').lean();
            teacherName = t?.name || '';
        }

        const learnByID = new Map();
        (course.Student || []).forEach(s => {
            const learn = (s.Learn || []).find(x => x.Lesson && String(x.Lesson) === detailId);
            if (learn) learnByID.set(String(s.ID), learn);
        });

        const studentIds = (course.Student || []).map(s => s.ID).filter(Boolean);
        const students = studentIds.length
            ? await Student.find({ ID: { $in: studentIds } }).select('_id ID Name ParentName Phone').lean()
            : [];
        const courseName = course.Name || course.ID;
        const lessonDay = lesson.Day ? fmtDate(lesson.Day) : '';
        const recipients = students
            .filter(s => s.Phone)
            .map(s => {
                const learn = learnByID.get(String(s.ID));
                const img = (learn?.Image || [])[0];
                const vars = {
                    HoTen: s.Name || '',
                    TenPH: s.ParentName || '',
                    Lop: courseName,
                    Ngay: lessonDay,
                    GiaoVien: teacherName,
                    DiemDanh: checkinText(learn?.Checkin || 0),
                    HinhAnh: img?.id ? srcImage(img.id) : '',
                    NhanXetGV: learn?.CmtFn || '',
                    LinkEportfolio: `${getEportfolioUrl()}/e-portfolio/${s._id}`,
                };
                return { name: s.ParentName || s.Name, phone: s.Phone, _id: s._id, ID: s.ID, vars };
            });
        if (recipients.length === 0) return { status: false, message: 'Lớp không có học sinh nào có số điện thoại.' };

        await LessonNotify.findOneAndUpdate(
            { course: courseId, detailId },
            {
                $set: {
                    status: 'notified',
                    method: 'zalo',
                    notifiedAt: new Date(),
                    notifiedBy: auth.user.id,
                    day: lesson.Day || null,
                    reason: lesson.Note || '',
                },
            },
            { upsert: true, new: true }
        );

        runCancelSendLoop({ courseId, detailId, recipients, message, zaloId, zalo, createBy: auth.user.id }).catch(err => {
            console.error('[sendCare] loop error:', err?.message);
        });

        return {
            status: true,
            message: `Đang gửi thông báo nghỉ cho ${recipients.length} học sinh (giới hạn theo cài đặt gửi tin).`,
        };
    } catch (err) {
        console.error('Send Cancel Notification Error:', err);
        return { status: false, message: err.message || 'Lỗi hệ thống, không thể gửi.' };
    }
}
