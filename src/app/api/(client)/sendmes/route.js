import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { sendByPhone, getActiveZaloAccount, extractSendUid, sendResponseOk, sendResponseError } from '@/function/zalolite';

const SHEET_ID = '1ZQsHUyVD3vmafcm6_egWup9ErXfxIg4U-TfVDgDztb8';
const SHEET_NAME = 'Data';

/* ───────── Google Sheets client ───────── */
function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        projectId: process.env.GOOGLE_PROJECT_ID,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
}

/* ───────── helpers ───────── */
const normalize = s => s.toString().trim().toLowerCase();
const stdPhone = p => {
    p = p.toString().trim();
    if (p[0] === '0') p = '84' + p.slice(1);
    if (!p.startsWith('84')) p = '84' + p;
    return p;
};
const parseArray = raw => {
    try { const a = JSON.parse(raw); return Array.isArray(a) ? a.map(String) : []; }
    catch { return []; }
};

/* ───────── main ───────── */
export async function POST(req) {
    /* body */
    let body;
    try { body = await req.json(); }
    catch { return NextResponse.json({ status: 1, mes: '', data: [] }); }

    const { phone, mes, labels } = body;
    if (!phone || typeof mes !== 'string')
        return NextResponse.json({ status: 1, mes, data: [] });

    /* sheets client */
    let sheets;
    try { sheets = getSheetsClient(); }
    catch { return NextResponse.json({ status: 0, mes, data: [] }); }

    /* ── lấy trước dữ liệu A:M để biết UID, label, row ── */
    const { data: { values = [] } } = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A:M`,
        fields: 'values',
    });

    const targetPhone = stdPhone(phone);
    let rowIdx = null;           // 1-based, null nếu chưa có
    let rawLabel = '';
    let rawUid = '';

    values.forEach((row, i) => {
        const ph = row[1];
        if (ph && stdPhone(ph) === targetPhone) {
            rowIdx = i + 1;
            rawLabel = row[11] || '';   
            rawUid = row[12] || '';   
        }
    });

    const result = { phone, status: 'failed' };
    try {
        const zaloAccount = await getActiveZaloAccount();
        const r = await sendByPhone(zaloAccount.botId, { phone, text: mes, mode: 'safe' });

        if (sendResponseOk(r)) {
            result.status = 'success';
            const resolvedUid = extractSendUid(r);
            if (resolvedUid) result.uid = resolvedUid;
            result.name = r?.data?.results?.[0]?.name || '';
            if (!result.name) result.mes = mes;
        } else {
            result.error = sendResponseError(r);
        }
    } catch (e) { result.error = e.message; }
    const updates = [];
    const addLabels = Array.isArray(labels)
        ? labels.map(String).map(s => s.trim()).filter(Boolean)
        : [];

    if (rowIdx && addLabels.length) {
        const existed = parseArray(rawLabel);
        const merged = [...new Map([...existed, ...addLabels]
            .map(lb => [normalize(lb), lb])).values()];

        if (JSON.stringify(existed) !== JSON.stringify(merged)) {
            updates.push({
                range: `${SHEET_NAME}!L${rowIdx}`,
                values: [[JSON.stringify(merged)]]
            });
        }
    }

    if (rowIdx && !rawUid && result.uid) {
        updates.push({
            range: `${SHEET_NAME}!M${rowIdx}`,
            values: [[`[${result.uid},${result.name}]`]]
        });
    }

    if (updates.length) {
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: { valueInputOption: 'RAW', data: updates }
        });
    }
    
    return NextResponse.json({
        status: result.status === 'success' ? 2 : 1,
        mes,
        data: [result]
    });
}
