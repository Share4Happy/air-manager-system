export const runtime = 'nodejs';

function jsonRes(obj, status = 200) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
}

export async function POST(request) {
    return jsonRes({ status: 0, mes: 'Tính năng đang bảo trì' }, 503);
}

export async function PUT(request) {
    return jsonRes({ status: 0, mes: 'Tính năng đang bảo trì' }, 503);
}