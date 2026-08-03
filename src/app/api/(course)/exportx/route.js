import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import { getCourseOne } from '@/data/database/course'
import ExcelJS from 'exceljs'
import authenticate from '@/utils/authenticate'

export const runtime = 'nodejs'

export async function POST(request) {
  await connectDB()
  try {
    const { user } = await authenticate(request)
    if (!user.role?.includes('Admin') && !user.role?.includes('Academic')) {
      return NextResponse.json({ status: 0, mes: 'Bạn không có quyền truy cập chức năng này.' }, { status: 403 })
    }

    const body = await request.json()
    const { courseId } = body
    if (!courseId) {
      return NextResponse.json({ status: 0, mes: 'Thiếu courseId' }, { status: 400 })
    }

    const course = await getCourseOne(courseId)
    if (!course) {
      return NextResponse.json({ status: 0, mes: 'Không tìm thấy khóa học' }, { status: 404 })
    }

    const students = course.Student || []
    if (students.length === 0) {
      return NextResponse.json({ status: 0, mes: 'Khóa học không có học sinh' }, { status: 400 })
    }

    const workbook = new ExcelJS.Workbook()
    const ws = workbook.addWorksheet('Danh sách học sinh')

    ws.columns = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'ID học sinh', key: 'id', width: 14 },
      { header: 'Họ tên', key: 'name', width: 30 },
      { header: 'ID khóa học', key: 'courseId', width: 14 },
      { header: 'Tên khóa học', key: 'courseName', width: 30 },
      { header: 'Trạng thái học phí', key: 'feeStatus', width: 18 },
      { header: 'Link ePortfolio', key: 'eport', width: 45 },
    ]

    students.forEach((student, index) => {
      ws.addRow({
        stt: index + 1,
        id: student.ID || '',
        name: student.Name || '',
        courseId: course.ID || '',
        courseName: course.Book?.Name || '',
        feeStatus: student.StatusCourse ? 'Đã thanh toán' : 'Chưa thanh toán',
        eport: student.userId ? `https://airobotic.edu.vn/e-portfolio/${student.userId}` : '',
      })
    })

    ws.getRow(1).font = { bold: true }
    ws.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    }
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    const buf = await workbook.xlsx.writeBuffer()

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Danh_sach_hoc_sinh_${course.ID}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ status: 0, mes: error.message || 'Lỗi server' }, { status: 500 })
  }
}

export async function PUT(request) {
  return POST(request)
}