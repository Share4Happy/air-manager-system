import connectDB from '@/config/connectDB';
import Component from '@/models/component';
import jsonRes from '@/utils/response';
import authenticate from '@/utils/authenticate';

export async function POST(request, { params }) {
    try {
        const { user, body } = await authenticate(request);
        await connectDB();
        const { id } = await params;

        const component = await Component.findById(id);
        if (!component) {
            return jsonRes(404, { status: false, mes: 'Không tìm thấy linh kiện.' });
        }

        const { type, quantity, reason = '', className = '' } = body;
        const numQty = Number(quantity);

        if (!['import', 'export', 'adjust', 'damaged', 'lost'].includes(type)) {
            return jsonRes(400, { status: false, mes: 'Loại giao dịch không hợp lệ.' });
        }

        if (isNaN(numQty) || numQty <= 0) {
            return jsonRes(400, { status: false, mes: 'Số lượng phải lớn hơn 0.' });
        }

        let change = 0;
        let newTotal = component.quantity;

        if (type === 'import') {
            change = numQty;
            newTotal = component.quantity + numQty;
        } else if (type === 'export' || type === 'damaged' || type === 'lost') {
            if (numQty > component.quantity) {
                return jsonRes(400, {
                    status: false,
                    mes: `Số lượng xuất kho (${numQty}) vượt quá tồn kho hiện tại (${component.quantity} ${component.unit}).`
                });
            }
            change = -numQty;
            newTotal = component.quantity - numQty;
        } else if (type === 'adjust') {
            // Adjust sets the exact new stock quantity
            change = numQty - component.quantity;
            newTotal = numQty;
        }

        component.quantity = Math.max(0, newTotal);

        if (component.status !== 'discontinued') {
            if (component.quantity <= 0) {
                component.status = 'out_of_stock';
            } else if (component.quantity <= component.minQuantity) {
                component.status = 'low_stock';
            } else {
                component.status = 'in_stock';
            }
        }

        const transactionEntry = {
            type,
            quantityChange: change,
            quantityAfter: component.quantity,
            reason: reason.trim(),
            className: className.trim(),
            createdBy: user._id,
            creatorName: user.name || 'Người dùng',
            createdAt: new Date()
        };

        component.history.unshift(transactionEntry);

        await component.save();

        return jsonRes(200, {
            status: true,
            data: component,
            mes: 'Ghi nhận biến động kho thành công.'
        });
    } catch (err) {
        console.error('Error logging component stock transaction:', err);
        const code = err.message === 'Authentication failed' ? 401 : 500;
        return jsonRes(code, { status: false, mes: err.message });
    }
}
