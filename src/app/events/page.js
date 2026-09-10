'use client';
import React, { useState, useEffect, useCallback } from 'react';
import EventCard from './ui/EventCard';
import CreateEventModal from './ui/CreateEventModal';
import ManageTemplatesModal from './ui/ManageTemplatesModal';
import {
    IconPlus,
    IconFileText,
    IconSearch,
    IconTrophy,
    IconFlame,
    IconClock,
    IconCheckCircle,
    IconLayers,
} from './ui/icons';

export default function EventsDashboardPage() {
    const [events, setEvents] = useState([]);
    const [counts, setCounts] = useState({});
    const [templates, setTemplates] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('all'); // 'all', 'happening', 'upcoming', 'past'
    const [selectedType, setSelectedType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isManageTemplatesOpen, setIsManageTemplatesOpen] = useState(false);

    const fetchInitialMeta = useCallback(async () => {
        try {
            const [resTpl, resUsers] = await Promise.all([
                fetch('/api/events/templates', { cache: 'no-store' }),
                fetch('/api/events/users', { cache: 'no-store' }),
            ]);
            const dataTpl = await resTpl.json();
            const dataUsers = await resUsers.json();
            if (dataTpl.success) setTemplates(dataTpl.templates || []);
            if (dataUsers.success) setUsers(dataUsers.users || []);
        } catch (err) {
            console.error('Error fetching event metadata:', err);
        }
    }, []);

    useEffect(() => {
        fetchInitialMeta();
    }, [fetchInitialMeta]);

    const [canViewBudget, setCanViewBudget] = useState(false);

    // Fetch events list based on tab, type, and search
    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeTab && activeTab !== 'all') {
                params.set('scope', activeTab);
            }
            if (selectedType && selectedType !== 'all') {
                params.set('type', selectedType);
            }
            if (searchQuery.trim()) {
                params.set('search', searchQuery.trim());
            }

            const res = await fetch(`/api/events?${params.toString()}`, { cache: 'no-store' });
            const data = await res.json();
            if (data.success) {
                setEvents(data.events || []);
                setCounts(data.counts || {});
                setCanViewBudget(!!data.canViewBudget);
            }
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    }, [activeTab, selectedType, searchQuery]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleEventCreated = () => {
        fetchEvents();
    };

    const tabs = [
        { id: 'all', label: 'Tất cả sự kiện', icon: IconLayers, count: counts.all || 0 },
        { id: 'happening', label: 'Đang diễn ra', icon: IconFlame, count: counts.happening || 0 },
        { id: 'upcoming', label: 'Đang chuẩn bị', icon: IconClock, count: (counts.planning || 0) + (counts.upcoming || 0) },
        { id: 'past', label: 'Đã hoàn thành', icon: IconCheckCircle, count: counts.past || 0 },
    ];

    return (
        <div className="p-4 sm:p-6 w-full flex flex-col gap-6">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 tracking-wide uppercase">
                            Academic Events
                        </span>
                        <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                            Quản lý Sự kiện & Lộ trình
                        </h1>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
                        Theo dõi tiến độ tổ chức sự kiện theo sơ đồ cây, quản lý khâu chuẩn bị, ngân sách và hình ảnh.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    <button
                        onClick={() => setIsManageTemplatesOpen(true)}
                        className="px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                        <IconFileText className="w-4 h-4 text-[var(--text-secondary)]" />
                        <span>Mẫu quy trình</span>
                    </button>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
                    >
                        <IconPlus className="w-4 h-4" />
                        <span>Tạo Sự kiện mới</span>
                    </button>
                </div>
            </div>

            {/* Filter Navigation Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {tabs.map(t => {
                        const isActive = activeTab === t.id;
                        const TabIcon = t.icon;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap border-none cursor-pointer flex items-center gap-2 ${
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                        : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                                }`}
                            >
                                <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
                                <span>{t.label}</span>
                                <span
                                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)]'
                                    }`}
                                >
                                    {t.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search & Type Select */}
                <div className="flex items-center gap-2.5">
                    {/* Type Filter */}
                    <select
                        value={selectedType}
                        onChange={e => setSelectedType(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Tất cả phân loại</option>
                        <option value="competition">Cuộc thi</option>
                        <option value="workshop">Workshop / Ngày hội</option>
                        <option value="showcase">Showcase tốt nghiệp</option>
                        <option value="internal">Nội bộ / Tập huấn</option>
                        <option value="other">Khác</option>
                    </select>

                    {/* Search Input */}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm sự kiện..."
                            className="pl-8 pr-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-56"
                        />
                        <IconSearch className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Events List Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-80 rounded-2xl bg-[var(--bg-secondary)] animate-pulse border border-[var(--border-color)]" />
                    ))}
                </div>
            ) : events.length === 0 ? (
                <div className="py-16 px-4 text-center rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <IconTrophy className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">Chưa có sự kiện nào trong danh mục này</h3>
                    <p className="text-xs text-[var(--text-secondary)] max-w-md">
                        Bạn có thể khởi tạo sự kiện mới nhanh chóng với các mẫu chuẩn bị sẵn (Cuộc thi Robotics, Workshop STEM, Showcase E-Portfolio).
                    </p>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md border-none cursor-pointer flex items-center gap-1.5"
                    >
                        <IconPlus className="w-3.5 h-3.5" />
                        <span>Tạo sự kiện ngay</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {events.map(evt => (
                        <EventCard key={evt._id} event={evt} canViewBudget={canViewBudget} />
                    ))}
                </div>
            )}

            {/* Create Event Modal */}
            <CreateEventModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={handleEventCreated}
                templates={templates}
                users={users}
            />

            {/* Manage Templates Modal */}
            <ManageTemplatesModal
                isOpen={isManageTemplatesOpen}
                onClose={() => setIsManageTemplatesOpen(false)}
                templates={templates}
                onRefreshTemplates={fetchInitialMeta}
                canViewBudget={canViewBudget}
            />
        </div>
    );
}
