'use client';
import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import EventHeader from './ui/header/EventHeader';
import RoadmapTreeView from './ui/tabs/roadmap/RoadmapTreeView';
import RoadmapGanttView from './ui/tabs/roadmap/RoadmapGanttView';
import RoadmapTableView from './ui/tabs/roadmap/RoadmapTableView';
import EventStationMatrixView from './ui/tabs/stations/EventStationMatrixView';
import EventMembersView from './ui/tabs/staff/EventMembersView';
import BudgetExpenseView from './ui/tabs/budget/BudgetExpenseView';
import MediaDriveGalleryView from './ui/tabs/media/MediaDriveGalleryView';
import RetrospectiveView from './ui/tabs/retro/RetrospectiveView';
import EventEquipmentChecklistView from './ui/tabs/equipment/EventEquipmentChecklistView';
import EventZaloConfigView from './ui/tabs/zalo-config/EventZaloConfigView';
import EventGuideView from './ui/tabs/guide/EventGuideView';
import EventChatBubble from './ui/EventChatBubble';
import { EventDialogProvider, useEventDialog } from '../ui/common';

const getTemplateSignature = (evt) => {
    if (!evt) return '';
    return JSON.stringify({
        title: evt.title || '',
        type: evt.type || '',
        description: evt.description || '',
        roadmap: (evt.roadmap || []).map(r => ({
            id: r.id,
            parentId: r.parentId,
            name: r.name,
            description: r.description,
            priority: r.priority,
            startDate: r.startDate,
            dueDate: r.dueDate,
            order: r.order,
        })),
        budget: (evt.budget?.items || []).map(b => ({
            id: b.id,
            name: b.name,
            category: b.category,
            estimatedCost: b.estimatedCost,
            note: b.note,
        })),
    });
};

function EventDetailContent({ params }) {
    const unwrappedParams = use(params);
    const eventId = unwrappedParams.id;
    const router = useRouter();
    const dialog = useEventDialog();

    const [event, setEvent] = useState(null);
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [canViewBudget, setCanViewBudget] = useState(false);
    const [activeTab, setActiveTab] = useState('roadmap'); // 'roadmap', 'stations', 'equipment', 'staff', 'budget', 'zalo-config', 'media', 'retro', 'guide'
    const [roadmapMode, setRoadmapMode] = useState('tree'); // 'tree' or 'gantt' or 'table'
    const [lastSavedTemplateSig, setLastSavedTemplateSig] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined' && eventId) {
            const saved = localStorage.getItem(`air_evt_tpl_sig_${eventId}`);
            if (saved) {
                setLastSavedTemplateSig(saved);
            }
        }
    }, [eventId]);

    const currentTemplateSig = event ? getTemplateSignature(event) : '';
    const canSaveTemplate = !lastSavedTemplateSig || currentTemplateSig !== lastSavedTemplateSig;

    const normalizeEventStations = (evtData) => {
        if (!evtData || !Array.isArray(evtData.stations)) return evtData;
        const seen = new Set();
        const normalizedStations = evtData.stations.map((st, idx) => {
            let sid = st?.id || st?._id ? String(st.id || st._id) : null;
            if (!sid || seen.has(sid)) {
                sid = `station-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
            }
            seen.add(sid);
            return {
                ...st,
                id: sid,
            };
        });
        return {
            ...evtData,
            stations: normalizedStations,
        };
    };

    const fetchEventDetail = useCallback(async () => {
        try {
            const [resEvt, resUsers, resMe] = await Promise.all([
                fetch(`/api/events/${eventId}`),
                fetch('/api/events/users'),
                fetch('/api/auth/me'),
            ]);

            const dataEvt = await resEvt.json();
            const dataUsers = await resUsers.json();
            const dataMe = await resMe.json();

            if (dataEvt.success && dataEvt.event) {
                setEvent(normalizeEventStations(dataEvt.event));
                setCanViewBudget(!!dataEvt.canViewBudget);
            }
            if (dataUsers.success) {
                setUsers(dataUsers.users || []);
            }
            if (dataMe?.user) {
                setCurrentUser(dataMe.user);
            }
        } catch (err) {
            console.error('Error fetching event detail:', err);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    const [highlightTaskId, setHighlightTaskId] = useState(null);

    useEffect(() => {
        fetchEventDetail();
    }, [fetchEventDetail]);

    // Ensure Roadmap Tree tab is active when highlighting a task from chat
    useEffect(() => {
        const handleHighlight = (e) => {
            const taskId = e.detail?.taskId;
            if (!taskId) return;
            setActiveTab('roadmap');
            setRoadmapMode('tree');
            setHighlightTaskId(String(taskId));
        };

        window.addEventListener('air_highlight_roadmap_task', handleHighlight);
        return () => window.removeEventListener('air_highlight_roadmap_task', handleHighlight);
    }, []);

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
                const normalized = normalizeEventStations(data.event);
                setEvent(prev => ({
                    ...prev,
                    ...normalized,
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

    const handleUpdateZaloConfig = (newConfig) => {
        setEvent(prev => ({ ...prev, zaloConfig: newConfig }));
        updateEventInDB({ zaloConfig: newConfig });
    };

    const handleCoverUpload = (coverFileId) => {
        setEvent(prev => ({ ...prev, coverImage: coverFileId }));
    };

    const handleDeleteEvent = async () => {
        const ok = await dialog.confirm('Bạn có chắc chắn muốn xóa toàn bộ sự kiện này? Thao tác này không thể hoàn tác.', {
            title: 'Xác nhận xóa sự kiện',
            type: 'danger',
            confirmText: 'Xóa vĩnh viễn',
        });
        if (!ok) return;

        try {
            const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.success) {
                dialog.toast('Đã xóa sự kiện thành công', 'success');
                router.push('/events');
            } else {
                dialog.alert(data.message || 'Lỗi khi xóa sự kiện', { type: 'danger' });
            }
        } catch (err) {
            console.error('Error deleting event:', err);
            dialog.alert('Đã có lỗi xảy ra khi xóa sự kiện', { type: 'danger' });
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
        if (!canSaveTemplate) {
            dialog.alert('Sự kiện chưa có thay đổi mới nào để lưu lại thành mẫu.', { title: 'Thông báo', type: 'info' });
            return;
        }

        const templateName = await dialog.prompt('Nhập tên mẫu sự kiện:', `Mẫu ${event.title}`, {
            title: 'Lưu thành Mẫu sự kiện',
            placeholder: 'Ví dụ: Mẫu Ngày hội STEM Trường ABC...',
            confirmText: 'Lưu mẫu',
        });
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
                const sig = getTemplateSignature(event);
                setLastSavedTemplateSig(sig);
                if (typeof window !== 'undefined' && eventId) {
                    localStorage.setItem(`air_evt_tpl_sig_${eventId}`, sig);
                }
                dialog.toast('Đã lưu sự kiện thành Mẫu mới thành công!', 'success');
            } else {
                dialog.alert(data.message || 'Lỗi khi lưu mẫu', { type: 'danger' });
            }
        } catch (err) {
            console.error(err);
            dialog.alert('Đã có lỗi xảy ra khi lưu mẫu', { type: 'danger' });
        }
    };

    return (
        <div className="p-0 w-full max-w-full overflow-x-clip min-w-0 flex flex-col gap-4 sm:gap-5">
            {/* Header with title, actions, and tabs */}
            <EventHeader
                event={event}
                users={users}
                onStatusChange={handleStatusChange}
                onCoverUpload={handleCoverUpload}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                canViewBudget={canViewBudget}
                onSaveAsTemplate={handleSaveAsTemplate}
                canSaveTemplate={canSaveTemplate}
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
                        currentUser={currentUser}
                        users={users}
                        members={event.members || []}
                        event={event}
                        roadmapMode={roadmapMode}
                        setRoadmapMode={setRoadmapMode}
                        highlightTaskId={highlightTaskId}
                        onClearHighlight={() => setHighlightTaskId(null)}
                    />
                ) : roadmapMode === 'gantt' ? (
                    <RoadmapGanttView
                        event={event}
                        roadmap={event.roadmap || []}
                        stations={event.stations || []}
                        currentUser={currentUser}
                        users={users}
                        members={event.members || []}
                        onUpdateRoadmap={handleUpdateRoadmap}
                        onUpdateStations={handleUpdateStations}
                        onUpdateMultiple={handleUpdateMultiple}
                        roadmapMode={roadmapMode}
                        setRoadmapMode={setRoadmapMode}
                    />
                ) : (
                    <RoadmapTableView
                        event={event}
                        roadmap={event.roadmap || []}
                        stations={event.stations || []}
                        currentUser={currentUser}
                        users={users}
                        members={event.members || []}
                        onUpdateRoadmap={handleUpdateRoadmap}
                        onUpdateStations={handleUpdateStations}
                        onUpdateMultiple={handleUpdateMultiple}
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
                    onUpdateMultiple={handleUpdateMultiple}
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

            {activeTab === 'zalo-config' && (
                <EventZaloConfigView
                    event={event}
                    users={users}
                    members={event.members || []}
                    roadmap={event.roadmap || []}
                    onUpdateZaloConfig={handleUpdateZaloConfig}
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
                    users={users}
                    members={event.members || []}
                    roadmap={event.roadmap || []}
                    onUpdateSummaryReport={handleUpdateSummaryReport}
                    onMarkCompleted={() => handleStatusChange('completed')}
                />
            )}

            {activeTab === 'guide' && (
                <EventGuideView
                    event={event}
                    currentUser={currentUser}
                    members={event.members || []}
                    onNavigateTab={setActiveTab}
                />
            )}

            {/* Bottom Info Bar */}
            <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-sm text-[var(--text-secondary)]">
                <span>Mã sự kiện: <code className="text-blue-600 font-mono font-bold">{event.code || event._id}</code></span>
            </div>

            {/* Event-scoped Floating Chat Bubble */}
            <EventChatBubble
                eventId={eventId}
                event={event}
                currentUser={currentUser}
                isPublic={false}
                members={event.members || []}
            />
        </div>
    );
}

export default function EventDetailPage(props) {
    return (
        <EventDialogProvider>
            <EventDetailContent {...props} />
        </EventDialogProvider>
    );
}
