import connectDB from '@/config/connectDB'
import ToolLabel from '@/models/toolLabel'
import jsonRes from '@/utils/response'
import authenticate from '@/utils/authenticate'

const LABEL_COLORS = [
    '#fde8e8', '#fed7aa', '#fef9c3', '#d1fae5', '#cffafe',
    '#dbeafe', '#e0e7ff', '#f3e8ff', '#fce7f3', '#ccfbf1',
    '#ffe4e6', '#fef3c7', '#ecfccb', '#d1fae5', '#e0f2fe',
    '#bfdbfe', '#ddd6fe', '#fbcfe8', '#a5f3fc', '#d9f99d',
]

export async function GET() {
    try {
        await connectDB()
        const labels = await ToolLabel.find({}).lean()
        return jsonRes(200, { status: true, data: labels })
    } catch (err) {
        return jsonRes(500, { status: false, mes: err.message, data: [] })
    }
}

export async function POST(request) {
    try {
        const { user, body } = await authenticate(request)
        await connectDB()
        const { name } = body
        if (!name?.trim()) {
            return jsonRes(400, { status: false, mes: 'Tên nhãn không được để trống.', data: [] })
        }
        const existing = await ToolLabel.find({}).select('color').lean()
        const usedColors = new Set(existing.map(l => l.color))
        let color = LABEL_COLORS.find(c => !usedColors.has(c))
        if (!color) color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
        const label = await ToolLabel.create({ name: name.trim(), color })
        return jsonRes(201, { status: true, data: label })
    } catch (err) {
        const code = err.message === 'Authentication failed' ? 401 : 500
        return jsonRes(code, { status: false, mes: err.message, data: [] })
    }
}
