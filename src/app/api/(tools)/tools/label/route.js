import connectDB from '@/config/connectDB'
import ToolLabel from '@/models/toolLabel'
import jsonRes from '@/utils/response'
import authenticate from '@/utils/authenticate'

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
        if (!user.role.includes('Admin') && !user.role.includes('Manager')) {
            return jsonRes(403, { status: false, mes: 'Không có quyền truy cập.', data: [] })
        }
        await connectDB()
        const { name } = body
        if (!name?.trim()) {
            return jsonRes(400, { status: false, mes: 'Tên nhãn không được để trống.', data: [] })
        }
        const label = await ToolLabel.create({ name: name.trim() })
        return jsonRes(201, { status: true, data: label })
    } catch (err) {
        const code = err.message === 'Authentication failed' ? 401 : 500
        return jsonRes(code, { status: false, mes: err.message, data: [] })
    }
}
