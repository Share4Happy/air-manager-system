import { Schema, model, models } from 'mongoose'

const CareTemplateSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        content: { type: String, required: true, trim: true },
        messageType: {
            type: String,
            enum: ['periodic_report', 'adhoc_report', 'notice', 'reminder', 'celebration', 'other'],
            default: 'other',
        },
        createdBy: { type: Schema.Types.ObjectId, ref: 'user', default: null },
    },
    { timestamps: true }
)

const CareTemplate = models.careTemplate || model('careTemplate', CareTemplateSchema)
export default CareTemplate
