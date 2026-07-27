import connectDB from '@/config/connectDB'
import Tool from '@/models/tool'
import jsonRes from '@/utils/response'
import authenticate from '@/utils/authenticate'

export async function GET() {
    try {
        await connectDB()
        const tools = await Tool.find({}).populate('labels').sort({ createdAt: -1 }).lean()
        return jsonRes(200, { status: true, data: tools })
    } catch (err) {
        return jsonRes(500, { status: false, mes: err.message, data: [] })
    }
}

export async function POST(request) {
    try {
        const { user, body } = await authenticate(request)
        await connectDB()
        const { name, desc, link, labels } = body
        if (!name?.trim()) {
            return jsonRes(400, { status: false, mes: 'Tên công cụ không được để trống.', data: [] })
        }
        const tool = await Tool.create({ name: name.trim(), desc: desc?.trim() || '', link: link?.trim() || '', labels: labels || [] })
        const populated = await Tool.findById(tool._id).populate('labels').lean()
        return jsonRes(201, { status: true, data: populated })
    } catch (err) {
        const code = err.message === 'Authentication failed' ? 401 : 500
        return jsonRes(code, { status: false, mes: err.message, data: [] })
    }
}
