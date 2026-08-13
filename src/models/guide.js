import { Schema, model, models } from 'mongoose'

const GuideStepSchema = new Schema({
    content: { type: String, default: '' },
})

const GuideSectionSchema = new Schema({
    title: { type: String, default: '' },
    steps: { type: [GuideStepSchema], default: [] },
})

const GuideFaqSchema = new Schema({
    question: { type: String, default: '' },
    answer: { type: String, default: '' },
})

const GuideSchema = new Schema(
    {
        role: { type: String, required: true, unique: true },
        sections: { type: [GuideSectionSchema], default: [] },
        faqs: { type: [GuideFaqSchema], default: [] },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'user' },
    },
    { timestamps: true }
)

const Guide = models.guide || model('guide', GuideSchema)
export default Guide
