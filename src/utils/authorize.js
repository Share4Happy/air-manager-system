import jwt from 'jsonwebtoken';
import { getCookieName, getJwtSecret } from '@/utils/env';
import CheckToken from '@/utils/checkuser';
import checkAuthToken from '@/utils/checktoken';
import connectDB from '@/config/connectDB';
import User from '@/models/users';
import jsonRes from '@/utils/response';

/**
 * Xác thực token và kiểm tra phân quyền người dùng (Role-Based Access Control)
 * @param {Request} [request] Đối tượng Next.js Request (nếu có)
 * @param {string[]} [allowedRoles] Mảng các vai trò được phép, ví dụ: ['Admin', 'Academic']
 * @returns {Promise<{ user?: Object, body?: any, errorResponse?: Response }>}
 */
export async function authorize(request, allowedRoles = []) {
    let tokenPayload = null;
    let body = null;

    if (request) {
        // 1. Kiểm tra header Authorization: Bearer <token>
        try {
            const authHeader = request.headers?.get?.('authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                tokenPayload = jwt.verify(token, getJwtSecret());
            }
        } catch (e) {
            // Ignore error
        }

        // 2. Kiểm tra cookie từ request
        if (!tokenPayload) {
            try {
                const cookieToken = request.cookies?.get?.(getCookieName())?.value;
                if (cookieToken) {
                    tokenPayload = jwt.verify(cookieToken, getJwtSecret());
                }
            } catch (e) {
                // Ignore error
            }
        }

        // 3. Fallback sang CheckToken (đọc body.source nếu có)
        if (!tokenPayload) {
            try {
                const result = await CheckToken(request);
                if (!result.error && result.user) {
                    tokenPayload = result.user;
                    body = result.body;
                }
            } catch (e) {
                // Ignore error
            }
        }
    }

    // 4. Fallback sang checkAuthToken() đọc từ next/headers cookies()
    if (!tokenPayload) {
        try {
            tokenPayload = await checkAuthToken();
        } catch (e) {
            // Ignore error
        }
    }

    const makeError = (status, msg) => {
        const res = jsonRes(status, { error: msg, mes: msg, status: false, message: msg });
        return {
            authorized: false,
            response: res,
            errorResponse: res,
            user: null,
            body: null,
        };
    };

    if (!tokenPayload || !tokenPayload.id) {
        return makeError(401, 'Yêu cầu đăng nhập để truy cập tài nguyên này.');
    }

    await connectDB();
    const user = await User.findById(tokenPayload.id).lean();

    if (!user) {
        return makeError(401, 'Không tìm thấy thông tin tài khoản.');
    }

    if (user.status === false) {
        return makeError(403, 'Tài khoản của bạn đã bị vô hiệu hóa.');
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const userRoles = Array.isArray(user.role) ? user.role : [user.role || ''];
        const hasPermission = userRoles.some(r =>
            allowedRoles.some(allowed => new RegExp(`^${allowed}$`, 'i').test(r))
        );

        if (!hasPermission) {
            return makeError(403, 'Bạn không có quyền thực hiện thao tác này.');
        }
    }

    return {
        authorized: true,
        response: null,
        errorResponse: null,
        user,
        body,
    };
}

export default authorize;
