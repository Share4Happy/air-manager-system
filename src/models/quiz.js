import { Schema, model, models } from 'mongoose'

const QuestionSchema = new Schema({
    question: { type: String, default: '' },
    options: { type: [String], default: [] },
    answerIndex: { type: Number, default: 0 },
})

const QuizSchema = new Schema(
    {
        role: { type: String, required: true, unique: true },
        questions: { type: [QuestionSchema], default: [] },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'user' },
    },
    { timestamps: true }
)

const Quiz = models.quiz || model('quiz', QuizSchema)
export default Quiz
