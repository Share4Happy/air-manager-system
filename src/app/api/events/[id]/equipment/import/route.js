import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import Event from '@/models/event';
import checkAuthToken from '@/utils/checktoken';
import ExcelJS from 'exceljs';
import mongoose from 'mongoose';

// Normalize text for flexible category/condition matching
function normalizeStr(str) {
    return String(str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function matchCategory(input) {
    const text = normalizeStr(input);
    if (!text) return 'robot_model';

    if (text.includes('robot') || text.includes('mo hinh') || text.includes('tay cam')) {
        return 'robot_model';
    }
    if (text.includes('kit') || text.includes('hoc tap') || text.includes('lap rap') || text.includes('microbit') || text.includes('stem')) {
        return 'kit';
    }
    if (text.includes('linh kien') || text.includes('pin') || text.includes('mach') || text.includes('day') || text.includes('sac') || text.includes('dien') || text.includes('sensor') || text.includes('cam bien') || text.includes('dong co') || text.includes('motor')) {
        return 'electronics';
    }
    if (text.includes('laptop') || text.includes('may tinh') || text.includes('man hinh') || text.includes('tablet') || text.includes('ipad') || text.includes('so') || text.includes('may in') || text.includes('camera') || text.includes('may chieu')) {
        return 'laptop_screen';
    }
    if (text.includes('dung cu') || text.includes('ky thuat') || text.includes('tua vit') || text.includes('kim') || text.includes('bang keo') || text.includes('keo') || text.includes('oc') || text.includes('vit') || text.includes('tool') || text.includes('day rut') || text.includes('o cam')) {
        return 'tools';
    }
    if (text.includes('sa ban') || text.includes('backdrop') || text.includes('qua') || text.includes('bang') || text.includes('bang ron') || text.includes('banner') || text.includes('huy chuong') || text.includes('cup') || text.includes('chung nhan') || text.includes('standee') || text.includes('sticker') || text.includes('passport')) {
        return 'banner_props';
    }
    return 'other';
}

function matchCondition(input) {
    const text = normalizeStr(input);
    if (!text) return 'Tốt';

    if (text.includes('sac') || text.includes('het pin') || text.includes('yeu pin')) {
        return 'Cần sạc pin';
    }
    if (text.includes('thieu') || text.includes('mat') || text.includes('phu kien')) {
        return 'Thiếu phụ kiện';
    }
    if (text.includes('sua') || text.includes('hong') || text.includes('hu') || text.includes('loi') || text.includes('chap') || text.includes('dut')) {
        return 'Cần sửa/Hỏng';
    }
    return 'Tốt';
}

export async function POST(req, { params }) {
    try {
        const user = await checkAuthToken();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'ID sự kiện không hợp lệ' }, { status: 400 });
        }

        await connectDB();
        const event = await Event.findById(id);
        if (!event) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy sự kiện' }, { status: 404 });
        }

        const contentType = req.headers.get('content-type') || '';
        let importedItems = [];
        let mode = 'append'; // 'append' or 'replace'

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            const file = formData.get('file');
            mode = formData.get('mode') || 'append';

            if (!file) {
                return NextResponse.json({ success: false, message: 'Vui lòng chọn file Excel hoặc CSV' }, { status: 400 });
            }

            const buf = Buffer.from(await file.arrayBuffer());
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buf);

            const ws = workbook.worksheets[0];
            if (!ws) {
                return NextResponse.json({ success: false, message: 'File không có dữ liệu sheet' }, { status: 400 });
            }

            // Detect column positions by examining first row
            const headerMap = {};
            const firstRow = ws.getRow(1);
            firstRow.eachCell((cell, colNumber) => {
                const val = normalizeStr(cell.value);
                if (val.includes('ten') || val.includes('thiet bi') || val.includes('linh kien') || val.includes('item') || val.includes('name')) {
                    headerMap.name = colNumber;
                } else if (val.includes('phan loai') || val.includes('loai') || val.includes('danh muc') || val.includes('category')) {
                    headerMap.category = colNumber;
                } else if (val.includes('so luong') || val.includes('sl') || val.includes('qty') || val.includes('quantity') || val.includes('amount')) {
                    headerMap.quantity = colNumber;
                } else if (val.includes('don vi') || val.includes('dvt') || val.includes('unit')) {
                    headerMap.unit = colNumber;
                } else if (val.includes('tram') || val.includes('khu vuc') || val.includes('station') || val.includes('vi tri') || val.includes('san')) {
                    headerMap.assignedStation = colNumber;
                } else if (val.includes('phu trach') || val.includes('ban giao') || val.includes('nguoi') || val.includes('assignee') || val.includes('lead')) {
                    headerMap.assigneeName = colNumber;
                } else if (val.includes('tinh trang') || val.includes('trang thai') || val.includes('condition') || val.includes('status')) {
                    headerMap.condition = colNumber;
                } else if (val.includes('ghi chu') || val.includes('note') || val.includes('luu y')) {
                    headerMap.notes = colNumber;
                }
            });

            // Default column index fallbacks
            const nameCol = headerMap.name || 1;
            const catCol = headerMap.category || 2;
            const qtyCol = headerMap.quantity || 3;
            const unitCol = headerMap.unit || 4;
            const stationCol = headerMap.assignedStation || 5;
            const assigneeCol = headerMap.assigneeName || 6;
            const condCol = headerMap.condition || 7;
            const notesCol = headerMap.notes || 8;

            ws.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header

                const nameRaw = row.getCell(nameCol).value;
                const name = String(nameRaw || '').trim();
                if (!name) return;

                const catRaw = row.getCell(catCol).value;
                const category = matchCategory(catRaw);

                const qtyRaw = row.getCell(qtyCol).value;
                const quantity = Math.max(1, parseInt(Number(qtyRaw)) || 1);

                const unitRaw = row.getCell(unitCol).value;
                const unit = String(unitRaw || 'Bộ').trim();

                const stationRaw = row.getCell(stationCol).value;
                const assignedStation = String(stationRaw || '').trim();

                const assigneeRaw = row.getCell(assigneeCol).value;
                const assigneeName = String(assigneeRaw || '').trim();

                const condRaw = row.getCell(condCol).value;
                const condition = matchCondition(condRaw);

                const notesRaw = row.getCell(notesCol).value;
                const notes = String(notesRaw || '').trim();

                importedItems.push({
                    id: `eq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    name,
                    category,
                    quantity,
                    unit,
                    assignedStation,
                    assignee: null,
                    assigneeName,
                    isPacked: false,
                    packedAt: null,
                    isReturned: false,
                    returnedAt: null,
                    condition,
                    notes,
                });
            });
        } else {
            // Direct JSON payload
            const body = await req.json();
            mode = body.mode || 'append';
            const rawList = body.items || body.equipmentChecklist || [];

            importedItems = rawList.map(item => ({
                id: item.id || `eq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: (item.name || '').trim(),
                category: item.category || matchCategory(item.categoryLabel || item.category),
                quantity: Math.max(1, parseInt(Number(item.quantity)) || 1),
                unit: (item.unit || 'Bộ').trim(),
                assignedStation: (item.assignedStation || '').trim(),
                assignee: item.assignee || null,
                assigneeName: (item.assigneeName || '').trim(),
                isPacked: !!item.isPacked,
                packedAt: item.packedAt || null,
                isReturned: !!item.isReturned,
                returnedAt: item.returnedAt || null,
                condition: item.condition || matchCondition(item.condition),
                notes: (item.notes || '').trim(),
            })).filter(it => it.name);
        }

        if (importedItems.length === 0) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy dòng thiết bị/linh kiện hợp lệ để import' }, { status: 400 });
        }

        let updatedChecklist = [];
        if (mode === 'replace') {
            updatedChecklist = importedItems;
        } else {
            // Append mode: merge with existing checklist
            const currentChecklist = event.equipmentChecklist || [];
            updatedChecklist = [...currentChecklist, ...importedItems];
        }

        event.equipmentChecklist = updatedChecklist;
        event.updatedBy = user.id || user._id;
        await event.save();

        return NextResponse.json({
            success: true,
            message: `Đã import thành công ${importedItems.length} thiết bị/linh kiện vào danh sách.`,
            count: importedItems.length,
            equipmentChecklist: event.equipmentChecklist,
        }, { status: 200 });
    } catch (error) {
        console.error('Error importing equipment checklist:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
