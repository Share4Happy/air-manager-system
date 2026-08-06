import { Schema, model, models } from 'mongoose'

const ReportTemplateSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Vui lòng nhập tên mẫu.'],
            trim: true,
        },
        content: {
            type: String,
            required: [true, 'Vui lòng nhập nội dung mẫu.'],
            trim: true,
        },
        reportType: {
            type: String,
            enum: ['attendance', 'monthly', 'all'],
            default: 'all',
        },
        messageType: {
            type: String,
            enum: ['periodic_report', 'adhoc_report', 'notice', 'reminder', 'celebration', 'other'],
            default: 'other',
        },
        createdBy: { type: Schema.Types.ObjectId, ref: 'user' },
    },
    { timestamps: true }
)

const ReportTemplate =
    models.reporttemplate || model('reporttemplate', ReportTemplateSchema)
export default ReportTemplate
