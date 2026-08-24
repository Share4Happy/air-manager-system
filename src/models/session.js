import mongoose, { Schema } from 'mongoose';

const DetailImageSchema = new Schema({
    id: { type: String, required: true },
    type: { type: String },
    size: { type: Number },
    create: { type: Date, default: Date.now }
}, { _id: false });

const CheckinInfoSchema = new Schema({
    id: { type: String },
    folderId: { type: String },
    time: { type: Date },
    status: { type: String },
}, { _id: false });

const SessionSchema = new Schema({
    course: { type: Schema.Types.ObjectId, ref: 'course' },
    courseCode: { type: String, required: true },
    courseName: { type: String },
    courseType: { type: String, default: 'AI Robotic' },
    buoi: { type: Number, required: true },
    day: { type: Date, required: true },
    time: { type: String },
    room: { type: Schema.Types.ObjectId },
    teacher: { type: Schema.Types.ObjectId, ref: 'user' },
    teachingAs: { type: Schema.Types.ObjectId, ref: 'user' },
    topic: { type: Schema.Types.ObjectId },
    book: { type: Schema.Types.ObjectId, ref: 'book' },
    image: { type: String }, // Google Drive folder ID của buổi học
    detailImage: { type: [DetailImageSchema], default: [] },
    checkin: { type: CheckinInfoSchema, default: null },
    note: { type: String, default: '' },
    type: { type: String, default: 'Chính khóa' },
    status: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });

// Đánh Indexes phục vụ query siêu tốc
SessionSchema.index({ day: 1, room: 1 });
SessionSchema.index({ teacher: 1 });
SessionSchema.index({ teachingAs: 1 });
SessionSchema.index({ course: 1, buoi: 1 });
SessionSchema.index({ courseCode: 1, buoi: 1 });
SessionSchema.index({ course: 1 });
SessionSchema.index({ day: 1 });

const Session = mongoose.models.session || mongoose.model('session', SessionSchema);

export default Session;
