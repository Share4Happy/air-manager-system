import authenticate from '@/utils/authenticate';
import jsonRes from '@/utils/response';
import student from '@/models/student';
import { senMesByPhone } from '@/function/drive/appscript';

export async function PATCH(request) {
    const { user, body } = await authenticate(request);
    const { _id, cmt } = body;
    if (!_id || !cmt) {
        return jsonRes(400, { status: false, message: "Thiếu thông tin cần thiết" });
    }
    let studentone = await student.findOne({ _id });
    if (studentone.Uid) {
        let sen = await senMesByPhone({ message: cmt, uid: studentone.Uid });
    } else {
        let sen = await senMesByPhone({ message: cmt, phone: studentone.Phone });
        await student.findByIdAndUpdate(_id, { $set: { Uid: sen.data } });
        if (!studentone.Phone) {
            return jsonRes(404, { status: false, message: "Học sinh không có số điện thoại" });
        }
    }
    return jsonRes(200, { status: true, message: "Cập nhật thành công" });
}
