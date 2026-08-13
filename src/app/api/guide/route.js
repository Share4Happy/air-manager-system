import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import Guide from '@/models/guide'
import authenticate from '@/utils/authenticate'

const ROLES = ['Admin', 'Academic', 'Teacher', 'Sale']

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const role = searchParams.get('role') || ''
        if (role && !ROLES.includes(role)) {
            return NextResponse.json({ success: false, error: 'Role không hợp lệ' }, { status: 400 })
        }
        await connectDB()
        const query = role ? { role } : { role: { $in: ROLES } }
        const data = role
            ? await Guide.findOne(query).lean()
            : await Guide.find(query).lean()
        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error('GET /api/guide error:', error)
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
        const { role, sections, faqs } = body
        if (!ROLES.includes(role)) {
            return NextResponse.json({ success: false, error: 'Role không hợp lệ' }, { status: 400 })
        }
        if (!Array.isArray(sections)) {
            return NextResponse.json({ success: false, error: 'sections phải là mảng' }, { status: 400 })
        }
        if (faqs !== undefined && !Array.isArray(faqs)) {
            return NextResponse.json({ success: false, error: 'faqs phải là mảng' }, { status: 400 })
        }

        const clean = sections
            .map(s => ({
                title: String(s?.title || '').trim(),
                steps: Array.isArray(s?.steps)
                    ? s.steps
                        .filter(st => st && String(st.content || '').trim())
                        .map(st => ({ content: String(st.content).trim() }))
                    : [],
            }))
            .filter(s => s.title || s.steps.length)

        const cleanFaqs = Array.isArray(faqs)
            ? faqs
                .filter(f => f && String(f.question || '').trim() && String(f.answer || '').trim())
                .map(f => ({ question: String(f.question).trim(), answer: String(f.answer).trim() }))
            : []

        await connectDB()
        const data = await Guide.findOneAndUpdate(
            { role },
            { role, sections: clean, faqs: cleanFaqs, updatedBy: user._id },
            { upsert: true, new: true }
        )
        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error('PUT /api/guide error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
