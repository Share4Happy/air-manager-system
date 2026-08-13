import mongoose from 'mongoose'
import fs from 'fs'
import { QUIZ_SEED } from '../src/data/seedDefaults.mjs'

const env = fs.readFileSync('.env.development', 'utf8')
const uri = (env.match(/^MongoDB_URI=(.*)$/m) || [])[1].trim()

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