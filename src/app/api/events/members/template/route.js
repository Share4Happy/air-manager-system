import ExcelJS from 'exceljs';
import { authorize } from '@/utils/authorize';

export async function GET(request) {
    try {
        const auth = await authorize(request);
        if (!auth.authorized) return auth.response;

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
        ws.addRow(['Nguyễn Văn An', 'Trưởng ban tổ chức', 'AI Robotic Center', '0901234567', 'an.nguyen@example.com', 'Phụ trách chung toàn bộ kế hoạch']);
        ws.addRow(['Trần Thị Mai', 'Thư ký', 'AI Robotic Center', '0912345678', 'mai.tran@example.com', 'Tổng hợp kế hoạch và quản lý task']);
        ws.addRow(['Lê Hoàng Nam', 'Quản lý', 'AI Robotic Center', '0987654321', 'nam.le@example.com', 'Điều phối kỹ thuật và nhân sự']);
        ws.addRow(['Phạm Minh Tuấn', 'Thành viên', 'CLB Robot Trẻ', '0933445566', 'tuan.pham@example.com', 'Phụ trách hỗ trợ trạm thi đấu']);
        ws.addRow(['Hoàng Thu Hà', 'Tình nguyện viên', 'Đại học Bách Khoa', '0944556677', 'ha.hoang@example.com', 'Hỗ trợ bàn đón tiếp và check-in']);

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
