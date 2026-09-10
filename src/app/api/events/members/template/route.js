import ExcelJS from 'exceljs';

export async function GET() {
    try {
        const workbook = new ExcelJS.Workbook();
        const ws = workbook.addWorksheet('Danh sách thành viên');

        // Define columns
        ws.columns = [
            { header: 'Họ và tên (*)', key: 'name', width: 28 },
            { header: 'Vai trò (*)', key: 'role', width: 24 },
            { header: 'Đơn vị / Trường / Tổ chức', key: 'organization', width: 30 },
            { header: 'Số điện thoại', key: 'phone', width: 18 },
            { header: 'Email', key: 'email', width: 28 },
            { header: 'Ghi chú', key: 'notes', width: 35 },
        ];

        // Style header row
        const headerRow = ws.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2563EB' }, // Blue-600
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 28;

        // Sample rows with typical event roles
        ws.addRow(['Nguyễn Văn An', 'Trọng tài / Giám khảo', 'Đại học Bách Khoa TP.HCM', '0901234567', 'an.nguyen@example.com', 'Phụ trách chấm sân thi đấu Robot bảng B']);
        ws.addRow(['Trần Thị Mai', 'Tình nguyện viên', 'CLB Robot Trẻ', '0912345678', 'mai.tran@example.com', 'Hỗ trợ check-in bàn đón tiếp']);
        ws.addRow(['Lê Hoàng Nam', 'Thí sinh / Học sinh', 'THCS Lê Lợi (Đội RoboAlpha)', '0987654321', 'nam.le@example.com', 'Thí sinh bảng A']);
        ws.addRow(['Phạm Minh Tuấn', 'Khách mời / Đại biểu', 'Sở Khoa Học & Công Nghệ', '0933445566', 'tuan.pham@example.com', 'Đại biểu danh dự']);
        ws.addRow(['Hoàng Thu Hà', 'Ban tổ chức', 'AI Robotic Center', '0944556677', 'ha.hoang@example.com', 'Điều phối viên sân thi đấu']);

        // Style sample rows
        ws.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.alignment = { vertical: 'middle' };
                row.height = 22;
            }
        });

        const buf = await workbook.xlsx.writeBuffer();

        return new Response(buf, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="mau-danh-sach-thanh-vien-su-kien.xlsx"',
            },
        });
    } catch (error) {
        console.error('Error generating template:', error);
        return new Response(JSON.stringify({ success: false, message: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
