import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import Event from '@/models/event';
import User from '@/models/users';

/**
 * GET /api/events/share/[token]
 * Public API to fetch sanitized, read-only event data for external viewers
 */
export async function GET(request, { params }) {
    try {
        await connectDB();
        const { token } = await params;
        const { searchParams } = new URL(request.url);
        const pin = searchParams.get('pin') || request.headers.get('x-share-pin') || '';

        const event = await Event.findOne({ 'shareConfig.shareToken': token });
        if (!event) {
            return NextResponse.json(
                { success: false, message: 'Liên kết chia sẻ không tồn tại hoặc đã bị hủy.' },
                { status: 404 }
            );
        }

        const shareConfig = event.shareConfig || {};
        if (!shareConfig.isPublic) {
            return NextResponse.json(
                { success: false, message: 'Sự kiện này hiện chưa được mở chia sẻ công khai.' },
                { status: 403 }
            );
        }

        // Check expiration (30 days)
        if (shareConfig.expiresAt && new Date(shareConfig.expiresAt) < new Date()) {
            return NextResponse.json(
                { success: false, message: 'Liên kết chia sẻ sự kiện này đã hết hạn 30 ngày. Vui lòng liên hệ Ban tổ chức để mở lại liên kết.' },
                { status: 410 }
            );
        }

        // Check PIN code if required
        if (shareConfig.pinCode && shareConfig.pinCode.trim().length > 0) {
            if (!pin || pin.trim() !== shareConfig.pinCode.trim()) {
                return NextResponse.json({
                    success: false,
                    requirePin: true,
                    eventTitle: event.title,
                    message: pin ? 'Mã PIN không chính xác. Vui lòng thử lại.' : 'Sự kiện này yêu cầu mã PIN để truy cập.',
                }, { status: 401 });
            }
        }

        // Fetch basic public users list for name/role resolution
        const users = await User.find({ status: true })
            .select('_id name role')
            .lean();

        const allowedTabs = shareConfig.allowedTabs || {
            roadmap: true,
            stations: true,
            equipment: true,
            staff: true,
            media: true,
            budget: false,
            retro: false,
        };

        const eventObj = event.toObject();

        // Data Sanitization: Filter out non-allowed or sensitive sections
        const sanitizedEvent = {
            id: eventObj._id,
            title: eventObj.title,
            type: eventObj.type,
            status: eventObj.status,
            startDate: eventObj.startDate,
            endDate: eventObj.endDate,
            location: eventObj.location,
            description: eventObj.description,
            coverImage: eventObj.coverImage,
            participantsCount: eventObj.participantsCount,
            targetAudience: eventObj.targetAudience,

            // Allowed tabs data
            roadmap: allowedTabs.roadmap ? (eventObj.roadmap || []) : [],
            stations: allowedTabs.stations ? (eventObj.stations || []) : [],
            stationPhaseId: eventObj.stationPhaseId,
            stationSchedule: eventObj.stationSchedule,
            passportRules: eventObj.passportRules,
            equipmentChecklist: allowedTabs.equipment ? (eventObj.equipmentChecklist || []) : [],
            members: allowedTabs.staff ? (eventObj.members || []).map(m => ({
                id: m.id,
                name: m.name,
                role: m.role,
                organization: m.organization,
                checkInStatus: m.checkInStatus,
            })) : [],
            media: allowedTabs.media ? {
                photos: eventObj.media?.photos || [],
                driveFolderUrl: eventObj.media?.driveFolderUrl || '',
                notes: eventObj.media?.notes || '',
            } : {},
            summaryReport: allowedTabs.retro ? eventObj.summaryReport : null,
            budget: allowedTabs.budget ? eventObj.budget : null, // Stripped by default
        };

        return NextResponse.json({
            success: true,
            event: sanitizedEvent,
            users,
            allowedTabs,
        });
    } catch (error) {
        console.error('Error in public share route:', error);
        return NextResponse.json({ success: false, message: 'Lỗi máy chủ khi tải sự kiện' }, { status: 500 });
    }
}
