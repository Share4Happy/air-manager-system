import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import Quiz from '@/models/quiz'
import NotificationSetting from '@/models/notificationSetting'
import authenticate from '@/utils/authenticate'

const ROLES = ['Admin', 'Academic', 'Teacher', 'Sale']
const DEFAULT_PASS_RATE = 0.8

async function getPassRate() {
    const setting = await NotificationSetting.findOne({ key: 'quiz_pass_rate' }).lean()
    const value = Number(setting?.value)
    return Number.isFinite(value) && value > 0 && value <= 1 ? value : DEFAULT_PASS_RATE
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const role = searchParams.get('role') || ''
        const includeAnswers = searchParams.get('admin') === '1'
        if (!ROLES.includes(role)) {
            return NextResponse.json({ success: false, error: 'Role không hợp lệ' }, { status: 400 })
        }

        let isAdmin = false
        if (includeAnswers) {
            const { user } = await authenticate(request)
            isAdmin = user.role.some(r => /^admin$/i.test(r)) || user.role.some(r => /^academic$/i.test(r))
            if (!isAdmin) {
                return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 403 })
            }
        }

        await connectDB()
        const passRate = await getPassRate()
        const quiz = await Quiz.findOne({ role }).lean()
        const questions = quiz?.questions || []
        const data = questions.map(q => ({
            question: q.question,
            options: q.options,
            ...(isAdmin ? { answerIndex: q.answerIndex } : {}),
        }))

        return NextResponse.json({ success: true, data: { role, passRate, questions: data } })
    } catch (error) {
        console.error('GET /api/quiz error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const { user } = await authenticate(request)
        if (!user.role.some(r => /^admin$/i.test(r)) && !user.role.some(r => /^academic$/i.test(r))) {
            return NextResponse.json({ success: false, error: 'Chỉ Admin hoặc Học vụ mới có quyền này' }, { status: 403 })
        }

        const body = await request.json()
        const { role, questions } = body
        if (!ROLES.includes(role)) {
            return NextResponse.json({ success: false, error: 'Role không hợp lệ' }, { status: 400 })
        }
        if (!Array.isArray(questions)) {
            return NextResponse.json({ success: false, error: 'questions phải là mảng' }, { status: 400 })
        }

        const clean = questions
            .map(q => ({
                question: String(q?.question || '').trim(),
                options: Array.isArray(q?.options)
                    ? q.options.map(o => String(o || '').trim()).filter(o => o)
                    : [],
                answerIndex: Math.max(0, Number(q?.answerIndex) || 0),
            }))
            .filter(q => q.question && q.options.length >= 2)

        await connectDB()
        const data = await Quiz.findOneAndUpdate(
            { role },
            { role, questions: clean, updatedBy: user._id },
            { upsert: true, new: true }
        )
        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error('PUT /api/quiz error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
