'use client';

import { useState, useMemo, useCallback } from 'react';
import CourseItem from '@/app/course/ui/course-item';
import Create from '@/app/course/ui/create';
import { useRouter } from 'next/navigation';
import Loading from '@/components/(ui)/(loading)/loading';
import DateInput from '@/components/(ui)/(input)/DateInput';
import CourseTryItem from '@/app/course/ui/coursetry-item';
import { reloadCourse } from '@/data/actions/reload';

export default function Navbar({ data = [], book = [], user, areas = [], trys, teacher }) {
    const router = useRouter();
    const [isReloading, setIsReloading] = useState(false);
    const [tab, setTab] = useState(0);
    const [search, setSearch] = useState('');
    const [area, setArea] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const reloadData = useCallback(async () => {
        setIsReloading(true);
        await reloadCourse();
        router.refresh();
        setIsReloading(false);
    }, [router]);

    const { counts, groups, areaOptions } = useMemo(() => {
        const result = {
            counts: { inProgress: 0, completed: 0 },
            groups: { inProgress: [], completed: [] },
            areaMap: new Map(),
        };

        data.forEach((c) => {
            if (c.Area && c.Area._id) { result.areaMap.set(c.Area._id, c.Area); }
            if (!c.Status && c.Type !== 'Học thử') { result.groups.inProgress.push(c); }
            else if (c.Status && c.Type === 'AI Robotic') { result.groups.completed.push(c); }
        });

        result.counts.inProgress = result.groups.inProgress.length;
        result.counts.completed = result.groups.completed.length;

        return {
            counts: result.counts,
            groups: result.groups,
            areaOptions: Array.from(result.areaMap.values()),
        };
    }, [data]);

    const courseFilter = useCallback(
        (c) => {
            if (area && c.Area?._id !== area) return false;

            const q = search.trim().toLowerCase();
            const hasMatch = !q || c.ID.toLowerCase().includes(q) || (c.TeacherHR && c.TeacherHR.name?.toLowerCase().includes(q));
            if (!hasMatch) return false;

            if (startDate && endDate) {
                if (!c.Detail || c.Detail.length === 0) return false;

                const courseDates = c.Detail.map(d => new Date(d.Day)).sort((a, b) => a - b);
                const courseStart = courseDates[0];
                const courseEnd = courseDates[courseDates.length - 1];

                const filterStart = new Date(startDate);
                const filterEnd = new Date(endDate);

                courseStart.setHours(0, 0, 0, 0);
                courseEnd.setHours(0, 0, 0, 0);
                filterStart.setHours(0, 0, 0, 0);
                filterEnd.setHours(0, 0, 0, 0);

                return courseStart <= filterEnd && courseEnd >= filterStart;
            }

            return true;
        },
        [search, area, startDate, endDate]
    );

    const listForTab = useMemo(() => {
        switch (tab) {
            case 0:
                return groups.inProgress.filter(courseFilter);
            case 1:
                return groups.completed.filter(courseFilter);
            default:
                return [];
        }
    }, [tab, groups, courseFilter]);

    const hasActiveFilters = Boolean(area || startDate || endDate);

    return (
        <>
            <div className={'flex flex-col h-full'}>
                <div className={'flex flex-col gap-2 p-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)] mt-2'}>
                    {/* Main Toolbar Row */}
                    <div className="flex items-center gap-2 md:gap-3 w-full">
                        {/* Search Input */}
                        <input
                            className='px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none resize-none text-[var(--text-primary)] flex-1 min-w-0'
                            placeholder="Nhập ID khóa học hoặc tên GVCN..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        {/* 2 Tab buttons (Desktop) */}
                        <div className="hidden md:flex bg-gray-100 p-1 rounded-lg border border-gray-200 shrink-0">
                            <button
                                type="button"
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                                    tab === 0
                                        ? 'bg-[var(--main_d)] text-white shadow-sm'
                                        : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                                onClick={() => setTab(0)}
                            >
                                <span>Khóa đang diễn ra</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tab === 0 ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                    {counts.inProgress}
                                </span>
                            </button>
                            <button
                                type="button"
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                                    tab === 1
                                        ? 'bg-[var(--main_d)] text-white shadow-sm'
                                        : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                                onClick={() => setTab(1)}
                            >
                                <span>Khóa hoàn thành</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tab === 1 ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                    {counts.completed}
                                </span>
                            </button>
                        </div>

                        {/* Mobile Create Button */}
                        <div className="md:hidden shrink-0">
                            {(user.role.includes('Admin') || user.role.includes('Academic')) && (
                                <Create teachers={teacher} books={book} areas={areas} />
                            )}
                        </div>

                        {/* Mobile Funnel Button */}
                        <button
                            type="button"
                            className={`md:hidden flex items-center justify-center w-8 h-8 rounded-full border cursor-pointer transition-colors shrink-0 ${
                                showFilters || hasActiveFilters
                                    ? 'bg-blue-50 border-blue-300 text-blue-600'
                                    : 'border-[var(--border-color)] bg-white text-[var(--text-secondary)]'
                            }`}
                            onClick={() => setShowFilters(s => !s)}
                            title="Bộ lọc"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={14} height={14} fill="currentColor">
                                <path d="M3.9 54.9C10.5 40.9 24.5 32 40 32l432 0c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9 320 448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6l0-79.1L9 97.5C-.7 85.4-2.8 68.8 3.9 54.9z"/>
                            </svg>
                        </button>

                        {/* Desktop Inline Filters */}
                        <div className="hidden md:flex items-center gap-2 md:gap-3 shrink-0">
                            <select
                                className='px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none text-[var(--text-primary)] w-auto'
                                value={area}
                                onChange={(e) => setArea(e.target.value)}
                            >
                                <option value="" className='text-sm font-normal text-[var(--text-primary)]'>Tất cả khu vực</option>
                                {areaOptions.map((a, index) =>
                                    a && (
                                        <option key={index} value={a._id} className='text-sm font-normal text-[var(--text-primary)]'>
                                            {a.name}
                                        </option>
                                    )
                                )}
                            </select>

                            <div className='flex gap-2 w-auto'>
                                <DateInput
                                    className='px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none w-32'
                                    value={startDate}
                                    onChange={(v) => setStartDate(v)}
                                    placeholder="Từ ngày"
                                />

                                <DateInput
                                    className='px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none w-32'
                                    value={endDate}
                                    onChange={(v) => setEndDate(v)}
                                    placeholder="Đến ngày"
                                />
                            </div>

                            <button
                                className='px-3 py-2 rounded-lg font-medium cursor-pointer flex items-center gap-2 bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0] text-sm shrink-0 hover:bg-gray-100 transition-colors'
                                onClick={reloadData}
                                disabled={isReloading}
                            >
                                {isReloading ? 'Đang tải...' : 'Làm mới'}
                            </button>

                            {(user.role.includes('Admin') || user.role.includes('Academic')) && (
                                <Create teachers={teacher} books={book} areas={areas} />
                            )}
                        </div>
                    </div>

                    {/* 2 Tab buttons (Mobile row) */}
                    <div className="flex md:hidden bg-gray-100 p-1 rounded-lg border border-gray-200 w-full">
                        <button
                            type="button"
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                                tab === 0
                                    ? 'bg-[var(--main_d)] text-white shadow-sm'
                                    : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                            onClick={() => setTab(0)}
                        >
                            <span>Khóa đang diễn ra</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tab === 0 ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                {counts.inProgress}
                            </span>
                        </button>
                        <button
                            type="button"
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                                tab === 1
                                    ? 'bg-[var(--main_d)] text-white shadow-sm'
                                    : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                            onClick={() => setTab(1)}
                        >
                            <span>Khóa hoàn thành</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tab === 1 ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                {counts.completed}
                            </span>
                        </button>
                    </div>

                    {/* Mobile Collapsible Filters */}
                    <div className={`${showFilters ? 'flex' : 'hidden'} md:hidden flex-col gap-2 pt-2 border-t border-[var(--border-color)]`}>
                        <select
                            className='px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none text-[var(--text-primary)] w-full'
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                        >
                            <option value="">Tất cả khu vực</option>
                            {areaOptions.map((a, index) =>
                                a && (
                                    <option key={index} value={a._id} className='text-sm font-normal text-[var(--text-primary)]'>
                                        {a.name}
                                    </option>
                                )
                            )}
                        </select>

                        <div className='grid grid-cols-2 gap-2 w-full'>
                            <DateInput
                                className='px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none w-full min-w-0'
                                value={startDate}
                                onChange={(v) => setStartDate(v)}
                                placeholder="Từ ngày"
                            />

                            <DateInput
                                className='px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none w-full min-w-0'
                                value={endDate}
                                onChange={(v) => setEndDate(v)}
                                placeholder="Đến ngày"
                            />
                        </div>

                        <button
                            className='w-full px-4 py-2 rounded-lg font-medium cursor-pointer flex items-center justify-center gap-2 bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0] text-sm shrink-0 hover:bg-gray-100 transition-colors'
                            onClick={reloadData}
                            disabled={isReloading}
                        >
                            {isReloading ? 'Đang tải...' : 'Làm mới'}
                        </button>
                    </div>
                </div>

                <div className={'flex-1 overflow-y-auto p-[16px_3px] m-[0_-3px] box-border'}>
                    {listForTab.length ? (
                        <div className={'flex flex-wrap gap-4'}>
                            {tab === 0 && <CourseTryItem data={trys} />}
                            {listForTab.map((c) =>
                                <CourseItem key={c.ID} data={c} currentUser={user} teachers={teacher} books={book} areas={areas} />
                            )}
                        </div>
                    ) : (
                        <p className={'mt-6 text-[var(--text-secondary)] italic text-center'}>Không tìm thấy khóa học phù hợp.</p>
                    )}
                </div>
            </div>
            {isReloading && <div className='loadingOverlay'>
                <Loading content={<p className='text-sm font-normal text-white'>Đang tải dữ liệu...</p>} />
            </div>}
        </>
    );
}
