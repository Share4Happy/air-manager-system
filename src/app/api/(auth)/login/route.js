import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import connectDB from '@/config/connectDB';
import users from '@/models/users';

const loginAttempts = new Map();

const FIFTEEN_MIN = 15 * 60 * 1000;
const TWENTY_FOUR_H = 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getAttempts(key) {
  const entry = loginAttempts.get(key);
  if (!entry) return null;
  if (entry.banUntil && Date.now() > entry.banUntil) {
    if (entry.banLevel === 1 && entry.count >= MAX_ATTEMPTS) {
      // After 15-min ban expires, next fail -> 24h ban
      entry.banLevel = 2;
      entry.banUntil = Date.now() + TWENTY_FOUR_H;
      entry.count = 0;
    } else {
      loginAttempts.delete(key);
      return null;
    }
  }
  return entry;
}

function recordFail(key) {
  let entry = loginAttempts.get(key);
  if (!entry) {
    entry = { count: 0, banUntil: null, banLevel: 0 };
    loginAttempts.set(key, entry);
  }
  if (entry.banUntil) return entry;
  entry.count++;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.banLevel = 1;
    entry.banUntil = Date.now() + FIFTEEN_MIN;
  }
  return entry;
}

function recordSuccess(key) {
  loginAttempts.delete(key);
}

export async function POST(req) {
  try {
    await connectDB();
    const { email, password, re } = await req.json();
    if (!email) return jsonRes(400, { status: 1, mes: 'Email không hợp lệ!', data: [] });

    const key = email.toLowerCase().trim();
    const attempts = getAttempts(key);
    if (attempts?.banUntil) {
      const remaining = Math.ceil((attempts.banUntil - Date.now()) / 60000);
      const level = attempts.banLevel === 2 ? '24 giờ' : '15 phút';
      return jsonRes(429, { status: 1, mes: `Tài khoản tạm thời bị khóa. Vui lòng thử lại sau ${remaining} phút (khóa ${level}).`, data: [] });
    }

    const user = await users.findOne({ email }).lean();
    if (!user) {
      recordFail(key);
      return jsonRes(404, { status: 1, mes: 'Tài khoản không tồn tại!', data: [] });
    }

    if (user.status === false) return jsonRes(403, { status: 1, mes: 'Tài khoản đã bị vô hiệu hóa!', data: [] });

    const ok = await bcrypt.compare(password, user.uid);
    if (!ok) {
      const entry = recordFail(key);
      if (entry.banUntil) {
        const remaining = Math.ceil((entry.banUntil - Date.now()) / 60000);
        return jsonRes(429, { status: 1, mes: `Sai mật khẩu ${MAX_ATTEMPTS} lần. Tài khoản bị khóa ${remaining} phút.`, data: [] });
      }
      return jsonRes(401, { status: 1, mes: `Mật khẩu không chính xác! Còn ${MAX_ATTEMPTS - entry.count} lần thử.`, data: [] });
    }

    recordSuccess(key);

    const jwtLife = re ? '30d' : '1h';
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: jwtLife }
    );
    const opts = {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    };
    if (re) opts.maxAge = 60 * 60 * 24 * 30;

    const cookieStore = await cookies();
    cookieStore.set(process.env.token, accessToken, opts);

    return jsonRes(200, { status: 2, mes: 'Đăng nhập thành công', data: [] });
  } catch (err) {
    console.error(err);
    return jsonRes(500, { status: 1, mes: 'Lỗi máy chủ', data: [] });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
function jsonRes(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}
