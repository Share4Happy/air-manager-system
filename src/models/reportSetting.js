import { Schema, model, models } from 'mongoose'

const ReportSettingSchema = new Schema(
    {
        staggerMinMin: { type: Number, default: 3 },
        staggerMaxMin: { type: Number, default: 5 },
        hourlyLimit: { type: Number, default: 30 },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'user' },
    },
    { timestamps: true }
)

const ReportSetting =
    models.reportsetting || model('reportsetting', ReportSettingSchema)
export default ReportSetting
