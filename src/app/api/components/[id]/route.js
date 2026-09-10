import connectDB from '@/config/connectDB';
import Component from '@/models/component';
import jsonRes from '@/utils/response';
import authenticate from '@/utils/authenticate';

export async function GET(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const component = await Component.findById(id).lean();
        if (!component) {
            return jsonRes(404, { status: false, mes: 'Không tìm thấy linh kiện.' });
        }
        return jsonRes(200, { status: true, data: component });
    } catch (err) {
        console.error('Error fetching component detail:', err);
        return jsonRes(500, { status: false, mes: err.message });
    }
}

export async function PUT(request, { params }) {
    try {
        const { user, body } = await authenticate(request);
        await connectDB();
        const { id } = await params;

        const component = await Component.findById(id);
        if (!component) {
            return jsonRes(404, { status: false, mes: 'Không tìm thấy linh kiện.' });
        }

        const {
            name,
            code,
            category,
            minQuantity,
            unit,
            location,
            unitPrice,
            supplier,
            datasheetUrl,
            imageUrl,
            description,
            tags,
            status
        } = body;

        if (name !== undefined) component.name = name.trim();
        if (code !== undefined) component.code = code.trim();
        if (category !== undefined) component.category = category;
        if (minQuantity !== undefined) component.minQuantity = Math.max(0, Number(minQuantity) || 0);
        if (unit !== undefined) component.unit = unit.trim();
        if (location !== undefined) component.location = location.trim();
        if (unitPrice !== undefined) component.unitPrice = Math.max(0, Number(unitPrice) || 0);
        if (supplier !== undefined) component.supplier = supplier.trim();
        if (datasheetUrl !== undefined) component.datasheetUrl = datasheetUrl.trim();
        if (imageUrl !== undefined) component.imageUrl = imageUrl.trim();
        if (description !== undefined) component.description = description.trim();
        if (tags !== undefined) component.tags = Array.isArray(tags) ? tags : [];

        if (status !== undefined) {
            component.status = status;
        } else if (component.status !== 'discontinued') {
            if (component.quantity <= 0) {
                component.status = 'out_of_stock';
            } else if (component.quantity <= component.minQuantity) {
                component.status = 'low_stock';
            } else {
                component.status = 'in_stock';
            }
        }

        await component.save();
        return jsonRes(200, { status: true, data: component, mes: 'Cập nhật linh kiện thành công.' });
    } catch (err) {
        console.error('Error updating component:', err);
        const code = err.message === 'Authentication failed' ? 401 : 500;
        return jsonRes(code, { status: false, mes: err.message });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { user } = await authenticate(request);
        await connectDB();
        const { id } = await params;

        const deleted = await Component.findByIdAndDelete(id);
        if (!deleted) {
            return jsonRes(404, { status: false, mes: 'Không tìm thấy linh kiện cần xóa.' });
        }

        return jsonRes(200, { status: true, data: deleted, mes: 'Xóa linh kiện thành công.' });
    } catch (err) {
        console.error('Error deleting component:', err);
        const code = err.message === 'Authentication failed' ? 401 : 500;
        return jsonRes(code, { status: false, mes: err.message });
    }
}
