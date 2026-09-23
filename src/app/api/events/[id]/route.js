import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import Event from '@/models/event';
import User from '@/models/users';
import { authorize } from '@/utils/authorize';
import mongoose from 'mongoose';

export async function GET(req, { params }) {
    try {
        const auth = await authorize(req);
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'ID không hợp lệ' }, { status: 400 });
        }

        await connectDB();

        const event = await Event.findById(id)
            .populate('lead', 'name avt email phone role')
            .populate('organizers', 'name avt email phone role')
            .populate('budget.items.paidBy', 'name avt email')
            .populate('media.photos.uploadedBy', 'name avt email')
            .populate('createdBy', 'name')
            .populate('updatedBy', 'name')
            .lean();

        if (!event) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy sự kiện' }, { status: 404 });
        }

        const user = auth.user;
        const canViewBudget = Boolean(user && user.role?.some?.(r => /^(admin|academic)$/i.test(r)));

        // Compute metrics
        const roadmap = event.roadmap || [];
        const parentIds = new Set(roadmap.filter(n => n.parentId).map(n => n.parentId));
        const leafTasks = roadmap.filter(n => !parentIds.has(n.id));

        const totalTasks = leafTasks.length;
        const completedTasks = leafTasks.filter(t => t.status === 'completed').length;
        const inProgressTasks = leafTasks.filter(t => t.status === 'in_progress').length;
        const overdueTasks = leafTasks.filter(t => {
            if (t.status === 'completed') return false;
            if (!t.dueDate) return false;
            return new Date(t.dueDate) < new Date();
        }).length;

        const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        let estimatedTotal = 0;
        let actualTotal = 0;
        let budgetData = undefined;

        if (canViewBudget) {
            const budgetItems = event.budget?.items || [];
            estimatedTotal = budgetItems.reduce((sum, item) => sum + (Number(item.estimatedCost) || 0), 0);
            actualTotal = budgetItems.reduce((sum, item) => sum + (Number(item.actualCost) || 0), 0);
            budgetData = event.budget;
        }

        // Ensure all stations have distinct IDs
        const seenStationIds = new Set();
        const sanitizedStations = (event.stations || []).map((s, idx) => {
            let sid = s.id || s._id ? String(s.id || s._id) : null;
            if (!sid || seenStationIds.has(sid)) {
                sid = `station-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
            }
            seenStationIds.add(sid);
            return {
                ...s,
                id: sid,
            };
        });

        return NextResponse.json({
            success: true,
            canViewBudget,
            event: {
                ...event,
                stations: sanitizedStations,
                budget: budgetData,
                stats: {
                    totalTasks,
                    completedTasks,
                    inProgressTasks,
                    overdueTasks,
                    progressPercent,
                    totalMembers: (event.members || []).length,
                    estimatedTotal: canViewBudget ? estimatedTotal : null,
                    actualTotal: canViewBudget ? actualTotal : null,
                }
            }
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching event details:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const auth = await authorize(req);
        if (!auth.authorized) return auth.response;
        const user = auth.user;

        const { id } = await params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'ID không hợp lệ' }, { status: 400 });
        }

        const body = await req.json();
        const canViewBudget = Boolean(user && user.role?.some?.(r => /^(admin|academic)$/i.test(r)));
        if (!canViewBudget && body.budget !== undefined) {
            delete body.budget;
        }

        // Defensive sanitize for subdocuments requiring unique id
        if (Array.isArray(body.stations)) {
            const seenIds = new Set();
            body.stations = body.stations.map((s, idx) => {
                let sid = s.id || s._id ? String(s.id || s._id) : null;
                if (!sid || seenIds.has(sid)) {
                    sid = `station-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
                }
                seenIds.add(sid);
                return {
                    ...s,
                    id: sid,
                };
            });
        }
        if (Array.isArray(body.roadmap)) {
            body.roadmap = body.roadmap.map((n, idx) => ({
                ...n,
                id: n.id || `node-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            }));
        }
        if (Array.isArray(body.members)) {
            body.members = body.members.map((m, idx) => ({
                ...m,
                id: m.id || `member-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            }));
        }
        if (Array.isArray(body.equipmentChecklist)) {
            body.equipmentChecklist = body.equipmentChecklist.map((eq, idx) => ({
                ...eq,
                id: eq.id || `eq-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            }));
        }

        await connectDB();

        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            {
                ...body,
                updatedBy: user.id || user._id,
            },
            { new: true, runValidators: true }
        )
            .populate('lead', 'name avt email phone role')
            .populate('organizers', 'name avt email phone role')
            .populate('budget.items.paidBy', 'name avt email')
            .populate('media.photos.uploadedBy', 'name avt email')
            .lean();

        if (!updatedEvent) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy sự kiện để cập nhật' }, { status: 404 });
        }

        return NextResponse.json({ success: true, event: updatedEvent }, { status: 200 });
    } catch (error) {
        console.error('Error updating event:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const auth = await authorize(req);
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'ID không hợp lệ' }, { status: 400 });
        }

        await connectDB();

        const deleted = await Event.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy sự kiện để xóa' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Đã xóa sự kiện thành công' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting event:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
