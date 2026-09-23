import connectDB from '@/config/connectDB'
import Tool from '@/models/tool'
import '@/models/toolLabel'
import jsonRes from '@/utils/response'
import { authorize } from '@/utils/authorize'

export async function PUT(request, { params }) {
    const { id } = await params
    try {
        const auth = await authorize(request)
        if (!auth.authorized) return auth.response

        const body = await request.json()
        await connectDB()
        const { name, desc, link, labels } = body
        if (!name?.trim()) {
            return jsonRes(400, { status: false, mes: 'Tên công cụ không được để trống.', data: [] })
        }
        const tool = await Tool.findByIdAndUpdate(
            id,
            { name: name.trim(), desc: desc?.trim() || '', link: link?.trim() || '', labels: labels || [] },
            { new: true, runValidators: true }
        ).populate('labels').lean()
        if (!tool) {
            return jsonRes(404, { status: false, mes: 'Không tìm thấy công cụ.', data: [] })
        }
        return jsonRes(200, { status: true, data: tool })
    } catch (err) {
        return jsonRes(500, { status: false, mes: err.message, data: [] })
    }
}

export async function DELETE(request, { params }) {
    const { id } = await params
    try {
        const auth = await authorize(request)
        if (!auth.authorized) return auth.response

        await connectDB()
        const tool = await Tool.findByIdAndDelete(id)
        if (!tool) {
            return jsonRes(404, { status: false, mes: 'Không tìm thấy công cụ.', data: [] })
        }
        return jsonRes(200, { status: true, mes: 'Xóa công cụ thành công.', data: [] })
    } catch (err) {
        return jsonRes(500, { status: false, mes: err.message, data: [] })
    }
}
