import authenticate from '@/utils/authenticate';
import jsonRes from '@/utils/response';
import student from '@/models/student';
import mongoose from 'mongoose';
import { sendByPhone, getActiveZaloAccount, extractSendUid, sendResponseOk, sendResponseError } from '@/function/zalolite';

export async function PATCH(request) {
    try {
        const { user, body } = await authenticate(request);
        const { _id, cmt } = body;
        if (!_id || !cmt) {
            return jsonRes(400, { status: false, message: "Thiếu thông tin cần thiết" });
        }
        const query = mongoose.Types.ObjectId.isValid(_id) ? { _id } : { ID: _id };
        let studentone = await student.findOne(query);
        if (!studentone) {
            return jsonRes(404, { status: false, message: "Không tìm thấy học sinh" });
        }
        if (!studentone.Phone) {
            return jsonRes(400, { status: false, message: "Học sinh không có số điện thoại" });
        }
        const zaloAccount = await getActiveZaloAccount();
        let sen = await sendByPhone(zaloAccount.botId, { phone: studentone.Phone, text: cmt, mode: 'safe' });
        if (sendResponseOk(sen)) {
            const resolvedUid = extractSendUid(sen);
            if (resolvedUid) {
                await student.findByIdAndUpdate(studentone._id, { $set: { Uid: resolvedUid } });
            }
            return jsonRes(200, { status: true, message: "Cập nhật thành công" });
        }
        return jsonRes(400, { status: false, message: sendResponseError(sen) || "Gửi tin nhắn thất bại" });
    } catch (err) {
        console.error('API /api/cmt error:', err);
        return jsonRes(500, { status: false, message: err.message || "Lỗi máy chủ" });
    }
}
