'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Nav from '@/app/course/ui/nav-item';
import CourseItem from '@/app/course/ui/course-item';
import Create from '@/app/course/ui/create';
import { useRouter } from 'next/navigation';
import Loading from '@/components/(ui)/(loading)/loading';
import CourseTryItem from '@/app/course/ui/coursetry-item';
import { reloadCourse } from '@/data/actions/reload';

function BookIcon({ active }) {
    return (
        <svg
            viewBox="0 0 384 512"
            height="20"
            width="20"
            fill={active ? '#ffffff' : 'var(--text-primary)'}
            aria-hidden="true"
        >
            <path d="M0 48v439.7A24.3 24.3 0 0 0 24.3 512c5 0 9.9-1.5 14-4.4L192 400l153.7 107.6a24.4 24.4 0 0 0 14 4.4A24.3 24.3 0 0 0 384 487.7V48A48 48 0 0 0 336 0H48A48 48 0 0 0 0 48z" />
        </svg>
    );
}

const getIsoDateString = (date) => {
    return date.toISOString().split('T')[0];
};

export default function Navbar({ data = [], book = [], user, areas = [], trys, teacher }) {
    const router = useRouter();
    const [isReloading, setIsReloading] = useState(false);
    const [tab, setTab] = useState(0);
    const [search, setSearch] = useState('');
    const [area, setArea] = useState('');
    const [timeRange, setTimeRange] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(true);

    useEffect(() => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        switch (timeRange) {
            case 'currentWeek':
                start.setDate(now.getDate() - now.getDay());
                end.setDate(now.getDate() + (6 - now.getDay()));
                break;
            case 'lastWeek':
                start.setDate(now.getDate() - now.getDay() - 7);
                end.setDate(now.getDate() - now.getDay() - 1);
                break;
            case 'currentMonth':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'lastMonth':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'currentYear':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31);
                break;
            case 'lastYear':
                start = new Date(now.getFullYear() - 1, 0, 1);
                end = new Date(now.getFullYear() - 1, 11, 31);
                break;
            default:
                setStartDate('');
                setEndDate('');
                return;
        }

        setStartDate(getIsoDateString(start));
        setEndDate(getIsoDateString(end));
    }, [timeRange]);

    const reloadData = useCallback(async () => {
        setIsReloading(true)
        await reloadCourse()
        router.refresh()
        setIsReloading(false)
    }, [router]);

    const { counts, groups, areaOptions } = useMemo(() => {
        const result = {
            counts: { inProgress: 0, completed: 0 },
            groups: { inProgress: [], completed: [] },
            areaMap: new Map(),
        };

        data.forEach((c) => {
            if (c.Area && c.Area._id) { result.areaMap.set(c.Area._id, c.Area); }
            if (!c.Status && c.Type !== 'Học thử') { result.groups.inProgress.push(c) }
            else if (c.Status && c.Type === 'AI Robotic') { result.groups.completed.push(c) }
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
            if (area && c.Area._id !== area) return false;

            const q = search.trim().toLowerCase();
            const hasMatch = !q || c.ID.toLowerCase().includes(q) || (c.TeacherHR && c.TeacherHR.name.toLowerCase().includes(q));
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

    const TABS = [
        { label: 'Khóa học đang học', count: counts.inProgress, icon: <BookIcon active={tab === 0} /> },
        { label: 'Khóa học hoàn thành', count: counts.completed, icon: <BookIcon active={tab === 1} /> },
    ];

    return (
        <>
            <div className={'flex flex-col h-full'}>
                <div className={'flex bg-[var(--bg-primary)] p-4 rounded-lg border border-[var(--border-color)]'}>
                    {TABS.map((t, i) => (
                        <div
                            key={t.label}
                            className={`flex-1 flex items-center justify-center cursor-pointer transition-[background-color] duration-200 ${i === tab ? 'bg-[var(--main_d)] text-white rounded' : ''}`}
                            onClick={() => setTab(i)}
                        >
                            <Nav
                                icon={t.icon}
                                title={t.label}
                                sl={t.count}
                                status={i === tab}
                            />
                        </div>
                    ))}
                </div>

                <div className={'flex items-center gap-3 p-3 mt-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]'}>
                    <button className={'lg:hidden p-1.5 border border-[var(--border-color)] rounded cursor-pointer bg-transparent shrink-0'}
                        onClick={() => setShowFilters(p => !p)}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={16} height={16}
                            fill="var(--text-primary)"
                            style={{ transform: showFilters ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }}>
                            <path d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/>
                        </svg>
                    </button>

                    <div className={`flex items-center gap-3 flex-1 flex-wrap ${showFilters ? 'flex' : 'hidden lg:flex'}`}>
                        <input
                            className={`px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none resize-none text-[var(--text-primary)] w-full sm:w-[250px] lg:w-[300px]`}
                            placeholder="Nhập ID khóa học hoặc tên GVCN"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <select
                            className='px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none text-[var(--text-primary)] min-w-[130px]'
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

                        <select
                            className='px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none min-w-[130px]'
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                        >
                            <option value="">Tùy chọn thời gian</option>
                            <option value="currentWeek">Tuần này</option>
                            <option value="lastWeek">Tuần trước</option>
                            <option value="currentMonth">Tháng này</option>
                            <option value="lastMonth">Tháng trước</option>
                            <option value="currentYear">Năm này</option>
                            <option value="lastYear">Năm trước</option>
                        </select>

                        <input
                            type="date"
                            className='px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none w-[140px]'
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setTimeRange('') }}
                        />

                        <input
                            type="date"
                            className='px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none w-[140px]'
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setTimeRange('') }}
                        />

                        <button
                            className={`px-3 py-2 rounded-lg font-medium cursor-pointer flex items-center gap-2 bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0] text-sm whitespace-nowrap`}
                            onClick={reloadData}
                            disabled={isReloading}
                        >
                            {isReloading ? 'Đang tải...' : 'Làm mới'}
                        </button>
                        {(user.role.includes('Admin') || user.role.includes('Acadamic')) && <Create teachers={teacher} books={book} areas={areas} />}
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
