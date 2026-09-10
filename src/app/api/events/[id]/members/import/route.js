import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import Event from '@/models/event';
import checkAuthToken from '@/utils/checktoken';
import ExcelJS from 'exceljs';
import mongoose from 'mongoose';

export async function POST(req, { params }) {
    try {
        const user = await checkAuthToken();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'ID không hợp lệ' }, { status: 400 });
        }

        await connectDB();
        const event = await Event.findById(id);
        if (!event) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy sự kiện' }, { status: 404 });
        }

        const contentType = req.headers.get('content-type') || '';
        let importedMembers = [];
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
                const val = String(cell.value || '').toLowerCase().trim();
                if (val.includes('họ') || val.includes('tên') || val.includes('name')) headerMap.name = colNumber;
                else if (val.includes('vai trò') || val.includes('role') || val.includes('vị trí')) headerMap.role = colNumber;
                else if (val.includes('đơn vị') || val.includes('trường') || val.includes('tổ chức') || val.includes('org') || val.includes('school')) headerMap.organization = colNumber;
                else if (val.includes('điện thoại') || val.includes('phone') || val.includes('sđt') || val.includes('tel')) headerMap.phone = colNumber;
                else if (val.includes('email') || val.includes('mail')) headerMap.email = colNumber;
                else if (val.includes('ghi chú') || val.includes('note') || val.includes('nhiệm vụ')) headerMap.notes = colNumber;
            });

            // Default fallbacks if header names differ
            const nameCol = headerMap.name || 1;
            const roleCol = headerMap.role || 2;
            const orgCol = headerMap.organization || 3;
            const phoneCol = headerMap.phone || 4;
            const emailCol = headerMap.email || 5;
            const notesCol = headerMap.notes || 6;

            ws.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header

                const name = String(row.getCell(nameCol).value || '').trim();
                if (!name) return;

                const role = String(row.getCell(roleCol).value || '').trim() || 'Thành viên';
                const organization = String(row.getCell(orgCol).value || '').trim();
                const phone = String(row.getCell(phoneCol).value || '').trim();
                const email = String(row.getCell(emailCol).value || '').trim();
                const notes = String(row.getCell(notesCol).value || '').trim();

                importedMembers.push({
                    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    name,
                    role,
                    organization,
                    phone,
                    email,
                    notes,
                    isExternal: true,
                    checkInStatus: false,
                    checkInTime: null,
                });
            });
        } else {
            // Direct JSON payload (e.g. from Google Sheets paste)
            const body = await req.json();
            mode = body.mode || 'append';
            const rawList = body.members || [];

            importedMembers = rawList.map(item => ({
                id: item.id || `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: (item.name || '').trim(),
                role: (item.role || 'Thành viên').trim(),
                organization: (item.organization || '').trim(),
                phone: (item.phone || '').trim(),
                email: (item.email || '').trim(),
                notes: (item.notes || '').trim(),
                isExternal: item.isExternal !== undefined ? item.isExternal : true,
                checkInStatus: !!item.checkInStatus,
                checkInTime: item.checkInTime || null,
            })).filter(m => m.name);
        }

        if (importedMembers.length === 0) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy dòng dữ liệu hợp lệ để import' }, { status: 400 });
        }

        let updatedMembers = [];
        if (mode === 'replace') {
            updatedMembers = importedMembers;
        } else {
            // Append mode: merge with existing
            const currentMembers = event.members || [];
            updatedMembers = [...currentMembers, ...importedMembers];
        }

        event.members = updatedMembers;
        event.updatedBy = user.id || user._id;
        await event.save();

        return NextResponse.json({
            success: true,
            message: `Đã import thành công ${importedMembers.length} thành viên vào sự kiện.`,
            count: importedMembers.length,
            members: event.members,
        }, { status: 200 });
    } catch (error) {
        console.error('Error importing members:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
