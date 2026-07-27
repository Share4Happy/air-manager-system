import connectDB from '@/config/connectDB'
import Tool from '@/models/tool'
import ToolLabel from '@/models/toolLabel'
import jsonRes from '@/utils/response'
import authenticate from '@/utils/authenticate'

export async function DELETE(request, { params }) {
    const { id } = await params
    try {
        const { user } = await authenticate(request)
        await connectDB()

        const used = await Tool.exists({ labels: id })
        if (used) {
            return jsonRes(409, { status: false, mes: 'Không thể xóa — nhãn đang được sử dụng.' })
        }

        const label = await ToolLabel.findByIdAndDelete(id)
        if (!label) {
            return jsonRes(404, { status: false, mes: 'Không tìm thấy nhãn.', data: [] })
        }
        return jsonRes(200, { status: true, mes: 'Xóa nhãn thành công.', data: [] })
    } catch (err) {
        const code = err.message === 'Authentication failed' ? 401 : 500
        return jsonRes(code, { status: false, mes: err.message, data: [] })
    }
}
