import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import Guide from '@/models/guide'
import Quiz from '@/models/quiz'
import authenticate from '@/utils/authenticate'
import { GUIDE_SEED, QUIZ_SEED } from '@/data/seedDefaults.mjs'

export async function POST(request) {
    try {
        const { user } = await authenticate(request)
        if (!user.role.some(r => /^admin$/i.test(r)) && !user.role.some(r => /^academic$/i.test(r))) {
            return NextResponse.json({ success: false, error: 'Chỉ Admin hoặc Học vụ mới có quyền này' }, { status: 403 })
        }

        await connectDB()

        let guides = 0
        for (const seed of GUIDE_SEED) {
            await Guide.updateOne(
                { role: seed.role },
                { $set: { sections: seed.sections, faqs: seed.faqs, updatedBy: user._id } },
                { upsert: true }
            )
            guides++
        }

        let quizzes = 0
        for (const seed of QUIZ_SEED) {
            await Quiz.updateOne(
                { role: seed.role },
                { $set: { questions: seed.questions, updatedBy: user._id } },
                { upsert: true }
            )
            quizzes++
        }

        return NextResponse.json({
            success: true,
            data: { guides, quizzes, guideSections: GUIDE_SEED.reduce((n, g) => n + g.sections.length, 0), quizQuestions: QUIZ_SEED.reduce((n, q) => n + q.questions.length, 0) },
            message: `Đã nhập ${guides} bộ hướng dẫn và ${quizzes} bài kiểm tra mặc định`,
        })
    } catch (error) {
        console.error('POST /api/import-defaults error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}