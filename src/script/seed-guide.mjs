import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { GUIDE_SEED } from '../data/seedDefaults.mjs'

const envPath = fs.existsSync('.env.development')
    ? '.env.development'
    : path.resolve(process.cwd(), '.env.development')

const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
const uri = (env.match(/^MongoDB_URI=(.*)$/m) || [])[1]?.trim() || process.env.MongoDB_URI || 'mongodb://127.0.0.1:27017/air'

const GuideStep = mongoose.Schema({
    content: String,
}, { _id: false })

const GuideSection = mongoose.Schema({
    title: String,
    steps: [GuideStep],
}, { _id: false })

const GuideFaq = mongoose.Schema({
    question: String,
    answer: String,
}, { _id: false })

const GuideSchema = mongoose.Schema({
    role: { type: String, required: true, unique: true },
    sections: [GuideSection],
    faqs: [GuideFaq],
    updatedBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true })

const Guide = mongoose.models.guide || mongoose.model('guide', GuideSchema)

await mongoose.connect(uri)
for (const seed of GUIDE_SEED) {
    await Guide.updateOne(
        { role: seed.role },
        { $set: { sections: seed.sections, faqs: seed.faqs } },
        { upsert: true }
    )
    console.log(`Seeded: ${seed.role} (${seed.sections.length} sections, ${seed.faqs.length} faqs)`)
}
await mongoose.disconnect()
console.log('Done')
