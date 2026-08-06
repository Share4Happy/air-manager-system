import { Schema, model, models } from 'mongoose'

const LessonNotifyStudentSchema = new Schema(
    {
        ID: { type: String, required: true },
        status: { type: String, enum: ['pending', 'done', 'failed'], default: 'pending' },
        zaloStatus: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
        zaloAt: { type: Date, default: null },
    },
    { _id: false }
)

const ConfirmationSchema = new Schema(
    {
        by: { type: Schema.Types.ObjectId, ref: 'user' },
        at: { type: Date, default: Date.now },
        action: { type: String, default: 'care' },
    },
    { _id: false }
)

const LessonNotifySchema = new Schema(
    {
        course: { type: Schema.Types.ObjectId, ref: 'course', required: true },
        detailId: { type: Schema.Types.ObjectId, required: true },
        day: { type: Date, default: null },
        reason: { type: String, default: '' },
        status: { type: String, enum: ['pending', 'notified'], default: 'pending' },
        method: { type: String, enum: ['zalo', 'care'], default: 'zalo' },
        notifiedBy: { type: Schema.Types.ObjectId, ref: 'user', default: null },
        notifiedAt: { type: Date, default: null },
        students: { type: [LessonNotifyStudentSchema], default: [] },
        confirmations: { type: [ConfirmationSchema], default: [] },
    },
    { timestamps: true }
)

LessonNotifySchema.index({ course: 1, detailId: 1 }, { unique: true })

const LessonNotify = models.lessonNotify || model('lessonNotify', LessonNotifySchema)
export default LessonNotify
