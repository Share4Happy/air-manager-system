import connectDB from '@/config/connectDB'
import PostStudent from '@/models/student'
import Area from '@/models/area'
import jsonRes from '@/utils/response'
import { statusStudent } from '@/data/default'
import { reloadStudent } from '@/data/actions/reload'
import authenticate from '@/utils/authenticate'
import ExcelJS from 'exceljs'

export async function GET(request) {
    await connectDB()
    try {
        const { user } = await authenticate(request)
        if (!user.role.includes('Admin') && !user.role.includes('Academic')) {
            return jsonRes(403, { status: false, mes: 'Bạn không có quyền truy cập chức năng này.' })
        }

        const workbook = new ExcelJS.Workbook()
        const ws = workbook.addWorksheet('Học sinh')
        ws.columns = [
            { header: 'Name', width: 25 },
            { header: 'BD', width: 15 },
            { header: 'School', width: 20 },
            { header: 'ParentName', width: 20 },
            { header: 'Phone', width: 15 },
            { header: 'Email', width: 25 },
            { header: 'Address', width: 25 },
            { header: 'Area', width: 15 },
        ]
        ws.addRow(['Nguyễn Văn A', '01/01/2015', 'TH Lê Lợi', 'Chị Mai', '0912345678', 'a@email.com', '12 Lý Tự Trọng', 'Quận 1'])

        const buf = await workbook.xlsx.writeBuffer()
        return new Response(buf, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="mau-nhap-hoc-sinh.xlsx"',
            },
        })
    } catch (error) {
        return jsonRes(500, { status: false, mes: error.message })
    }
}

export async function POST(request) {
    await connectDB()
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
                BD: row.getCell(2).value,
                School: String(row.getCell(3).value || '').trim(),
                ParentName: String(row.getCell(4).value || '').trim(),
                Phone: String(row.getCell(5).value || '').trim(),
                Email: String(row.getCell(6).value || '').trim(),
                Address: String(row.getCell(7).value || '').trim(),
                Area: String(row.getCell(8).value || '').trim(),
            })
        })

        if (rows.length === 0) {
            return jsonRes(400, { status: false, mes: 'File không có dữ liệu.' })
        }

        const areaMap = {}
        const areas = await Area.find({}).select('name').lean()
        areas.forEach(a => { areaMap[a.name.toLowerCase().trim()] = a._id })

        const results = { success: 0, errors: [] }
        const studentsToInsert = []
        let lastStudent = await PostStudent.findOne({ ID: /^AI\d{4}$/ }).sort({ ID: -1 }).select('ID').lean()
        let nextIdNumber = lastStudent ? parseInt(lastStudent.ID.slice(2), 10) + 1 : 1

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            const rowNum = i + 2

            const name = row.Name
            if (!name) {
                results.errors.push({ row: rowNum, mes: 'Thiếu họ tên (Name)' })
                continue
            }

            const phone = row.Phone
            if (!phone) {
                results.errors.push({ row: rowNum, mes: 'Thiếu số điện thoại (Phone)' })
                continue
            }

            const parentName = row.ParentName
            if (!parentName) {
                results.errors.push({ row: rowNum, mes: 'Thiếu tên phụ huynh (ParentName)' })
                continue
            }

            const areaName = row.Area
            let areaId = null
            if (areaName) {
                areaId = areaMap[areaName.toLowerCase()]
                if (!areaId) {
                    results.errors.push({ row: rowNum, mes: `Khu vực "${areaName}" không tồn tại` })
                    continue
                }
            }

            const id = 'AI' + String(nextIdNumber).padStart(4, '0')
            nextIdNumber++

            let bd = null
            if (row.BD) {
                if (row.BD instanceof Date) {
                    bd = row.BD
                } else {
                    try { bd = new Date(row.BD) } catch { bd = null }
                }
            }

            studentsToInsert.push({
                ID: id,
                Name: name,
                BD: bd,
                School: row.School || undefined,
                ParentName: parentName,
                Phone: phone,
                Email: row.Email || undefined,
                Address: row.Address || undefined,
                Area: areaId || undefined,
                Profile: { Avatar: '', ImgPJ: [], ImgSkill: '', Intro: '', Present: [], Skill: {} },
                Status: [statusStudent({})],
            })
            results.success++
        }

        if (studentsToInsert.length > 0) {
            await PostStudent.insertMany(studentsToInsert)
        }

        reloadStudent()

        return jsonRes(200, {
            status: true,
            mes: `Import thành công ${results.success} học sinh.`,
            data: results.errors.length > 0 ? results : null
        })
    } catch (error) {
        return jsonRes(500, { status: false, mes: error.message })
    }
}
