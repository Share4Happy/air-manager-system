'use server';
import connectDB from '@/config/connectDB';
import mongoose from 'mongoose';
import Course from '@/models/course';
import Student from '@/models/student';
import User from '@/models/users';
import ZaloAccount from '@/models/zalo';
import LessonNotify from '@/models/lessonNotify';
import Logs from '@/models/log';
import checkAuthToken from '@/utils/checktoken';
import { user_data } from '@/data/actions/get';
import { getReportSendSettings, countHourlySent, sleep, fmtDate, computeResumeAt, fmtTime } from '@/function/report';
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
    if (!user.role?.includes('Admin') && !user.role?.includes('Sale') && !user.role?.includes('Academic')) {
        return { ok: false, message: 'Bạn không có quyền thực hiện chức năng này.' };
    }
    return { ok: true, user };
}

async function runCancelSendLoop({ courseId, detailId, recipients, message, zaloId, zalo, createBy, batchId }) {
    const settings = await getReportSendSettings();
    let rec = await LessonNotify.findOne({ course: courseId, detailId });
    let sent = 0;
    for (let i = 0; i < recipients.length; i++) {
        if (i > 0) {
            const delayMin = settings.staggerMinMin + Math.random() * (settings.staggerMaxMin - settings.staggerMinMin);
            await sleep(Math.round(delayMin * 60 * 1000));
        }
        const sentCount = await countHourlySent(zaloId);
        if (sentCount >= settings.hourlyLimit) {
            const pendingQueue = recipients.slice(i).map(r => ({ phone: r.phone, name: r.name || '', _id: r._id, ID: r.ID, vars: r.vars }));
            if (!rec) rec = await LessonNotify.findOne({ course: courseId, detailId });
            if (rec) {
                rec.pendingQueue = pendingQueue;
                rec.pendingText = message;
                rec.queueResumeAt = computeResumeAt();
                rec.zalo = zaloId;
                rec.batchId = batchId || '';
                await rec.save();
            }
            console.log(`[sendCare] hourly limit reached, queued ${pendingQueue.length} recipients, resume at ${fmtTime(rec?.queueResumeAt)}`);
            return { blocked: true, queued: pendingQueue.length, resumeAt: rec?.queueResumeAt || null };
        }
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
                        recipientNames: [r.name || ''],
                        batchId,
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
    if (rec) {
        rec.pendingQueue = [];
        rec.pendingText = '';
        rec.queueResumeAt = null;
        await rec.save();
    }
    console.log(`[sendCare] done: sent ${sent}/${recipients.length}`);
    return { blocked: false, sent };
}

async function buildCareRecipients({ course, lesson, courseId, detailId }) {
    let teacherName = '';
    if (lesson.Teacher) {
        const t = await User.findById(lesson.Teacher).select('name').lean();
        teacherName = t?.name || '';
    }

    const Attendance = (await import('@/models/attendance')).default;
    const atts = await Attendance.find({
        $or: [
            { session: detailId },
            ...(mongoose.isValidObjectId(detailId) ? [{ session: new mongoose.Types.ObjectId(detailId) }] : []),
            { course: courseId }
        ]
    }).lean();
    const attMap = new Map();
    atts.forEach(a => {
        if (String(a.session) === String(detailId) && a.studentId) {
            attMap.set(String(a.studentId), a);
        }
    });

    const learnByID = new Map();
    (course.Student || []).forEach(s => {
        const learn = (s.Learn || []).find(x => x.Lesson && String(x.Lesson) === String(detailId));
        if (learn) learnByID.set(String(s.ID), learn);
    });

    const studentIds = (course.Student || []).map(s => s.ID).filter(Boolean);
    const students = studentIds.length
        ? await Student.find({ ID: { $in: studentIds } }).select('_id ID Name ParentName Phone').lean()
        : [];
    const courseName = course.Name || course.ID;
    const lessonDay = lesson.Day ? fmtDate(lesson.Day) : '';
    return students
        .filter(s => s.Phone)
        .map(s => {
            const learn = learnByID.get(String(s.ID));
            const att = attMap.get(String(s.ID));
            const checkinVal = att ? (att.checkin || 0) : (learn?.Checkin || 0);
            const cmtVal = att?.cmtFn || learn?.CmtFn || '';
            const img = (att?.images && att.images[0]) || (learn?.Image || [])[0];
            const vars = {
                HoTen: s.Name || '',
                TenPH: s.ParentName || '',
                Lop: courseName,
                Ngay: lessonDay,
                GiaoVien: teacherName,
                DiemDanh: checkinText(checkinVal),
                HinhAnh: img?.id ? srcImage(img.id) : '',
                NhanXetGV: cmtVal,
                LinkEportfolio: `${getEportfolioUrl()}/e-portfolio/${s._id}`,
            };
            return { name: s.ParentName || s.Name, phone: s.Phone, _id: s._id, ID: s.ID, vars };
        });
}

export async function sendCancelNotificationAction(formData) {
    const auth = await requireAdminSale();
    if (!auth.ok) return { status: false, message: auth.message };
    const courseId = (formData.get('courseId') || '').toString();
    const detailId = (formData.get('detailId') || '').toString();
    const message = (formData.get('message') || '').toString().trim();
    const selectedIds = formData.getAll('studentIds').map(v => v.toString().trim()).filter(Boolean);
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
        let lesson = (course?.Detail || []).find(d => String(d._id) === String(detailId));
        if (!lesson) {
            const Session = (await import('@/models/session')).default;
            const sess = await Session.findById(detailId).lean();
            if (sess) {
                lesson = {
                    _id: sess._id,
                    Day: sess.day,
                    Note: sess.note,
                    Teacher: sess.teacher,
                    Room: sess.room,
                    Time: sess.time,
                };
            }
        }
        if (!course || !lesson) return { status: false, message: 'Không tìm thấy buổi học.' };

        let recipients = await buildCareRecipients({ course, lesson, courseId, detailId });
        if (selectedIds.length) {
            const idSet = new Set(selectedIds);
            recipients = recipients.filter(r => idSet.has(String(r.ID)));
        }
        if (recipients.length === 0) {
            return { status: false, message: 'Không có học sinh được chọn có số điện thoại.' };
        }

        let rec = await LessonNotify.findOne({ course: courseId, detailId });
        const batchId = (rec?.batchId && rec.pendingQueue?.length > 0) ? rec.batchId : new mongoose.Types.ObjectId().toString();

        // Resume due pending queue (nếu có) trước, rồi gộp thêm người nhận mới
        const now = new Date();
        let resumeTargets = [];
        if (rec && rec.pendingQueue?.length > 0 && rec.queueResumeAt && new Date(rec.queueResumeAt) <= now) {
            resumeTargets = rec.pendingQueue.map(t => ({ phone: t.phone, name: t.name || '', _id: t._id, ID: t.ID, vars: t.vars || {} }));
            rec.pendingQueue = [];
            rec.pendingText = '';
            rec.queueResumeAt = null;
            await rec.save();
        }
        const combined = [...resumeTargets, ...recipients];

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
                    zalo: zaloId,
                    batchId,
                },
            },
            { upsert: true, new: true }
        );

        const settings = await getReportSendSettings();
        const sentCount = await countHourlySent(zaloId);
        if (sentCount >= settings.hourlyLimit) {
            const queue = combined.map(r => ({ phone: r.phone, name: r.name || '', _id: r._id, ID: r.ID, vars: r.vars }));
            const resumeAt = computeResumeAt();
            await LessonNotify.findOneAndUpdate(
                { course: courseId, detailId },
                { $set: { pendingQueue: queue, pendingText: message, queueResumeAt: resumeAt, zalo: zaloId, batchId } }
            );
            return {
                status: true,
                queued: true,
                message: `Đã đạt giới hạn gửi tin trong giờ (${settings.hourlyLimit} tin/giờ). ${queue.length} tin đã vào hàng chờ, sẽ gửi từ ${fmtTime(resumeAt)}.`,
            };
        }

        runCancelSendLoop({ courseId, detailId, recipients: combined, message, zaloId, zalo, createBy: auth.user.id, batchId }).catch(err => {
            console.error('[sendCare] loop error:', err?.message);
        });

        const total = combined.length;
        return {
            status: true,
            message: resumeTargets.length
                ? `Đang gửi tiếp ${resumeTargets.length} tin trong hàng chờ và ${recipients.length} học sinh mới (giới hạn theo cài đặt gửi tin).`
                : `Đang gửi thông báo cho ${total} học sinh được chọn (giới hạn theo cài đặt gửi tin).`,
        };
    } catch (err) {
        console.error('Send Cancel Notification Error:', err);
        return { status: false, message: err.message || 'Lỗi hệ thống, không thể gửi.' };
    }
}

export async function sendTestCareNotificationAction(formData) {
    const auth = await requireAdminSale();
    if (!auth.ok) return { status: false, message: auth.message };
    const courseId = (formData.get('courseId') || '').toString();
    const detailId = (formData.get('detailId') || '').toString();
    const message = (formData.get('message') || '').toString().trim();
    const testPhone = (formData.get('testPhone') || '').toString().trim();

    if (!testPhone) return { status: false, message: 'Vui lòng nhập số điện thoại nhận tin thử nghiệm.' };
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
        let lesson = (course?.Detail || []).find(d => String(d._id) === String(detailId));
        if (!lesson) {
            const Session = (await import('@/models/session')).default;
            const sess = await Session.findById(detailId).lean();
            if (sess) {
                lesson = {
                    _id: sess._id,
                    Day: sess.day,
                    Note: sess.note,
                    Teacher: sess.teacher,
                    Room: sess.room,
                    Time: sess.time,
                };
            }
        }
        if (!course || !lesson) return { status: false, message: 'Không tìm thấy buổi học.' };

        const recipients = await buildCareRecipients({ course, lesson, courseId, detailId });
        if (recipients.length === 0) {
            return { status: false, message: 'Lớp học không có dữ liệu học sinh để lấy thông tin gửi thử.' };
        }

        const firstStudent = recipients[0];
        const text = renderCareTemplate(message, firstStudent.vars);

        const resp = await sendByPhone(zalo.botId, { phone: testPhone, text, mode: 'safe' });
        let ok = false;
        let errMsg = '';
        if (resp.async) {
            ok = true;
        } else if (Array.isArray(resp.data?.results)) {
            const rr = resp.data.results[0] || {};
            ok = rr.status === 'success';
            errMsg = rr.error_message || rr.message || '';
        } else {
            ok = resp.data?.success !== false;
            errMsg = resp.data?.message || '';
        }

        if (!ok) {
            return { status: false, message: `Gửi tin thử nghiệm thất bại: ${errMsg || 'Lỗi từ dịch vụ Zalo'}` };
        }

        return {
            status: true,
            message: `Đã gửi tin thử nghiệm thành công tới ${testPhone} (mẫu dữ liệu học sinh: ${firstStudent.vars.HoTen || firstStudent.name}).`
        };
    } catch (err) {
        console.error('[sendTestCare] error:', err?.message);
        return { status: false, message: err?.message || 'Lỗi gửi tin thử nghiệm.' };
    }
}

export async function processPendingCareSends() {
    try {
        await connectDB();
        const now = new Date();
        const recs = await LessonNotify.find({
            pendingQueue: { $exists: true, $ne: [] },
            queueResumeAt: { $lte: now },
        }).lean();
        for (const rec of recs) {
            const zalo = rec.zalo ? await ZaloAccount.findById(rec.zalo).lean() : null;
            if (!zalo || !zalo.botId) continue;
            const recipients = (rec.pendingQueue || []).map(t => ({ phone: t.phone, name: t.name || '', _id: t._id, ID: t.ID, vars: t.vars || {} }));
            if (recipients.length === 0) continue;
            await LessonNotify.updateOne(
                { _id: rec._id },
                { $set: { pendingQueue: [], pendingText: '', queueResumeAt: null } }
            );
            runCancelSendLoop({
                courseId: rec.course,
                detailId: rec.detailId,
                recipients,
                message: rec.pendingText || '',
                zaloId: rec.zalo,
                zalo,
                createBy: rec.notifiedBy || null,
                batchId: rec.batchId || '',
            }).catch(err => {
                console.error('[sendCare] resume loop error:', err?.message);
            });
        }
    } catch (err) {
        console.error('[sendCare] process pending error:', err?.message);
    }
}
