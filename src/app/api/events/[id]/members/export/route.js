import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import Event from '@/models/event';
import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import { formatDate } from '@/function';

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'ID không hợp lệ' }, { status: 400 });
        }

        await connectDB();
        const event = await Event.findById(id).lean();
        if (!event) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy sự kiện' }, { status: 404 });
        }

        const members = event.members || [];

        const workbook = new ExcelJS.Workbook();
        const ws = workbook.addWorksheet('Danh sách thành viên');

        ws.columns = [
            { header: 'STT', key: 'stt', width: 8 },
            { header: 'Họ và tên', key: 'name', width: 26 },
            { header: 'Vai trò', key: 'role', width: 22 },
            { header: 'Đơn vị / Trường', key: 'organization', width: 28 },
            { header: 'Số điện thoại', key: 'phone', width: 16 },
            { header: 'Email', key: 'email', width: 26 },
            { header: 'Điểm danh (Check-in)', key: 'checkInStatus', width: 22 },
            { header: 'Thời gian Check-in', key: 'checkInTime', width: 22 },
            { header: 'Ghi chú', key: 'notes', width: 30 },
        ];

        // Header style
        const headerRow = ws.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1E40AF' }, // Blue-800
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 28;

        members.forEach((m, idx) => {
            const row = ws.addRow({
                stt: idx + 1,
                name: m.name || '',
                role: m.role || 'Thành viên',
                organization: m.organization || '',
                phone: m.phone || '',
                email: m.email || '',
                checkInStatus: m.checkInStatus ? '✓ ĐÃ CHECK-IN' : 'Chưa điểm danh',
                checkInTime: m.checkInTime ? new Date(m.checkInTime).toLocaleString('vi-VN') : '',
                notes: m.notes || '',
            });

            row.alignment = { vertical: 'middle' };
            row.height = 22;

            if (m.checkInStatus) {
                row.getCell(7).font = { bold: true, color: { argb: 'FF059669' } }; // Green-600
            }
        });

        const buf = await workbook.xlsx.writeBuffer();
        const safeCode = (event.code || 'EVENT').replace(/[^a-zA-Z0-9_-]/g, '_');

        return new Response(buf, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="Danh_sach_thanh_vien_${safeCode}.xlsx"`,
            },
        });
    } catch (error) {
        console.error('Error exporting members:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
