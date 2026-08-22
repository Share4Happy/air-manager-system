import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { QUIZ_SEED } from '../data/seedDefaults.mjs'

const envPath = fs.existsSync('.env.development')
    ? '.env.development'
    : path.resolve(process.cwd(), '.env.development')

const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
const uri = (env.match(/^MongoDB_URI=(.*)$/m) || [])[1]?.trim() || process.env.MongoDB_URI || 'mongodb://127.0.0.1:27017/air'

const QuizStep = mongoose.Schema({
    question: String,
    options: [String],
    answerIndex: Number,
}, { _id: false })

const QuizSchema = mongoose.Schema({
    role: { type: String, required: true, unique: true },
    questions: [QuizStep],
    updatedBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true })

const Quiz = mongoose.models.quiz || mongoose.model('quiz', QuizSchema)

await mongoose.connect(uri)
for (const seed of QUIZ_SEED) {
    await Quiz.updateOne(
        { role: seed.role },
        { $set: { questions: seed.questions } },
        { upsert: true }
    )
    console.log(`Seeded: ${seed.role} (${seed.questions.length} questions)`)
}
await mongoose.disconnect()
console.log('Done')
