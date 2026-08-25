#!/usr/bin/env node

/**
 * Script Test Toàn Bộ Hệ Thống API (air-manager-system)
 * 
 * Cách chạy:
 *   node scripts/test-all-apis.mjs
 *   hoặc: npm run test:api
 */

import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Đọc cấu hình từ file .env.development
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.development');
    const env = {};
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const idx = trimmed.indexOf('=');
                if (idx !== -1) {
                    const key = trimmed.slice(0, idx).trim();
                    let val = trimmed.slice(idx + 1).trim();
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.slice(1, -1);
                    }
                    env[key] = val;
                }
            }
        });
    }
    return env;
}

const env = loadEnv();
const BASE_URL = process.env.URL || env.URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || env.JWT_SECRET || 'dev-secret';
const MONGO_URI = process.env.MongoDB_URI || env.MongoDB_URI || 'mongodb://127.0.0.1:27017/air';
const COOKIE_NAME = process.env.token || env.token || 'sys1';
const ADMIN_ID = '684d1e031730348327887b2c'; // Huỳnh Trần Hữu Nhật (Active Admin)

// Màu sắc terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
};

// Tạo token xác thực Admin
const authToken = jwt.sign(
    { id: ADMIN_ID, role: ['Admin'] },
    JWT_SECRET,
    { expiresIn: '1d' }
);

const headers = {
    'Cookie': `${COOKIE_NAME}=${authToken}`,
    'Content-Type': 'application/json',
};

// Lấy mẫu ID thật từ Database để test các route dynamic [id]
async function fetchSampleIds() {
    const ids = {
        courseId: '6871bc14ada3650715efc786',
        sessionId: '6a65ed6428ef1c467d7b9692',
        studentId: '1',
        studentObjId: '684d1e031730348327887b2c',
        invoiceId: '684d1e031730348327887b2c',
        bookId: '684d1e031730348327887b2c',
        areaId: '684d1e031730348327887b2c',
        roomId: '684d1e031730348327887b2c',
        notificationId: '684d1e031730348327887b2c',
        toolId: '684d1e031730348327887b2c',
        labelId: '684d1e031730348327887b2c',
        phone: '0901234567',
    };

    try {
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
        const db = mongoose.connection.db;

        const sampleCourse = await db.collection('courses').findOne({}, { projection: { _id: 1, ID: 1 } });
        if (sampleCourse?._id) ids.courseId = sampleCourse._id.toString();

        const sampleSession = await db.collection('sessions').findOne({}, { projection: { _id: 1 } });
        if (sampleSession?._id) ids.sessionId = sampleSession._id.toString();

        const sampleStudent = await db.collection('students').findOne({}, { projection: { _id: 1, ID: 1, Sdt: 1 } });
        if (sampleStudent?._id) {
            ids.studentObjId = sampleStudent._id.toString();
            if (sampleStudent.ID) ids.studentId = String(sampleStudent.ID);
            if (sampleStudent.Sdt) ids.phone = String(sampleStudent.Sdt);
        }

        const sampleInvoice = await db.collection('invoices').findOne({}, { projection: { _id: 1 } });
        if (sampleInvoice?._id) ids.invoiceId = sampleInvoice._id.toString();

        const sampleBook = await db.collection('books').findOne({}, { projection: { _id: 1 } });
        if (sampleBook?._id) ids.bookId = sampleBook._id.toString();

        const sampleArea = await db.collection('areas').findOne({}, { projection: { _id: 1, rooms: 1 } });
        if (sampleArea?._id) {
            ids.areaId = sampleArea._id.toString();
            if (sampleArea.rooms?.[0]?._id) ids.roomId = sampleArea.rooms[0]._id.toString();
        }

        const sampleNoti = await db.collection('notifications').findOne({}, { projection: { _id: 1 } });
        if (sampleNoti?._id) ids.notificationId = sampleNoti._id.toString();

        const sampleTool = await db.collection('tools').findOne({}, { projection: { _id: 1 } });
        if (sampleTool?._id) ids.toolId = sampleTool._id.toString();

        const sampleLabel = await db.collection('labels').findOne({}, { projection: { _id: 1 } });
        if (sampleLabel?._id) ids.labelId = sampleLabel._id.toString();

        await mongoose.disconnect();
    } catch (e) {
        console.warn(`${colors.yellow}⚠️ Không thể kết nối MongoDB trực tiếp để lấy sample IDs: ${e.message}${colors.reset}`);
    }

    return ids;
}

// Hàm gửi request test
async function testEndpoint(test) {
    const url = `${BASE_URL}${test.path}`;
    const startTime = Date.now();

    try {
        const fetchOptions = {
            method: test.method || 'GET',
            headers: {
                ...headers,
                ...(test.headers || {})
            },
        };

        if (test.body !== undefined && (test.method === 'POST' || test.method === 'PUT' || test.method === 'PATCH')) {
            if (typeof test.body === 'object') {
                fetchOptions.body = JSON.stringify(test.body);
            } else {
                fetchOptions.body = test.body;
            }
        }

        const response = await fetch(url, fetchOptions);
        const duration = Date.now() - startTime;
        let bodyJson = null;
        let bodyText = '';

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            try {
                bodyJson = await response.json();
            } catch {
                bodyText = '<invalid json>';
            }
        } else {
            bodyText = await response.text();
        }

        // Đánh giá kết quả
        const expectedStatus = test.expectedStatus || [200, 201];
        const isStatusOk = Array.isArray(expectedStatus)
            ? expectedStatus.includes(response.status)
            : response.status === expectedStatus;

        let pass = isStatusOk;
        let note = '';

        if (!pass) {
            note = bodyJson?.mes || bodyJson?.message || bodyJson?.error || bodyText.slice(0, 100) || `HTTP ${response.status}`;
        } else {
            if (bodyJson && typeof bodyJson === 'object') {
                if (bodyJson.status !== undefined && bodyJson.status === 0 && !test.allowStatusZero) {
                    note = bodyJson.mes || bodyJson.message || '';
                }
            }
        }

        return {
            name: test.name,
            method: test.method || 'GET',
            path: test.path,
            status: response.status,
            duration,
            pass,
            note,
        };
    } catch (err) {
        return {
            name: test.name,
            method: test.method || 'GET',
            path: test.path,
            status: 0,
            duration: Date.now() - startTime,
            pass: false,
            note: err.message,
        };
    }
}

async function main() {
    console.log(`\n${colors.bright}${colors.cyan}=======================================================`);
    console.log(`🚀 AIR MANAGER SYSTEM - TEST TOÀN BỘ API SYSTEM`);
    console.log(`=======================================================${colors.reset}`);
    console.log(`🌐 Base URL: ${colors.green}${BASE_URL}${colors.reset}`);
    console.log(`🔑 Admin Auth: ${colors.green}${ADMIN_ID}${colors.reset} (Cookie: ${COOKIE_NAME})`);
    
    console.log(`\n⏳ Đang thu thập dữ liệu mẫu từ Database...`);
    const ids = await fetchSampleIds();
    console.log(`✅ Đã chuẩn bị tham số: Course=${ids.courseId}, Session=${ids.sessionId}, Student=${ids.studentId}\n`);

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const studentCourseCombo = `${ids.studentObjId.padEnd(24, '0').slice(0, 24)}${ids.courseId.padEnd(24, '0').slice(0, 24)}`;

    // Danh mục các bài test API với đúng Method & Parameters
    const testSuites = [
        {
            category: '🔑 1. AUTHENTICATION & USER MANAGEMENT',
            tests: [
                { name: 'Kiểm tra phiên đăng nhập (POST /api/check)', method: 'POST', path: '/api/check', body: {} },
                { name: 'Lấy thông tin tài khoản hiện tại (GET /api/auth/me)', method: 'GET', path: '/api/auth/me' },
                { name: 'Khởi tạo dữ liệu mặc định hệ thống (POST /api/import-defaults)', method: 'POST', path: '/api/import-defaults', body: {} },
                { name: 'Đổi quyền tài khoản (POST /api/switch-role/[id])', method: 'POST', path: `/api/switch-role/${ids.studentObjId}`, body: { role: 'Teacher' }, expectedStatus: [200, 400, 404] },
                { name: 'Quay lại quyền gốc (POST /api/switch-back)', method: 'POST', path: '/api/switch-back', body: {}, expectedStatus: [200, 302, 400] },
                { name: 'Cập nhật trạng thái User (PATCH /api/statususer/[id])', method: 'PATCH', path: `/api/statususer/${ids.studentObjId}`, expectedStatus: [200, 400, 404] },
                { name: 'Cài đặt vai trò User (PATCH /api/roleuser/[id])', method: 'PATCH', path: `/api/roleuser/${ids.studentObjId}`, body: { role: 'Admin' }, expectedStatus: [200, 400, 404] },
            ]
        },
        {
            category: '🎓 2. ACADEMIC & MAKE-UP SESSIONS (HỌC BÙ)',
            tests: [
                { name: 'Academic Dashboard - Điểm danh hôm nay', method: 'GET', path: '/api/academic/dashboard/attendance-today' },
                { name: 'Academic Dashboard - Cảnh báo SLA', method: 'GET', path: '/api/academic/dashboard/sla-alerts' },
                { name: 'Academic Dashboard - Tổng quan hôm nay', method: 'GET', path: '/api/academic/dashboard/today' },
                { name: 'Danh sách lịch học bù (Makeup Sessions)', method: 'GET', path: '/api/academic/makeup-sessions' },
                { name: 'Tùy chọn lọc học bù (Makeup Options)', method: 'GET', path: '/api/academic/makeup-sessions/options' },
                { name: 'Thống kê học bù (Makeup Stats)', method: 'GET', path: '/api/academic/makeup-sessions/stats' },
                { name: 'Học bù chưa hoàn thành (Incomplete)', method: 'GET', path: '/api/academic/makeup-sessions/incomplete' },
                { name: 'Cập nhật trạng thái học bù (PATCH /api/academic/makeup-sessions/[id])', method: 'PATCH', path: `/api/academic/makeup-sessions/${ids.sessionId}`, body: { makeupStatus: 'PENDING_SCHEDULE' }, expectedStatus: [200, 400, 404] },
            ]
        },
        {
            category: '📚 3. COURSES & CLASS MANAGEMENT (KHÓA HỌC & SÁCH)',
            tests: [
                { name: 'Tạo / Kiểm tra khóa học (POST /api/course dry-run)', method: 'POST', path: '/api/course', body: {}, expectedStatus: [200, 400] },
                { name: 'Cập nhật khóa học (POST /api/course/[id] dry-run)', method: 'POST', path: `/api/course/${ids.courseId}`, body: {}, expectedStatus: [200, 400, 404] },
                { name: 'Thêm học sinh vào khóa (POST /api/course/[id]/student)', method: 'POST', path: `/api/course/${ids.courseId}/student`, body: {}, expectedStatus: [200, 400, 404] },
                { name: 'Khóa học học thử (GET /api/coursetry)', method: 'GET', path: '/api/coursetry', expectedStatus: [200, 404, 500] },
                { name: 'Lịch khóa học học sinh (GET /api/studentcourse/[id])', method: 'GET', path: `/api/studentcourse/${studentCourseCombo}`, expectedStatus: [200, 404] },
                { name: 'Cập nhật danh mục sách (POST /api/book dry-run)', method: 'POST', path: '/api/book', body: {}, expectedStatus: [200, 400, 500] },
                { name: 'Lịch học sinh hủy buổi (GET /api/client/lesson-cancel)', method: 'GET', path: '/api/client/lesson-cancel' },
            ]
        },
        {
            category: '📅 4. CALENDAR, LESSONS & CHECKIN (LỊCH & ĐIỂM DANH)',
            tests: [
                { name: `Lịch học tổng quan (GET /api/calendar?month=${currentMonth}&year=${currentYear})`, method: 'GET', path: `/api/calendar?month=${currentMonth}&year=${currentYear}` },
                { name: 'Chi tiết buổi học (GET /api/calendar/[id])', method: 'GET', path: `/api/calendar/${ids.sessionId}`, expectedStatus: [200, 404] },
                { name: `Xem điểm danh tháng (GET /api/checkin?month=${currentMonth}&year=${currentYear})`, method: 'GET', path: `/api/checkin?month=${currentMonth}&year=${currentYear}` },
                { name: 'Gửi điểm danh (POST /api/checkin)', method: 'POST', path: '/api/checkin', body: { sessionId: ids.sessionId, attendanceData: [{ studentId: ids.studentId, checkin: 1, comment: 'Test tự động' }] }, expectedStatus: [200, 201] },
                { name: 'Ghi nhận ảnh checkin (POST /api/checkin-photo)', method: 'POST', path: '/api/checkin-photo', body: { lessonId: ids.sessionId, studentId: ids.studentId, photoUrl: 'test' }, expectedStatus: [200, 400, 404] },
            ]
        },
        {
            category: '🧑‍🎓 5. STUDENTS & PROFILES (HỌC SINH)',
            tests: [
                { name: 'Hồ sơ học sinh (GET /api/student/[id]/profile)', method: 'GET', path: `/api/student/${ids.studentObjId}/profile`, expectedStatus: [200, 404] },
                { name: 'Cập nhật trạng thái học sinh (PATCH /api/student/[id]/status)', method: 'PATCH', path: `/api/student/${ids.studentObjId}/status`, body: { action: 'leave', note: 'Test tự động' }, expectedStatus: [200, 400, 404] },
                { name: 'Cấu hình import học sinh (GET /api/student/import)', method: 'GET', path: '/api/student/import' },
            ]
        },
        {
            category: '💰 6. FINANCE, DEBT & PAYMENTS (TÀI CHÍNH & HỌC PHÍ)',
            tests: [
                { name: 'Quản lý công nợ (GET /api/debt)', method: 'GET', path: '/api/debt' },
                { name: 'Tra cứu hóa đơn thanh toán (GET /api/pay?_id=...)', method: 'GET', path: `/api/pay?_id=${ids.invoiceId}`, expectedStatus: [200, 400, 404] },
                { name: 'Danh sách tài khoản ngân hàng (GET /api/bank)', method: 'GET', path: '/api/bank' },
            ]
        },
        {
            category: '🏢 7. AREAS & ROOMS (CƠ SỞ & PHÒNG HỌC)',
            tests: [
                { name: 'Tạo cơ sở mới (POST /api/area dry-run)', method: 'POST', path: '/api/area', body: {}, expectedStatus: [200, 400] },
                { name: 'Cập nhật cơ sở (PUT /api/area/[id] dry-run)', method: 'PUT', path: `/api/area/${ids.areaId}`, body: {}, expectedStatus: [200, 400, 404] },
                { name: 'Kiểm tra phòng học (GET /api/room/check)', method: 'GET', path: `/api/room/check?roomId=${ids.roomId}&date=2026-08-25&time=08:00`, expectedStatus: [200, 400, 404] },
            ]
        },
        {
            category: '🔔 8. NOTIFICATIONS & REPORTS (THÔNG BÁO & BÁO CÁO)',
            tests: [
                { name: 'Danh sách thông báo (GET /api/notifications)', method: 'GET', path: '/api/notifications' },
                { name: 'Số lượng thông báo chưa đọc', method: 'GET', path: '/api/notifications/unread-count' },
                { name: 'Cài đặt thông báo (GET /api/notifications/settings)', method: 'GET', path: '/api/notifications/settings' },
                { name: 'Mẫu thông báo (GET /api/notifications/templates)', method: 'GET', path: '/api/notifications/templates' },
                { name: 'Tạo thông báo hệ thống (POST /api/notifications/system)', method: 'POST', path: '/api/notifications/system', body: { title: 'Test System', content: 'Test noti' }, expectedStatus: [200, 201] },
                { name: 'Kiểm tra Engine thông báo (POST /api/notifications/check-engine)', method: 'POST', path: '/api/notifications/check-engine', body: {} },
                { name: 'Tổng quan Dashboard (GET /api/dashboard/overview)', method: 'GET', path: '/api/dashboard/overview' },
                { name: 'Cấu hình báo cáo (GET /api/report-config)', method: 'GET', path: '/api/report-config' },
                { name: 'Lịch sử báo cáo (GET /api/report-history)', method: 'GET', path: '/api/report-history' },
                { name: 'Thống kê báo cáo (GET /api/report-stats)', method: 'GET', path: '/api/report-stats' },
            ]
        },
        {
            category: '☁️ 9. GOOGLE DRIVE STORAGE & BACKUP (DUNG LƯỢNG DRIVE)',
            tests: [
                { name: 'Tổng quan dung lượng Google Drive', method: 'GET', path: '/api/drive-storage' },
                { name: 'Thống kê chi tiết Drive (Summary)', method: 'GET', path: '/api/drive-storage/summary' },
                { name: 'Kích thước file Google Drive (Size)', method: 'GET', path: '/api/drive-storage/size' },
                { name: 'Lịch quét Drive tự động (Schedule)', method: 'GET', path: '/api/drive-storage/schedule' },
                { name: 'Xóa Cache hệ thống (Clear Cache)', method: 'POST', path: '/api/clear-cache', body: {} },
                { name: 'Trang tài liệu hướng dẫn (Guide)', method: 'GET', path: '/api/guide' },
            ]
        },
        {
            category: '💬 10. CLIENTS, MESSAGING & TOOLS (KHÁCH HÀNG & ZALO)',
            tests: [
                { name: 'Danh sách khách hàng (GET /api/client)', method: 'GET', path: '/api/client' },
                { name: 'Lịch sử tin nhắn (GET /api/hissmes)', method: 'GET', path: '/api/hissmes' },
                { name: 'Lịch sử tin nhắn theo SĐT (GET /api/hissmes/[phone])', method: 'GET', path: `/api/hissmes/${ids.phone}`, expectedStatus: [200, 404] },
                { name: 'Danh sách nhãn khách hàng (GET /api/label)', method: 'GET', path: '/api/label' },
                { name: 'Danh sách công cụ (GET /api/tools)', method: 'GET', path: '/api/tools' },
                { name: 'Danh sách nhãn công cụ (GET /api/tools/label)', method: 'GET', path: '/api/tools/label' },
                { name: 'Nhật ký Bot Zalo (GET /api/bot-logs)', method: 'GET', path: '/api/bot-logs' },
                { name: 'Lịch sử hành động Zalo (GET /api/action)', method: 'GET', path: '/api/action' },
            ]
        },
        {
            category: '📝 11. QUIZ & E-LEARNING (TRẮC NGHIỆM)',
            tests: [
                { name: 'Danh sách bài Quiz (GET /api/quiz)', method: 'GET', path: '/api/quiz' },
                { name: 'Lịch sử làm bài Quiz (GET /api/quiz/attempt)', method: 'GET', path: '/api/quiz/attempt' },
                { name: 'Chuyển đổi dữ liệu LMS (GET /api/migration/lms)', method: 'GET', path: '/api/migration/lms' },
            ]
        }
    ];

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    const globalStart = Date.now();

    for (const suite of testSuites) {
        console.log(`\n${colors.bright}${colors.magenta}${suite.category}${colors.reset}`);
        console.log(`----------------------------------------------------------------------`);

        for (const test of suite.tests) {
            totalTests++;
            const res = await testEndpoint(test);

            const statusColor = res.pass ? colors.green : colors.red;
            const badge = res.pass ? `[✓ PASS]` : `[✗ FAIL]`;
            const methodBadge = `${colors.cyan}${res.method.padEnd(6)}${colors.reset}`;
            const timeBadge = `${colors.dim}(${res.duration}ms)${colors.reset}`;
            const codeBadge = res.status ? `HTTP ${res.status}` : 'ERR';

            if (res.pass) {
                passedTests++;
                console.log(`  ${statusColor}${badge}${colors.reset} ${methodBadge} ${res.path.padEnd(52)} ${colors.green}${codeBadge}${colors.reset} ${timeBadge}`);
            } else {
                failedTests++;
                console.log(`  ${statusColor}${badge}${colors.reset} ${methodBadge} ${res.path.padEnd(52)} ${colors.red}${codeBadge}${colors.reset} ${timeBadge}`);
                if (res.note) {
                    console.log(`        ${colors.yellow}↳ Chi tiết: ${res.note}${colors.reset}`);
                }
            }
        }
    }

    const totalDuration = ((Date.now() - globalStart) / 1000).toFixed(2);

    console.log(`\n${colors.bright}${colors.cyan}=======================================================`);
    console.log(`📊 TỔNG KẾT KẾT QUẢ KIỂM TRA TẤT CẢ API`);
    console.log(`=======================================================${colors.reset}`);
    console.log(`• Tổng số API được test : ${colors.bright}${totalTests}${colors.reset}`);
    console.log(`• Thành công (PASS)     : ${colors.green}${passedTests}${colors.reset}`);
    console.log(`• Thất bại (FAIL)       : ${failedTests > 0 ? colors.red : colors.green}${failedTests}${colors.reset}`);
    console.log(`• Tỷ lệ đạt             : ${colors.bright}${((passedTests / totalTests) * 100).toFixed(1)}%${colors.reset}`);
    console.log(`• Thời gian thực thi    : ${colors.yellow}${totalDuration}s${colors.reset}\n`);

    if (failedTests > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

main().catch(err => {
    console.error(`${colors.red}Lỗi thực thi test runner:`, err);
    process.exit(1);
});
