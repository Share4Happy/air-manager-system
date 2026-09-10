import ExcelJS from 'exceljs';

export async function GET() {
    try {
        const workbook = new ExcelJS.Workbook();
        const ws = workbook.addWorksheet('Danh sách thiết bị mang theo');

        // Define columns
        ws.columns = [
            { header: 'Tên thiết bị / linh kiện (*)', key: 'name', width: 34 },
            { header: 'Phân loại (*)', key: 'category', width: 28 },
            { header: 'Số lượng (*)', key: 'quantity', width: 14 },
            { header: 'Đơn vị tính', key: 'unit', width: 16 },
            { header: 'Trạm / Khu vực phụ trách', key: 'assignedStation', width: 28 },
            { header: 'Người phụ trách / Bàn giao', key: 'assigneeName', width: 26 },
            { header: 'Tình trạng', key: 'condition', width: 20 },
            { header: 'Ghi chú thêm', key: 'notes', width: 36 },
        ];

        // Style header row
        const headerRow = ws.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2563EB' }, // Blue-600
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 30;

        // Sample rows with typical STEM & Robotics event items
        ws.addRow([
            'Robot thi đấu AI / Dò line tự hành',
            'Mô hình Robot',
            6,
            'Con',
            'Sân thi đấu bảng B',
            'Nguyễn Văn An',
            'Tốt',
            'Kèm theo tay cầm điều khiển & cáp nạp code',
        ]);
        ws.addRow([
            'Bộ Kit trải nghiệm lắp ráp Microbit STEM',
            'Bộ Kit học tập',
            15,
            'Hộp',
            'Khu trải nghiệm Lắp ráp',
            'Trần Thị Mai',
            'Tốt',
            'Kiểm tra đủ ốc vít và thanh nối',
        ]);
        ws.addRow([
            'Pin sạc Li-ion 18650 & Đốc sạc 4 cổng',
            'Linh kiện & Pin',
            12,
            'Viên',
            'Trạm Kỹ thuật & Sạc pin',
            'Lê Hoàng Nam',
            'Cần sạc pin',
            'Sạc đầy trước 07:30 sáng sự kiện',
        ]);
        ws.addRow([
            'Laptop điều phối & nạp code Arduino',
            'Laptop & Thiết bị số',
            2,
            'Máy',
            'Bàn Ban Giám khảo',
            'Phạm Minh Tuấn',
            'Tốt',
            'Đã cài sẵn phần mềm nạp mã nguồn',
        ]);
        ws.addRow([
            'Bộ dụng cụ tua vít đa năng & kìm nhổ',
            'Dụng cụ & Kỹ thuật',
            3,
            'Hộp',
            'Trạm Kỹ thuật',
            'Nguyễn Văn An',
            'Tốt',
            'Để ở bàn cứu hộ kỹ thuật robot',
        ]);
        ws.addRow([
            'Mô hình Sa bàn thi đấu chuẩn VEX/FLL',
            'Sa bàn, Backdrop & Quà',
            2,
            'Bộ',
            'Sân thi đấu trung tâm',
            'Hoàng Thu Hà',
            'Tốt',
            'Gồm thảm trải sàn và khung chắn mica',
        ]);
        ws.addRow([
            'Huy chương & Giấy chứng nhận tham gia',
            'Sa bàn, Backdrop & Quà',
            30,
            'Cái',
            'Bàn Lễ tân & Trao giải',
            'Trần Thị Mai',
            'Tốt',
            'Đóng hộp carton chống trầy xước',
        ]);

        // Style data rows
        ws.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.alignment = { vertical: 'middle' };
                row.height = 24;
                // Center align quantity & unit & condition
                row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
                row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
                row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };
            }
        });

        const buf = await workbook.xlsx.writeBuffer();

        return new Response(buf, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="mau-checklist-thiet-bi-su-kien.xlsx"',
            },
        });
    } catch (error) {
        console.error('Error generating equipment template:', error);
        return new Response(JSON.stringify({ success: false, message: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
