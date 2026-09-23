import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import Event from '@/models/event';
import User from '@/models/users';
import checkAuthToken from '@/utils/checktoken';
import mongoose from 'mongoose';

async function findEventByIdOrToken(idOrToken, fallbackToken = '') {
    const candidates = [idOrToken, fallbackToken].filter(
        c => c && c !== 'undefined' && c !== 'null' && typeof c === 'string' && c.trim()
    );

    for (const cand of candidates) {
        const trimmed = cand.trim();
        // 1. Try finding by MongoDB ObjectId
        if (mongoose.Types.ObjectId.isValid(trimmed)) {
            const byId = await Event.findById(trimmed);
            if (byId) return byId;
        }
        // 2. Try finding by Share Token
        const byToken = await Event.findOne({ 'shareConfig.shareToken': trimmed });
        if (byToken) return byToken;

        // 3. Try finding by Event Code
        const byCode = await Event.findOne({ code: trimmed });
        if (byCode) return byCode;
    }

    return null;
}

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const queryToken = searchParams.get('token') || searchParams.get('shareToken') || '';

        await connectDB();

        const event = await findEventByIdOrToken(id, queryToken);
        if (!event) {
            return NextResponse.json({ success: false, message: 'ID sự kiện không hợp lệ hoặc không tìm thấy sự kiện' }, { status: 404 });
        }

        const since = searchParams.get('since');
        const before = searchParams.get('before');
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam, 10) || 30)) : null;

        const allMessages = event.chatMessages || [];
        let messages = allMessages;
        let hasMore = false;

        if (since) {
            const sinceDate = new Date(since);
            if (!isNaN(sinceDate.getTime())) {
                messages = messages.filter(m => new Date(m.createdAt) > sinceDate);
            }
        } else if (before) {
            const beforeDate = new Date(before);
            if (!isNaN(beforeDate.getTime())) {
                const priorMessages = messages.filter(m => new Date(m.createdAt) < beforeDate);
                if (limit && priorMessages.length > limit) {
                    messages = priorMessages.slice(-limit);
                    hasMore = true;
                } else {
                    messages = priorMessages;
                    hasMore = false;
                }
            }
        } else if (limit && messages.length > limit) {
            hasMore = true;
            messages = messages.slice(-limit);
        }

        return NextResponse.json({
            success: true,
            messages,
            hasMore,
            totalMessages: allMessages.length,
            pinnedChatMessage: event.pinnedChatMessage || null,
            serverTime: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Error fetching event chat messages:', err);
        return NextResponse.json({ success: false, message: 'Lỗi máy chủ khi tải tin nhắn' }, { status: 500 });
    }
}

export async function POST(req, { params }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const queryToken = searchParams.get('token') || searchParams.get('shareToken') || '';

        const body = await req.json().catch(() => ({}));
        const { content, imageUrl, imageFileId, isUrgent, replyTo, taggedTask, shareToken } = body;

        await connectDB();

        const event = await findEventByIdOrToken(id, shareToken || queryToken);
        if (!event) {
            return NextResponse.json({ success: false, message: 'ID sự kiện không hợp lệ hoặc không tìm thấy sự kiện' }, { status: 404 });
        }

        if (!content?.trim() && !imageUrl && !taggedTask) {
            return NextResponse.json({ success: false, message: 'Nội dung tin nhắn, hình ảnh hoặc task đính kèm không được để trống' }, { status: 400 });
        }

        // Sanitize and limit text content length (anti-abuse / anti-DoS)
        const cleanContent = typeof content === 'string' 
            ? content.replace(/\0/g, '').trim().slice(0, 4000) 
            : '';

        // Sanitize imageUrl (must be valid HTTP/HTTPS URL or safe path)
        let cleanImageUrl = '';
        if (typeof imageUrl === 'string' && imageUrl.trim()) {
            const trimmedImg = imageUrl.trim();
            if (/^(https?:\/\/|\/)/i.test(trimmedImg)) {
                cleanImageUrl = trimmedImg.slice(0, 2000);
            }
        }

        // Sanitize taggedTask if provided
        let cleanTaggedTask = null;
        if (taggedTask && typeof taggedTask === 'object' && taggedTask.id) {
            cleanTaggedTask = {
                id: String(taggedTask.id).slice(0, 100),
                name: String(taggedTask.name || '').slice(0, 200),
                status: String(taggedTask.status || 'pending').slice(0, 30),
                priority: String(taggedTask.priority || 'medium').slice(0, 30),
                assigneeName: String(taggedTask.assigneeName || '').slice(0, 100),
                phaseName: String(taggedTask.phaseName || '').slice(0, 150),
            };
        }

        // Check user identity (logged in user vs external CTV)
        const decoded = await checkAuthToken();
        let senderId = '';
        let senderName = '';
        let senderRole = 'Thành viên';
        let senderType = 'external';
        let senderAvatar = '';

        if (decoded && (decoded.id || decoded._id)) {
            const userDoc = await User.findById(decoded.id || decoded._id).select('name role avt').lean();
            senderId = String(decoded.id || decoded._id);
            senderName = userDoc?.name || (body.senderName && body.senderName !== 'Ban Tổ Chức' ? String(body.senderName).trim().slice(0, 100) : '') || 'Ban Tổ Chức';
            const userRole = userDoc?.role || decoded.role;
            senderRole = Array.isArray(userRole) ? userRole.join(', ') : (userRole || 'Ban Tổ Chức');
            senderType = 'internal';
            senderAvatar = userDoc?.avt || '';
        } else {
            senderId = body.senderId ? String(body.senderId).slice(0, 80) : `guest-${Date.now()}`;
            senderName = (body.senderName ? String(body.senderName).trim().slice(0, 100) : '') || 'Cộng tác viên';
            senderRole = (body.senderRole ? String(body.senderRole).trim().slice(0, 100) : '') || 'CTV Sự kiện';
            senderType = 'external';
            senderAvatar = body.senderAvatar ? String(body.senderAvatar).slice(0, 2000) : '';
        }

        const newMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            senderId,
            senderName,
            senderRole,
            senderType,
            senderAvatar,
            content: cleanContent,
            imageUrl: cleanImageUrl,
            imageFileId: typeof imageFileId === 'string' ? imageFileId.slice(0, 200) : '',
            isUrgent: Boolean(isUrgent),
            isPinned: false,
            replyTo: (replyTo && (replyTo.id || replyTo.content || replyTo.senderName)) ? {
                id: String(replyTo.id || '').slice(0, 100),
                senderName: String(replyTo.senderName || '').slice(0, 100),
                content: String(replyTo.content || '').slice(0, 500),
            } : null,
            taggedTask: cleanTaggedTask,
            createdAt: new Date(),
        };


        if (!Array.isArray(event.chatMessages)) {
            event.chatMessages = [];
        }

        event.chatMessages.push(newMessage);
        await event.save();

        return NextResponse.json({
            success: true,
            message: newMessage,
            serverTime: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Error sending event chat message:', err);
        return NextResponse.json({ success: false, message: 'Lỗi máy chủ khi gửi tin nhắn' }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const queryToken = searchParams.get('token') || searchParams.get('shareToken') || '';

        const body = await req.json().catch(() => ({}));
        const { action, messageId, shareToken } = body;

        await connectDB();

        const event = await findEventByIdOrToken(id, shareToken || queryToken);
        if (!event) {
            return NextResponse.json({ success: false, message: 'ID sự kiện không hợp lệ hoặc không tìm thấy sự kiện' }, { status: 404 });
        }

        if (action === 'pin') {
            const targetMsg = (event.chatMessages || []).find(m => m.id === messageId);
            if (!targetMsg) {
                return NextResponse.json({ success: false, message: 'Không tìm thấy tin nhắn cần ghim' }, { status: 404 });
            }

            event.pinnedChatMessage = targetMsg;
            event.chatMessages.forEach(m => {
                m.isPinned = m.id === messageId;
            });
            await event.save();

            return NextResponse.json({
                success: true,
                pinnedChatMessage: targetMsg,
                message: 'Đã ghim tin nhắn thành công',
            });
        }

        if (action === 'unpin') {
            event.pinnedChatMessage = null;
            event.chatMessages.forEach(m => {
                m.isPinned = false;
            });
            await event.save();

            return NextResponse.json({
                success: true,
                pinnedChatMessage: null,
                message: 'Đã gỡ ghim tin nhắn',
            });
        }

        return NextResponse.json({ success: false, message: 'Thao tác không hợp lệ' }, { status: 400 });
    } catch (err) {
        console.error('Error updating event chat message:', err);
        return NextResponse.json({ success: false, message: 'Lỗi máy chủ' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const queryToken = searchParams.get('token') || searchParams.get('shareToken') || '';

        const user = await checkAuthToken();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Chỉ ban tổ chức mới có quyền xóa tin nhắn' }, { status: 401 });
        }

        await connectDB();

        const event = await findEventByIdOrToken(id, queryToken);
        if (!event) {
            return NextResponse.json({ success: false, message: 'ID sự kiện không hợp lệ hoặc không tìm thấy sự kiện' }, { status: 404 });
        }

        const messageId = searchParams.get('messageId');

        if (!messageId) {
            return NextResponse.json({ success: false, message: 'Thiếu messageId' }, { status: 400 });
        }

        event.chatMessages = (event.chatMessages || []).filter(m => m.id !== messageId);
        if (event.pinnedChatMessage && event.pinnedChatMessage.id === messageId) {
            event.pinnedChatMessage = null;
        }

        await event.save();

        return NextResponse.json({
            success: true,
            message: 'Đã xóa tin nhắn thành công',
        });
    } catch (err) {
        console.error('Error deleting event chat message:', err);
        return NextResponse.json({ success: false, message: 'Lỗi máy chủ khi xóa tin nhắn' }, { status: 500 });
    }
}

