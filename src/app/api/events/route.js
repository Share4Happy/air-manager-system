import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import Event from '@/models/event';
import EventTemplate from '@/models/eventTemplate';
import User from '@/models/users';
import checkAuthToken from '@/utils/checktoken';
import mongoose from 'mongoose';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const scope = searchParams.get('scope'); // 'upcoming', 'happening', 'past', 'all'
        const type = searchParams.get('type');
        const search = searchParams.get('search');

        await connectDB();

        const filter = {};

        if (status) {
            filter.status = status;
        } else if (scope === 'planning') {
            filter.status = 'planning';
        } else if (scope === 'upcoming') {
            filter.status = { $in: ['planning', 'upcoming'] };
        } else if (scope === 'happening') {
            filter.status = 'happening';
        } else if (scope === 'past' || scope === 'archive') {
            filter.status = { $in: ['completed', 'cancelled'] };
        }

        if (type && type !== 'all') {
            filter.type = type;
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
            ];
        }

        const events = await Event.find(filter)
            .populate('lead', 'name avt email phone')
            .populate('organizers', 'name avt email')
            .sort({ startDate: 1, createdAt: -1 })
            .lean();

        const user = await checkAuthToken();
        const canViewBudget = Boolean(user && user.role?.some?.(r => /^(admin|academic)$/i.test(r)));

        // Compute summary metrics for each event
        const enrichedEvents = events.map(evt => {
            const roadmap = evt.roadmap || [];
            // Leaf tasks are items with a parentId (or root items with no children)
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
                const budgetItems = evt.budget?.items || [];
                estimatedTotal = budgetItems.reduce((sum, item) => sum + (Number(item.estimatedCost) || 0), 0);
                actualTotal = budgetItems.reduce((sum, item) => sum + (Number(item.actualCost) || 0), 0);
                budgetData = evt.budget;
            }

            return {
                ...evt,
                budget: budgetData,
                stats: {
                    totalTasks,
                    completedTasks,
                    inProgressTasks,
                    overdueTasks,
                    progressPercent,
                    totalMembers: (evt.members || []).length,
                    estimatedTotal: canViewBudget ? estimatedTotal : null,
                    actualTotal: canViewBudget ? actualTotal : null,
                }
            };
        });

        // Compute global counts for tabs
        const allCounts = await Event.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                }
            }
        ]);

        const countsMap = {
            all: 0,
            planning: 0,
            upcoming: 0,
            happening: 0,
            completed: 0,
            cancelled: 0,
            past: 0,
        };

        allCounts.forEach(c => {
            countsMap[c._id] = c.count;
            countsMap.all += c.count;
            if (c._id === 'completed' || c._id === 'cancelled') {
                countsMap.past += c.count;
            }
        });

        return NextResponse.json({
            success: true,
            events: enrichedEvents,
            counts: countsMap,
            canViewBudget,
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await checkAuthToken();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            title,
            code,
            type = 'competition',
            status = 'planning',
            startDate,
            endDate,
            location,
            description,
            lead,
            organizers = [],
            templateId,
            customRoadmap,
            customBudget,
        } = body;

        if (!title) {
            return NextResponse.json({ success: false, message: 'Vui lòng nhập tên sự kiện' }, { status: 400 });
        }

        await connectDB();

        let roadmap = customRoadmap || [];
        let budgetItems = customBudget || [];

        // If template selected, build roadmap with dates relative to startDate (or today if not set)
        if (templateId) {
            const template = await EventTemplate.findById(templateId).lean();
            if (template) {
                const baseDate = startDate ? new Date(startDate) : new Date();

                roadmap = (template.roadmapNodes || []).map(node => {
                    let calculatedStartDate = null;
                    let calculatedDueDate = null;

                    if (typeof node.relativeDaysStart === 'number') {
                        calculatedStartDate = new Date(baseDate.getTime() + node.relativeDaysStart * 24 * 60 * 60 * 1000);
                    }
                    if (typeof node.relativeDaysDue === 'number') {
                        calculatedDueDate = new Date(baseDate.getTime() + node.relativeDaysDue * 24 * 60 * 60 * 1000);
                    }

                    return {
                        id: node.id,
                        parentId: node.parentId,
                        name: node.name,
                        description: node.description,
                        priority: node.priority || 'medium',
                        startDate: calculatedStartDate,
                        dueDate: calculatedDueDate,
                        status: 'pending',
                        order: node.order || 0,
                    };
                });

                budgetItems = (template.budgetItems || []).map(item => ({
                    id: item.id,
                    name: item.name,
                    category: item.category,
                    estimatedCost: item.defaultEstimatedCost || 0,
                    actualCost: 0,
                    note: item.note || '',
                    isPaid: false,
                }));
            }
        }

        const newEvent = new Event({
            title,
            code: code || `EVT-${Date.now().toString().slice(-6)}`,
            type,
            status,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            location: location || '',
            description: description || '',
            lead: lead || user.id || user._id,
            organizers: organizers.length > 0 ? organizers : [lead || user.id || user._id],
            roadmap,
            budget: {
                items: budgetItems,
                notes: '',
            },
            createdBy: user.id || user._id,
            updatedBy: user.id || user._id,
        });

        await newEvent.save();

        return NextResponse.json({ success: true, event: newEvent }, { status: 201 });
    } catch (error) {
        console.error('Error creating event:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
