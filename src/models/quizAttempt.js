import { Schema, model, models } from 'mongoose'

const QuizAttemptSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
        role: { type: String, required: true },
        score: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        answers: { type: [Number], default: [] },
    },
    { timestamps: true }
)

const QuizAttempt = models.quizattempt || model('quizattempt', QuizAttemptSchema)
export default QuizAttempt
