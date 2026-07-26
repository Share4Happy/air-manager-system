import { Schema, model, models } from 'mongoose';

const DebtSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'student', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'course', default: null },
    courseName: { type: String, default: '' },
    amount: { type: Number, required: true },
    sessions: { type: Number, default: 0 },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    note: { type: String, default: '' },
    status: { type: Number, default: 0 },
    createBy: { type: String, default: '' },
}, { timestamps: true, versionKey: false });

const Debt = models.debt || model('debt', DebtSchema);
export default Debt;
