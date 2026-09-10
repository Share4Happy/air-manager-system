import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/config/connectDB';
import Event from '@/models/event';

// Generate a friendly, secure share token
function generateShareToken(title = '') {
    const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
        .slice(0, 24);
    const randomHex = crypto.randomBytes(4).toString('hex');
    return slug ? `${slug}-${randomHex}` : `evt-${randomHex}`;
}

/**
 * GET /api/events/[id]/share
 * Get current share configuration for an event
 */
export async function GET(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;

        const event = await Event.findById(id).select('title shareConfig');
        if (!event) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy sự kiện' }, { status: 404 });
        }

        let shareConfig = event.shareConfig?.toObject() || {};
        // If no token generated yet, generate one
        if (!shareConfig.shareToken) {
            shareConfig.shareToken = generateShareToken(event.title);
            event.shareConfig = shareConfig;
            await event.save();
        }

        // Check if 30 days expired
        const isExpired = shareConfig.expiresAt ? new Date(shareConfig.expiresAt) < new Date() : false;
        if (isExpired && shareConfig.isPublic) {
            shareConfig.isPublic = false;
            event.shareConfig.isPublic = false;
            await event.save();
        }

        return NextResponse.json({
            success: true,
            shareConfig,
            isExpired,
        });
    } catch (error) {
        console.error('Error fetching share config:', error);
        return NextResponse.json({ success: false, message: 'Lỗi máy chủ' }, { status: 500 });
    }
}

/**
 * PUT /api/events/[id]/share
 * Update share configuration (toggle public, update PIN, allowedTabs, regenerate token, renew 30 days)
 */
export async function PUT(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await request.json();

        const event = await Event.findById(id);
        if (!event) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy sự kiện' }, { status: 404 });
        }

        let currentConfig = event.shareConfig?.toObject() || {};

        if (body.regenerateToken) {
            currentConfig.shareToken = generateShareToken(event.title);
            currentConfig.isPublic = true;
            currentConfig.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        } else if (body.renew) {
            currentConfig.isPublic = true;
            currentConfig.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        } else if (typeof body.isPublic === 'boolean') {
            currentConfig.isPublic = body.isPublic;
            if (body.isPublic) {
                // Set 30 days expiration whenever enabled/re-opened
                currentConfig.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            }
            if (!currentConfig.shareToken) {
                currentConfig.shareToken = generateShareToken(event.title);
            }
        }

        if (typeof body.pinCode === 'string') {
            currentConfig.pinCode = body.pinCode.trim();
        }

        if (body.allowedTabs && typeof body.allowedTabs === 'object') {
            currentConfig.allowedTabs = {
                roadmap: body.allowedTabs.roadmap !== false,
                stations: body.allowedTabs.stations !== false,
                equipment: body.allowedTabs.equipment !== false,
                staff: body.allowedTabs.staff !== false,
                media: body.allowedTabs.media !== false,
                budget: Boolean(body.allowedTabs.budget), // default false
                retro: Boolean(body.allowedTabs.retro), // default false
            };
        }

        if (body.expiresAt !== undefined && !body.renew && body.isPublic === undefined) {
            currentConfig.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
        }

        event.shareConfig = currentConfig;
        await event.save();

        const isExpired = currentConfig.expiresAt ? new Date(currentConfig.expiresAt) < new Date() : false;

        return NextResponse.json({
            success: true,
            shareConfig: event.shareConfig,
            isExpired,
            message: 'Đã cập nhật cấu hình chia sẻ thành công',
        });
    } catch (error) {
        console.error('Error updating share config:', error);
        return NextResponse.json({ success: false, message: 'Lỗi máy chủ khi cập nhật chia sẻ' }, { status: 500 });
    }
}
