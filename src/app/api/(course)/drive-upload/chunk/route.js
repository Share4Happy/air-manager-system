import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const uploadUrl = formData.get('uploadUrl');
        const chunk = formData.get('chunk');
        const start = Number(formData.get('start'));
        const end = Number(formData.get('end'));
        const total = Number(formData.get('total'));

        if (!uploadUrl || !chunk) {
            return NextResponse.json(
                { status: 1, mes: 'Thiếu tham số bắt buộc (uploadUrl, chunk).' },
                { status: 400 }
            );
        }

        const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
        const contentRange = `bytes ${start}-${end - 1}/${total}`;

        const driveRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Length': String(chunkBuffer.length),
                'Content-Range': contentRange,
            },
            body: chunkBuffer,
        });

        // Nếu là chunk trung gian: Google Drive trả về HTTP 308 (Resume Incomplete)
        if (driveRes.status === 308) {
            const rangeHeader = driveRes.headers.get('range');
            return NextResponse.json({
                status: 2,
                completed: false,
                range: rangeHeader,
            });
        }

        // Nếu là chunk cuối: Google Drive trả về HTTP 200 hoặc 201
        if (driveRes.status === 200 || driveRes.status === 201) {
            const data = await driveRes.json();
            return NextResponse.json({
                status: 2,
                completed: true,
                fileId: data.id,
                data,
            });
        }

        const errText = await driveRes.text();
        console.error('Google Drive chunk upload error:', driveRes.status, errText);
        return NextResponse.json(
            { status: 1, mes: `Google Drive trả về lỗi (${driveRes.status}): ${errText}` },
            { status: driveRes.status }
        );

    } catch (error) {
        console.error('Lỗi API [POST /api/drive-upload/chunk]:', error);
        return NextResponse.json(
            { status: 1, mes: error.message || 'Lỗi server khi upload chunk.' },
            { status: 500 }
        );
    }
}
