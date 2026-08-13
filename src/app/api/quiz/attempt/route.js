import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import Quiz from '@/models/quiz'
import QuizAttempt from '@/models/quizAttempt'
import NotificationSetting from '@/models/notificationSetting'
import authenticate from '@/utils/authenticate'

const ROLES = ['Admin', 'Academic', 'Teacher', 'Sale']
const DEFAULT_PASS_RATE = 0.8

async function getPassRate() {
    const setting = await NotificationSetting.findOne({ key: 'quiz_pass_rate' }).lean()
    const value = Number(setting?.value)
    return Number.isFinite(value) && value > 0 && value <= 1 ? value : DEFAULT_PASS_RATE
}

export async function POST(request) {
    try {
        const { user } = await authenticate(request)
        const body = await request.json()
        const { role, answers } = body
        if (!ROLES.includes(role)) {
            return NextResponse.json({ success: false, error: 'Role không hợp lệ' }, { status: 400 })
        }
        if (!Array.isArray(answers)) {
            return NextResponse.json({ success: false, error: 'answers phải là mảng' }, { status: 400 })
        }

        await connectDB()
        const quiz = await Quiz.findOne({ role }).lean()
        const questions = quiz?.questions || []
        if (questions.length === 0) {
            return NextResponse.json({ success: false, error: 'Chưa có câu hỏi cho vai trò này' }, { status: 400 })
        }

        let score = 0
        questions.forEach((q, i) => {
            if (answers[i] === q.answerIndex) score++
        })

        const passRate = await getPassRate()

        await QuizAttempt.create({
            user: user._id,
            role,
            score,
            total: questions.length,
            answers,
        })

        return NextResponse.json({
            success: true,
            data: { score, total: questions.length, passRate, passed: score >= questions.length * passRate },
        })
    } catch (error) {
        console.error('POST /api/quiz/attempt error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function GET(request) {
    try {
        const { user } = await authenticate(request)
        const isAdmin = user.role.some(r => /^admin$/i.test(r)) || user.role.some(r => /^academic$/i.test(r))
        const { searchParams } = new URL(request.url)
        const role = searchParams.get('role')

        await connectDB()
        const query = {}
        if (!isAdmin) {
            query.user = user._id
        } else if (role && ROLES.includes(role)) {
            query.role = role
        }

        const attempts = await QuizAttempt.find(query)
            .sort({ createdAt: -1 })
            .limit(100)
            .populate('user', 'name role')
            .lean()

        const passRate = await getPassRate()

        return NextResponse.json({
            success: true,
            data: attempts.map(a => ({
                _id: a._id,
                userName: a.user?.name || 'Đã xóa',
                userRole: a.user?.role?.[0] || '',
                role: a.role,
                score: a.score,
                total: a.total,
                passed: a.score >= a.total * passRate,
                createdAt: a.createdAt,
            })),
        })
    } catch (error) {
        console.error('GET /api/quiz/attempt error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
