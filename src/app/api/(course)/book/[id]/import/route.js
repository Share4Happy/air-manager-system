import mongoose from 'mongoose'
import connectDB from '@/config/connectDB'
import Book from '@/models/book'
import authenticate from '@/utils/authenticate'
import { reloadBook } from '@/data/actions/reload'
import jsonRes from '@/utils/response'
import ExcelJS from 'exceljs'

export async function GET(request) {
    try {
        const { user } = await authenticate(request)
        if (!user.role.includes('Admin') && !user.role.includes('Academic')) {
            return jsonRes(403, { status: false, mes: 'Bạn không có quyền truy cập chức năng này.' })
        }

        const workbook = new ExcelJS.Workbook()
        const ws = workbook.addWorksheet('Chủ đề')
        ws.columns = [
            { header: 'Name', width: 30 },
            { header: 'Slide', width: 50 },
            { header: 'Period', width: 12 },
            { header: 'Content', width: 40 },
        ]
        ws.addRow(['Lập trình cơ bản 1', 'https://docs.google.com/presentation/d/...', '3', 'Giới thiệu về lập trình'])

        const buf = await workbook.xlsx.writeBuffer()
        return new Response(buf, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="mau-chu-de.xlsx"',
            },
        })
    } catch (error) {
        return jsonRes(500, { status: false, mes: error.message })
    }
}

export async function POST(request, { params }) {
    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return jsonRes(400, { status: false, mes: 'ID chương trình học không hợp lệ.' })
    }

    try {
        const { user } = await authenticate(request)
        if (!user.role.includes('Admin') && !user.role.includes('Academic')) {
            return jsonRes(403, { status: false, mes: 'Bạn không có quyền truy cập chức năng này.' })
        }

        const formData = await request.formData()
        const file = formData.get('file')
        if (!file) {
            return jsonRes(400, { status: false, mes: 'Vui lòng chọn file Excel.' })
        }

        const buf = Buffer.from(await file.arrayBuffer())
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buf)
        const ws = workbook.worksheets[0]
        if (!ws) {
            return jsonRes(400, { status: false, mes: 'File Excel không có sheet nào.' })
        }

        const rows = []
        ws.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return
            rows.push({
                Name: String(row.getCell(1).value || '').trim(),
                Slide: String(row.getCell(2).value || '').trim(),
                Period: row.getCell(3).value,
                Content: String(row.getCell(4).value || '').trim(),
            })
        })

        if (rows.length === 0) {
            return jsonRes(400, { status: false, mes: 'File không có dữ liệu.' })
        }

        const results = { success: 0, errors: [] }
        const topicsToAdd = []

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            const rowNum = i + 2

            const name = row.Name
            if (!name) {
                results.errors.push({ row: rowNum, mes: 'Thiếu tên chủ đề (Name)' })
                continue
            }

            const slide = row.Slide
            if (!slide) {
                results.errors.push({ row: rowNum, mes: 'Thiếu link Slide' })
                continue
            }

            let period = row.Period
            if (period === undefined || period === null || period === '') {
                results.errors.push({ row: rowNum, mes: 'Thiếu số tiết (Period)' })
                continue
            }
            period = Number(period)
            if (isNaN(period) || period < 0) {
                results.errors.push({ row: rowNum, mes: 'Số tiết không hợp lệ' })
                continue
            }

            topicsToAdd.push({
                Name: name,
                Period: period,
                Slide: slide,
                Content: row.Content || undefined,
            })
            results.success++
        }

        if (topicsToAdd.length === 0) {
            return jsonRes(200, {
                status: true,
                mes: 'Import hoàn tất, không có chủ đề hợp lệ để thêm.',
                data: results
            })
        }

        await connectDB()
        const updatedBook = await Book.findByIdAndUpdate(
            id,
            { $push: { Topics: { $each: topicsToAdd } } },
            { new: true, runValidators: true }
        )

        if (!updatedBook) {
            return jsonRes(404, { status: false, mes: 'Không tìm thấy chương trình học.' })
        }

        reloadBook(id)

        return jsonRes(200, {
            status: true,
            mes: `Import thành công ${results.success} chủ đề.`,
            data: results.errors.length > 0 ? results : null
        })
    } catch (error) {
        if (error.name === 'ValidationError') {
            const firstKey = Object.keys(error.errors)[0]
            return jsonRes(400, { status: false, mes: error.errors[firstKey].message })
        }
        return jsonRes(500, { status: false, mes: error.message })
    }
}
