import { Schema, model, models } from 'mongoose';

const AttendanceImageSchema = new Schema({
    id: { type: String, required: true },
    type: { type: String },
    size: { type: Number },
    create: { type: Date, default: Date.now }
}, { _id: false });

const AttendanceSchema = new Schema({
    session: { type: Schema.Types.ObjectId, ref: 'session', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'course' },
    courseCode: { type: String },
    studentId: { type: String, required: true }, // Mã định danh học sinh (ID hoặc _id)
    checkin: { type: Number, default: 0, enum: [0, 1, 2] }, // 0: Vắng, 1: Có mặt, 2: Vắng có phép
    cmt: { type: Array, default: [] },
    cmtFn: { type: String, default: '' },
    note: { type: String, default: '' },
    images: { type: [AttendanceImageSchema], default: [] },
    absenceReason: { type: String, default: '' },
    makeupStatus: {
        type: String,
        enum: ['NOT_REQUIRED', 'MAKEUP_REQUIRED', 'MAKEUP_PENDING', 'MAKEUP_SCHEDULED', 'MAKEUP_COMPLETED', 'MAKEUP_ABSENT', 'MAKEUP_EXPIRED', 'MAKEUP_CANCELLED'],
        default: 'NOT_REQUIRED'
    },
}, { timestamps: true, versionKey: false });

// Đánh Compound Unique Index: Mỗi học sinh chỉ có 1 bản ghi điểm danh trong 1 buổi học
AttendanceSchema.index({ session: 1, studentId: 1 }, { unique: true });
AttendanceSchema.index({ studentId: 1 });
AttendanceSchema.index({ courseCode: 1 });
AttendanceSchema.index({ course: 1 });
AttendanceSchema.index({ makeupStatus: 1 });

const Attendance = models.attendance || model('attendance', AttendanceSchema);

export default Attendance;
