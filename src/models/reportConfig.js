import { Schema, model, models } from 'mongoose'

const ReportConfigSchema = new Schema(
    {
        name: { type: String, trim: true },
        recipientUserIds: {
            type: [{ type: Schema.Types.ObjectId, ref: 'user' }],
            default: [],
            required: true,
        },
        zaloAccountId: {
            type: Schema.Types.ObjectId,
            ref: 'zaloaccount',
            required: true,
        },
        reportType: {
            type: String,
            enum: ['attendance', 'monthly'],
            required: true,
        },
        messageTemplate: { type: String, trim: true, default: '' },
        reportOptions: {
            type: Schema.Types.Mixed,
            default: {},
        },
        pendingQueue: {
            type: [
                {
                    phone: { type: String, trim: true, default: '' },
                    name: { type: String, trim: true, default: '' },
                },
            ],
            default: [],
        },
        pendingText: { type: String, trim: true, default: '' },
        queueResumeAt: { type: Date, default: null },
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly'],
            required: true,
        },
        sendTime: { type: String, trim: true, default: '08:00' },
        weekday: { type: Number, default: 1 },
        monthDay: { type: Number, default: 1 },
        isActive: { type: Boolean, default: true },
        lastSentAt: { type: Date, default: null },
        nextRunAt: { type: Date, default: null },
        createdBy: { type: Schema.Types.ObjectId, ref: 'user' },
    },
    { timestamps: true }
)

const ReportConfig =
    models.reportconfig || model('reportconfig', ReportConfigSchema)
export default ReportConfig
