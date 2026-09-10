'use client';
import React, { useState, useEffect } from 'react';
import EventHeader from '@/app/events/[id]/ui/EventHeader';
import RoadmapTreeView from '@/app/events/[id]/ui/RoadmapTreeView';
import RoadmapGanttView from '@/app/events/[id]/ui/RoadmapGanttView';
import EventStationMatrixView from '@/app/events/[id]/ui/EventStationMatrixView';
import EventEquipmentChecklistView from '@/app/events/[id]/ui/EventEquipmentChecklistView';
import EventMembersView from '@/app/events/[id]/ui/EventMembersView';
import BudgetExpenseView from '@/app/events/[id]/ui/BudgetExpenseView';
import MediaDriveGalleryView from '@/app/events/[id]/ui/MediaDriveGalleryView';
import RetrospectiveView from '@/app/events/[id]/ui/RetrospectiveView';
import { IconLock, IconAlertCircle } from '@/app/events/ui/icons';

export default function PublicEventViewer({ token }) {
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [users, setUsers] = useState([]);
    const [allowedTabs, setAllowedTabs] = useState({});
    const [activeTab, setActiveTab] = useState('roadmap');
    const [roadmapMode, setRoadmapMode] = useState('tree'); // 'tree' or 'gantt'
    const [requirePin, setRequirePin] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const fetchEventData = async (pin = '') => {
        try {
            setLoading(true);
            setPinError('');
            const url = `/api/events/share/${token}${pin ? `?pin=${encodeURIComponent(pin)}` : ''}`;
            const res = await fetch(url);
            const data = await res.json();

            if (res.status === 401 && data.requirePin) {
                setRequirePin(true);
                setErrorMessage(data.message || 'Sự kiện yêu cầu mã PIN để truy cập.');
                setLoading(false);
                return;
            }

            if (!res.ok || !data.success) {
                setErrorMessage(data.message || 'Không thể tải dữ liệu sự kiện.');
                setLoading(false);
                return;
            }

            setEvent(data.event);
            setUsers(data.users || []);
            setAllowedTabs(data.allowedTabs || {});
            setRequirePin(false);

            // Set default active tab to first allowed tab
            const tabsOrder = ['roadmap', 'stations', 'equipment', 'staff', 'budget', 'media', 'retro'];
            const firstAllowed = tabsOrder.find(t => data.allowedTabs ? data.allowedTabs[t] !== false : true);
            if (firstAllowed) {
                setActiveTab(firstAllowed);
            }
        } catch (err) {
            console.error('Error loading public event:', err);
            setErrorMessage('Đã có lỗi xảy ra khi kết nối máy chủ.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchEventData();
        }
    }, [token]);

    const handlePinSubmit = (e) => {
        e.preventDefault();
        if (!pinInput.trim()) {
            setPinError('Vui lòng nhập mã PIN');
            return;
        }
        fetchEventData(pinInput.trim());
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6">
                <div className="flex flex-col items-center gap-3">
                    <span className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-[var(--text-secondary)] font-semibold">Đang tải thông tin sự kiện...</span>
                </div>
            </div>
        );
    }

    if (requirePin) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[var(--bg-primary)] p-6 sm:p-8 rounded-3xl border border-[var(--border-color)] shadow-xl flex flex-col items-center text-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
                        <IconLock className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                            Sự kiện được bảo vệ bằng Mã PIN
                        </h2>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5">
                            Vui lòng nhập mã PIN được Ban tổ chức cung cấp để xem nội dung sự kiện.
                        </p>
                    </div>

                    <form onSubmit={handlePinSubmit} className="w-full flex flex-col gap-3.5">
                        <input
                            type="password"
                            maxLength={8}
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                            placeholder="Nhập mã PIN..."
                            className="w-full text-center text-xl tracking-widest px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        />
                        {errorMessage && (
                            <p className="text-xs text-rose-500 font-medium">{errorMessage}</p>
                        )}
                        {pinError && (
                            <p className="text-xs text-rose-500 font-medium">{pinError}</p>
                        )}
                        <button
                            type="submit"
                            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 border-none cursor-pointer transition-all"
                        >
                            Mở khóa xem sự kiện
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (!event || errorMessage) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-[var(--bg-primary)] p-8 rounded-3xl border border-[var(--border-color)] text-center flex flex-col items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center">
                        <IconAlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                        Không thể truy cập sự kiện
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                        {errorMessage || 'Liên kết không tồn tại, đã hết hạn hoặc bị thu hồi quyền truy cập.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-full p-2 sm:p-4 md:p-6 flex flex-col gap-4 sm:gap-5 min-w-0 overflow-x-hidden print:p-0">
            {/* 1. Header component in readOnly mode */}
            <EventHeader
                event={event}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                canViewBudget={!!allowedTabs?.budget}
                readOnly={true}
                allowedTabs={allowedTabs}
            />

            {/* 2. Tab Contents */}
            {activeTab === 'roadmap' && allowedTabs.roadmap !== false && (
                roadmapMode === 'tree' ? (
                    <RoadmapTreeView
                        roadmap={event.roadmap || []}
                        stations={event.stations || []}
                        users={users}
                        members={event.members || []}
                        event={event}
                        roadmapMode={roadmapMode}
                        setRoadmapMode={setRoadmapMode}
                        readOnly={true}
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

            {activeTab === 'stations' && allowedTabs.stations !== false && (
                <EventStationMatrixView
                    event={event}
                    stations={event.stations || []}
                    users={users}
                    members={event.members || []}
                    readOnly={true}
                />
            )}

            {activeTab === 'equipment' && allowedTabs.equipment !== false && (
                <EventEquipmentChecklistView
                    event={event}
                    checklist={event.equipmentChecklist || []}
                    users={users}
                    members={event.members || []}
                    readOnly={true}
                />
            )}

            {activeTab === 'staff' && allowedTabs.staff !== false && (
                <EventMembersView
                    event={event}
                    members={event.members || []}
                    roadmap={event.roadmap || []}
                    users={users}
                    readOnly={true}
                />
            )}

            {activeTab === 'budget' && allowedTabs?.budget && (
                <BudgetExpenseView
                    budget={event.budget || {}}
                    users={users}
                    members={event.members || []}
                    event={event}
                    readOnly={true}
                />
            )}

            {activeTab === 'media' && allowedTabs.media !== false && (
                <MediaDriveGalleryView
                    event={event}
                    readOnly={true}
                />
            )}

            {activeTab === 'retro' && allowedTabs.retro !== false && (
                <RetrospectiveView
                    event={event}
                    readOnly={true}
                />
            )}

            {/* 3. Bottom Info Bar */}
            <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs sm:text-sm text-[var(--text-secondary)]">
                <span>Mã sự kiện: <code className="text-blue-600 font-mono font-bold">{event.code || event._id}</code></span>
                <span className="font-semibold text-gray-500 dark:text-gray-400">AI Robotic — Cổng Kế hoạch & Kịch bản Sự kiện</span>
            </div>
        </div>
    );
}
