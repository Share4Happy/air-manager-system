'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import EventCard from './ui/EventCard';
import CreateEventModal from './ui/CreateEventModal';
import ManageTemplatesModal from './ui/ManageTemplatesModal';
import DateInput from '@/components/(ui)/(input)/DateInput';
import Loading from '@/components/(ui)/(loading)/loading';
import {
    IconPlus,
    IconFileText,
    IconFilter,
} from './ui/icons';

export default function EventsDashboardPage() {
    const [rawEvents, setRawEvents] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isReloading, setIsReloading] = useState(false);
    const [canViewBudget, setCanViewBudget] = useState(false);

    const [search, setSearch] = useState('');
    const [type, setType] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusTab, setStatusTab] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

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

    const fetchEvents = useCallback(async () => {
        setIsReloading(true);
        try {
            const res = await fetch('/api/events', { cache: 'no-store' });
            const data = await res.json();
            if (data.success) {
                setRawEvents(data.events || []);
                setCanViewBudget(!!data.canViewBudget);
            }
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
            setIsReloading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialMeta();
        fetchEvents();
    }, [fetchInitialMeta, fetchEvents]);

    const handleEventCreated = () => {
        fetchEvents();
    };

    const statusCounts = useMemo(() => {
        const counts = {
            all: 0,
            upcoming: 0,
            happening: 0,
            completed: 0,
            cancelled: 0,
        };

        rawEvents.forEach(event => {
            if (type !== 'all' && event.type !== type) return;

            const q = search.trim().toLowerCase();
            if (q) {
                const hasMatch =
                    (event.title && event.title.toLowerCase().includes(q)) ||
                    (event.code && event.code.toLowerCase().includes(q)) ||
                    (event.location && event.location.toLowerCase().includes(q)) ||
                    (event.lead?.name && event.lead.name.toLowerCase().includes(q));
                if (!hasMatch) return;
            }

            if (startDate || endDate) {
                const evtStart = event.startDate ? new Date(event.startDate) : (event.endDate ? new Date(event.endDate) : null);
                const evtEnd = event.endDate ? new Date(event.endDate) : (event.startDate ? new Date(event.startDate) : null);
                if (!evtStart && !evtEnd) return;

                if (startDate && evtEnd) {
                    const filterStart = new Date(startDate);
                    filterStart.setHours(0, 0, 0, 0);
                    const checkEnd = new Date(evtEnd);
                    checkEnd.setHours(23, 59, 59, 999);
                    if (checkEnd < filterStart) return;
                }

                if (endDate && evtStart) {
                    const filterEnd = new Date(endDate);
                    filterEnd.setHours(23, 59, 59, 999);
                    const checkStart = new Date(evtStart);
                    checkStart.setHours(0, 0, 0, 0);
                    if (checkStart > filterEnd) return;
                }
            }

            counts.all += 1;
            if (event.status === 'planning' || event.status === 'upcoming') {
                counts.upcoming += 1;
            } else if (event.status === 'happening') {
                counts.happening += 1;
            } else if (event.status === 'completed') {
                counts.completed += 1;
            } else if (event.status === 'cancelled') {
                counts.cancelled += 1;
            }
        });

        return counts;
    }, [rawEvents, type, search, startDate, endDate]);

    const statusFilterTabs = [
        { id: 'all', label: 'Tất cả', count: statusCounts.all },
        { id: 'upcoming', label: 'Đang chuẩn bị', count: statusCounts.upcoming, dotColor: 'bg-blue-500' },
        { id: 'happening', label: 'Đang diễn ra', count: statusCounts.happening, dotColor: 'bg-amber-500 animate-pulse' },
        { id: 'completed', label: 'Đã hoàn thành', count: statusCounts.completed, dotColor: 'bg-emerald-500' },
        { id: 'cancelled', label: 'Đã hủy', count: statusCounts.cancelled, dotColor: 'bg-rose-500' },
    ];

    const filteredEvents = useMemo(() => {
        return rawEvents.filter(event => {
            // Status filter
            if (statusTab !== 'all') {
                if (statusTab === 'upcoming') {
                    if (event.status !== 'planning' && event.status !== 'upcoming') return false;
                } else {
                    if (event.status !== statusTab) return false;
                }
            }

            // Type filter
            if (type !== 'all' && event.type !== type) {
                return false;
            }

            // Search filter
            const q = search.trim().toLowerCase();
            if (q) {
                const hasMatch =
                    (event.title && event.title.toLowerCase().includes(q)) ||
                    (event.code && event.code.toLowerCase().includes(q)) ||
                    (event.location && event.location.toLowerCase().includes(q)) ||
                    (event.lead?.name && event.lead.name.toLowerCase().includes(q));
                if (!hasMatch) return false;
            }

            // Date range filter
            if (startDate || endDate) {
                const evtStart = event.startDate ? new Date(event.startDate) : (event.endDate ? new Date(event.endDate) : null);
                const evtEnd = event.endDate ? new Date(event.endDate) : (event.startDate ? new Date(event.startDate) : null);

                if (!evtStart && !evtEnd) return false;

                if (startDate && evtEnd) {
                    const filterStart = new Date(startDate);
                    filterStart.setHours(0, 0, 0, 0);
                    const checkEnd = new Date(evtEnd);
                    checkEnd.setHours(23, 59, 59, 999);
                    if (checkEnd < filterStart) return false;
                }

                if (endDate && evtStart) {
                    const filterEnd = new Date(endDate);
                    filterEnd.setHours(23, 59, 59, 999);
                    const checkStart = new Date(evtStart);
                    checkStart.setHours(0, 0, 0, 0);
                    if (checkStart > filterEnd) return false;
                }
            }

            return true;
        });
    }, [rawEvents, statusTab, type, search, startDate, endDate]);

    const hasActiveFilters = Boolean(type !== 'all' || startDate || endDate);

    return (
        <>
            <div className={'flex flex-col h-full gap-2'}>
                {/* Navbar / Toolbar */}
                <div className={'flex flex-col gap-2.5 p-2.5 md:p-3.5 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]'}>
                    {/* Top Row: Search input + Actions */}
                    <div className="flex items-center gap-2 w-full">
                        {/* Search Input */}
                        <input
                            className="px-3 py-2 md:py-2.5 border border-gray-200 rounded-lg bg-white text-sm outline-none resize-none text-[var(--text-primary)] flex-1 min-w-0"
                            placeholder="Tìm kiếm sự kiện..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        {/* Mobile Filter Toggle Button */}
                        <button
                            type="button"
                            className={`md:hidden relative flex items-center justify-center w-9 h-9 rounded-lg border cursor-pointer transition-colors shrink-0 ${
                                showFilters || hasActiveFilters
                                    ? 'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-950/50 dark:border-blue-700 dark:text-blue-400'
                                    : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)]'
                            }`}
                            onClick={() => setShowFilters(s => !s)}
                            title="Bộ lọc nâng cao"
                        >
                            <IconFilter className="w-4 h-4" />
                            {hasActiveFilters && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-gray-900" />
                            )}
                        </button>

                        {/* Create Event Button (Mobile) */}
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="md:hidden px-3 py-2 rounded-lg font-medium cursor-pointer flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white border-none text-xs shrink-0 shadow-sm"
                        >
                            <IconPlus className="w-4 h-4" />
                            <span>Tạo mới</span>
                        </button>

                        {/* Desktop Inline Filters & Buttons */}
                        <div className="hidden md:flex items-center gap-2 shrink-0">
                            <select
                                className="px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm outline-none text-gray-700 resize-none text-[var(--text-primary)] w-auto"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option value="all">Tất cả phân loại</option>
                                <option value="competition">Cuộc thi</option>
                                <option value="workshop">Workshop / Ngày hội</option>
                                <option value="showcase">Showcase tốt nghiệp</option>
                                <option value="internal">Nội bộ / Tập huấn</option>
                                <option value="other">Khác</option>
                            </select>

                            <div className="flex gap-2">
                                <DateInput
                                    className="px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm outline-none text-gray-700 resize-none w-36"
                                    value={startDate}
                                    onChange={(v) => { setStartDate(v); }}
                                    placeholder="Từ ngày"
                                />
                                <DateInput
                                    className="px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm outline-none text-gray-700 resize-none w-36"
                                    value={endDate}
                                    onChange={(v) => { setEndDate(v); }}
                                    placeholder="Đến ngày"
                                />
                            </div>

                            <button
                                className="px-3.5 py-2.5 rounded-lg font-medium cursor-pointer flex items-center gap-1.5 bg-[#f8fafc] hover:bg-gray-100 text-[#0f172a] border border-[#e2e8f0] text-sm shrink-0 transition-colors"
                                onClick={fetchEvents}
                                disabled={isReloading}
                            >
                                {isReloading ? 'Đang tải...' : 'Làm mới'}
                            </button>

                            <button
                                onClick={() => setIsManageTemplatesOpen(true)}
                                className="px-3.5 py-2.5 rounded-lg font-medium cursor-pointer flex items-center gap-1.5 bg-[#f8fafc] hover:bg-gray-100 text-[#0f172a] border border-[#e2e8f0] text-sm shrink-0 transition-colors"
                            >
                                <IconFileText className="w-4 h-4 text-[var(--text-secondary)]" />
                                <span>Mẫu quy trình</span>
                            </button>

                            <button
                                onClick={() => setIsCreateOpen(true)}
                                className="px-4 py-2.5 rounded-lg font-medium cursor-pointer flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white border-none text-sm shrink-0 shadow-sm"
                            >
                                <IconPlus className="w-4 h-4" />
                                <span>Tạo Sự kiện mới</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Expanded Filters Panel */}
                    {showFilters && (
                        <div className="md:hidden flex flex-col gap-2 pt-2 border-t border-[var(--border-color)]">
                            <select
                                className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm outline-none text-gray-700 text-[var(--text-primary)] w-full"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option value="all">Tất cả phân loại</option>
                                <option value="competition">Cuộc thi</option>
                                <option value="workshop">Workshop / Ngày hội</option>
                                <option value="showcase">Showcase tốt nghiệp</option>
                                <option value="internal">Nội bộ / Tập huấn</option>
                                <option value="other">Khác</option>
                            </select>

                            <div className="flex gap-2 w-full">
                                <DateInput
                                    className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm outline-none text-gray-700 flex-1 min-w-0"
                                    value={startDate}
                                    onChange={(v) => { setStartDate(v); }}
                                    placeholder="Từ ngày"
                                />
                                <DateInput
                                    className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm outline-none text-gray-700 flex-1 min-w-0"
                                    value={endDate}
                                    onChange={(v) => { setEndDate(v); }}
                                    placeholder="Đến ngày"
                                />
                            </div>

                            <div className="flex items-center gap-2 w-full pt-0.5">
                                <button
                                    onClick={() => setIsManageTemplatesOpen(true)}
                                    className="flex-1 px-3 py-2 rounded-lg font-medium cursor-pointer flex items-center justify-center gap-1.5 bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0] text-xs"
                                >
                                    <IconFileText className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                    <span>Mẫu quy trình</span>
                                </button>

                                <button
                                    className="flex-1 px-3 py-2 rounded-lg font-medium cursor-pointer flex items-center justify-center gap-1.5 bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0] text-xs"
                                    onClick={fetchEvents}
                                    disabled={isReloading}
                                >
                                    {isReloading ? 'Đang tải...' : 'Làm mới'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dedicated Status / Progress Filter Bar */}
                <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto pb-1 scrollbar-none px-0.5">
                    {statusFilterTabs.map(tab => {
                        const isActive = statusTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setStatusTab(tab.id)}
                                className={`px-3 md:px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 md:gap-2 cursor-pointer border shrink-0 ${
                                    isActive
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                                }`}
                            >
                                {tab.dotColor && <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : tab.dotColor}`} />}
                                <span>{tab.label}</span>
                                <span
                                    className={`px-1.5 py-0.5 rounded-full text-[10px] md:text-[11px] font-bold ${
                                        isActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-[var(--text-secondary)]'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Grid List */}
                <div className={'flex-1 overflow-y-auto p-2 md:p-[16px_3px] m-[0_-3px] box-border'}>
                    {loading ? (
                        <div className={'flex flex-wrap gap-3 md:gap-4'}>
                            {[1, 2, 3, 4].map(i => (
                                <div
                                    key={i}
                                    className="bg-[var(--bg-primary)] rounded-lg p-4 w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.33%-11px)] xl:w-[calc(25%-12px)] border border-[var(--border-color)] h-64 animate-pulse"
                                />
                            ))}
                        </div>
                    ) : filteredEvents.length ? (
                        <div className={'flex flex-wrap gap-3 md:gap-4'}>
                            {filteredEvents.map((evt) => (
                                <EventCard key={evt._id} event={evt} canViewBudget={canViewBudget} />
                            ))}
                        </div>
                    ) : (
                        <p className={'mt-6 text-[var(--text-secondary)] italic text-center'}>Không tìm thấy sự kiện phù hợp.</p>
                    )}
                </div>
            </div>

            {isReloading && !loading && (
                <div className="loadingOverlay">
                    <Loading content={<p className="text-sm font-normal text-white">Đang tải dữ liệu...</p>} />
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
        </>
    );
}
