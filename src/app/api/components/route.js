import connectDB from '@/config/connectDB';
import Component from '@/models/component';
import jsonRes from '@/utils/response';
import authenticate from '@/utils/authenticate';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search')?.trim() || '';
        const category = searchParams.get('category')?.trim() || '';
        const status = searchParams.get('status')?.trim() || '';
        const location = searchParams.get('location')?.trim() || '';

        const filter = {};
        if (category && category !== 'all') {
            filter.category = category;
        }
        if (status && status !== 'all') {
            filter.status = status;
        }
        if (location) {
            filter.location = { $regex: location, $options: 'i' };
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const [components, allComponents] = await Promise.all([
            Component.find(filter).sort({ updatedAt: -1 }).lean(),
            Component.find({}).select('quantity minQuantity unitPrice status').lean()
        ]);

        // Calculate summary stats
        let totalItems = allComponents.length;
        let totalQuantity = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;
        let totalValue = 0;

        for (const item of allComponents) {
            const q = Number(item.quantity) || 0;
            const p = Number(item.unitPrice) || 0;
            totalQuantity += q;
            totalValue += q * p;
            if (q === 0 || item.status === 'out_of_stock') {
                outOfStockCount++;
            } else if (q <= (item.minQuantity || 5) || item.status === 'low_stock') {
                lowStockCount++;
            }
        }

        return jsonRes(200, {
            status: true,
            data: components,
            stats: {
                totalItems,
                totalQuantity,
                lowStockCount,
                outOfStockCount,
                totalValue
            }
        });
    } catch (err) {
        console.error('Error fetching components:', err);
        return jsonRes(500, { status: false, mes: err.message, data: [] });
    }
}

export async function POST(request) {
    try {
        const { user, body } = await authenticate(request);
        await connectDB();

        const {
            name,
            code,
            category,
            quantity = 0,
            minQuantity = 5,
            unit = 'Cái',
            location = '',
            unitPrice = 0,
            supplier = '',
            datasheetUrl = '',
            imageUrl = '',
            description = '',
            tags = []
        } = body;

        if (!name?.trim()) {
            return jsonRes(400, { status: false, mes: 'Tên linh kiện không được để trống.' });
        }

        const numQty = Math.max(0, Number(quantity) || 0);
        const numMinQty = Math.max(0, Number(minQuantity) || 5);
        const numPrice = Math.max(0, Number(unitPrice) || 0);

        let initialStatus = 'in_stock';
        if (numQty === 0) initialStatus = 'out_of_stock';
        else if (numQty <= numMinQty) initialStatus = 'low_stock';

        const history = [];
        if (numQty > 0) {
            history.push({
                type: 'import',
                quantityChange: numQty,
                quantityAfter: numQty,
                reason: 'Khởi tạo số lượng tồn kho ban đầu',
                createdBy: user._id,
                creatorName: user.name || 'Hệ thống',
                createdAt: new Date()
            });
        }

        const component = await Component.create({
            name: name.trim(),
            code: code?.trim() || '',
            category: category || 'khac',
            quantity: numQty,
            minQuantity: numMinQty,
            unit: unit?.trim() || 'Cái',
            location: location?.trim() || '',
            unitPrice: numPrice,
            supplier: supplier?.trim() || '',
            datasheetUrl: datasheetUrl?.trim() || '',
            imageUrl: imageUrl?.trim() || '',
            status: initialStatus,
            description: description?.trim() || '',
            tags: Array.isArray(tags) ? tags : [],
            history
        });

        return jsonRes(201, { status: true, data: component, mes: 'Thêm linh kiện thành công.' });
    } catch (err) {
        console.error('Error creating component:', err);
        const code = err.message === 'Authentication failed' ? 401 : 500;
        return jsonRes(code, { status: false, mes: err.message });
    }
}
