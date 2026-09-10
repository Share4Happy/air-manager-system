'use client';
import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import EventHeader from './ui/EventHeader';
import RoadmapTreeView from './ui/RoadmapTreeView';
import RoadmapGanttView from './ui/RoadmapGanttView';
import EventStationMatrixView from './ui/EventStationMatrixView';
import EventMembersView from './ui/EventMembersView';
import BudgetExpenseView from './ui/BudgetExpenseView';
import MediaDriveGalleryView from './ui/MediaDriveGalleryView';
import RetrospectiveView from './ui/RetrospectiveView';
import EventEquipmentChecklistView from './ui/EventEquipmentChecklistView';

export default function EventDetailPage({ params }) {
    const unwrappedParams = use(params);
    const eventId = unwrappedParams.id;
    const router = useRouter();

    const [event, setEvent] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [canViewBudget, setCanViewBudget] = useState(false);
    const [activeTab, setActiveTab] = useState('roadmap'); // 'roadmap', 'staff', 'budget', 'media', 'retro'
    const [roadmapMode, setRoadmapMode] = useState('tree'); // 'tree' or 'gantt' (Option C)

    const fetchEventDetail = useCallback(async () => {
        try {
            const [resEvt, resUsers] = await Promise.all([
                fetch(`/api/events/${eventId}`),
                fetch('/api/events/users'),
            ]);

            const dataEvt = await resEvt.json();
            const dataUsers = await resUsers.json();

            if (dataEvt.success) {
                setEvent(dataEvt.event);
                setCanViewBudget(!!dataEvt.canViewBudget);
            }
            if (dataUsers.success) {
                setUsers(dataUsers.users || []);
            }
        } catch (err) {
            console.error('Error fetching event detail:', err);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchEventDetail();
    }, [fetchEventDetail]);

    // Update handlers that persist to DB and update local state
    const updateEventInDB = async (payload) => {
        try {
            const res = await fetch(`/api/events/${eventId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success && data.event) {
                setEvent(prev => ({
                    ...prev,
                    ...data.event,
                    stats: {
                        ...(prev?.stats || {}),
                        ...(data.event.stats || {}),
                    }
                }));
            } else {
                console.error('Update event failed:', data.message);
            }
        } catch (err) {
            console.error('Error updating event:', err);
        }
    };

    const handleUpdateMultiple = (payload) => {
        setEvent(prev => ({ ...prev, ...payload }));
        updateEventInDB(payload);
    };

    const handleStatusChange = (newStatus) => {
        setEvent(prev => ({ ...prev, status: newStatus }));
        updateEventInDB({ status: newStatus });
    };

    const handleUpdateRoadmap = (newRoadmap) => {
        setEvent(prev => ({ ...prev, roadmap: newRoadmap }));
        updateEventInDB({ roadmap: newRoadmap });
    };

    const handleUpdateStations = (newStations) => {
        setEvent(prev => ({ ...prev, stations: newStations }));
        updateEventInDB({ stations: newStations });
    };

    const handleUpdateMembers = (newMembers) => {
        setEvent(prev => ({ ...prev, members: newMembers }));
        updateEventInDB({ members: newMembers });
    };

    const handleUpdateBudget = (newBudget) => {
        setEvent(prev => ({ ...prev, budget: newBudget }));
        updateEventInDB({ budget: newBudget });
    };

    const handleUpdateEquipmentChecklist = (newEquipmentChecklist) => {
        setEvent(prev => ({ ...prev, equipmentChecklist: newEquipmentChecklist }));
        updateEventInDB({ equipmentChecklist: newEquipmentChecklist });
    };

    const handleUpdateMedia = (newMedia) => {
        setEvent(prev => ({
            ...prev,
            media: newMedia,
        }));
        updateEventInDB({ media: newMedia });
    };

    const handleUpdateSummaryReport = (newReport) => {
        setEvent(prev => ({ ...prev, summaryReport: newReport }));
        updateEventInDB({ summaryReport: newReport });
    };

    const handleCoverUpload = (coverFileId) => {
        setEvent(prev => ({ ...prev, coverImage: coverFileId }));
    };

    const handleDeleteEvent = async () => {
        if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ sự kiện này? Thao tác này không thể hoàn tác.')) return;
        try {
            const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.success) {
                router.push('/events');
            }
        } catch (err) {
            console.error('Error deleting event:', err);
        }
    };

    if (loading) {
        return (
            <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <span className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-[var(--text-secondary)] font-medium">Đang tải thông tin sự kiện...</span>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="p-6 max-w-7xl mx-auto text-center py-16">
                <h3 className="text-base font-bold text-[var(--text-primary)]">Không tìm thấy sự kiện</h3>
                <button
                    onClick={() => router.push('/events')}
                    className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold border-none cursor-pointer"
                >
                    Về danh sách sự kiện
                </button>
            </div>
        );
    }

    const handleSaveAsTemplate = async () => {
        const templateName = prompt('Nhập tên mẫu sự kiện:', `Mẫu ${event.title}`);
        if (!templateName || !templateName.trim()) return;

        const baseTime = event.startDate ? new Date(event.startDate).getTime() : Date.now();

        const templateRoadmapNodes = (event.roadmap || []).map(node => {
            let relativeDaysStart = -30;
            let relativeDaysDue = 0;
            if (node.startDate) {
                relativeDaysStart = Math.round((new Date(node.startDate).getTime() - baseTime) / (24 * 60 * 60 * 1000));
            }
            if (node.dueDate) {
                relativeDaysDue = Math.round((new Date(node.dueDate).getTime() - baseTime) / (24 * 60 * 60 * 1000));
            }
            return {
                id: node.id,
                parentId: node.parentId,
                name: node.name,
                description: node.description || '',
                priority: node.priority || 'medium',
                relativeDaysStart,
                relativeDaysDue,
                order: node.order || 0,
            };
        });

        const templateBudgetItems = (event.budget?.items || []).map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            defaultEstimatedCost: item.estimatedCost || 0,
            note: item.note || '',
        }));

        try {
            const res = await fetch('/api/events/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: templateName.trim(),
                    type: event.type || 'competition',
                    description: event.description || `Mẫu được tạo từ sự kiện ${event.title}`,
                    roadmapNodes: templateRoadmapNodes,
                    budgetItems: templateBudgetItems,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert('✓ Đã lưu sự kiện thành Mẫu mới thành công!');
            } else {
                alert(data.message || 'Lỗi khi lưu mẫu');
            }
        } catch (err) {
            console.error(err);
            alert('Đã có lỗi xảy ra');
        }
    };

    return (
        <div className="p-0 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col gap-4 sm:gap-5">
            {/* Header with title, actions, and tabs */}
            <EventHeader
                event={event}
                onStatusChange={handleStatusChange}
                onCoverUpload={handleCoverUpload}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                canViewBudget={canViewBudget}
                onSaveAsTemplate={handleSaveAsTemplate}
                onDeleteEvent={handleDeleteEvent}
                onUpdateEvent={handleUpdateMultiple}
            />

            {/* Tab Contents */}
            {activeTab === 'roadmap' && (
                roadmapMode === 'tree' ? (
                    <RoadmapTreeView
                        roadmap={event.roadmap || []}
                        stations={event.stations || []}
                        onUpdateRoadmap={handleUpdateRoadmap}
                        onUpdateStations={handleUpdateStations}
                        onUpdateMultiple={handleUpdateMultiple}
                        users={users}
                        members={event.members || []}
                        event={event}
                        roadmapMode={roadmapMode}
                        setRoadmapMode={setRoadmapMode}
                    />
                ) : (
                    <RoadmapGanttView
                        event={event}
                        roadmap={event.roadmap || []}
                        users={users}
                        members={event.members || []}
                        roadmapMode={roadmapMode}
                        setRoadmapMode={setRoadmapMode}
                    />
                )
            )}

            {activeTab === 'stations' && (
                <EventStationMatrixView
                    event={event}
                    stations={event.stations || []}
                    users={users}
                    members={event.members || []}
                    onUpdateStations={handleUpdateStations}
                />
            )}

            {activeTab === 'equipment' && (
                <EventEquipmentChecklistView
                    event={event}
                    checklist={event.equipmentChecklist || []}
                    onUpdateChecklist={handleUpdateEquipmentChecklist}
                    users={users}
                    members={event.members || []}
                />
            )}

            {activeTab === 'staff' && (
                <EventMembersView
                    event={event}
                    members={event.members || []}
                    roadmap={event.roadmap || []}
                    users={users}
                    onUpdateMembers={handleUpdateMembers}
                    onUpdateRoadmap={handleUpdateRoadmap}
                />
            )}

            {activeTab === 'budget' && canViewBudget && (
                <BudgetExpenseView
                    budget={event.budget || {}}
                    onUpdateBudget={handleUpdateBudget}
                    users={users}
                    members={event.members || []}
                    event={event}
                />
            )}

            {activeTab === 'media' && (
                <MediaDriveGalleryView
                    event={event}
                    onUpdateMedia={handleUpdateMedia}
                />
            )}

            {activeTab === 'retro' && (
                <RetrospectiveView
                    event={event}
                    onUpdateSummaryReport={handleUpdateSummaryReport}
                    onMarkCompleted={() => handleStatusChange('completed')}
                />
            )}

            {/* Bottom Info Bar */}
            <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-sm text-[var(--text-secondary)]">
                <span>Mã sự kiện: <code className="text-blue-600 font-mono font-bold">{event.code || event._id}</code></span>
            </div>
        </div>
    );
}
