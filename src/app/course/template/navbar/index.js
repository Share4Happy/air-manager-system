'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import CourseItem from '../../ui/course-item';
import { useRouter } from 'next/navigation';
import Loading from '@/components/(ui)/(loading)/loading';
import CourseTryItem from '../../ui/coursetry-item';
import { reloadCourse } from '@/data/actions/reload';

const getIsoDateString = (date) => {
    return date.toISOString().split('T')[0];
};

export default function Navbar({ data = [], book = [], user, areas = [], trys, teacher }) {
    const router = useRouter();
    const [isReloading, setIsReloading] = useState(false);
    const [tab, setTab] = useState(2);
    const [search, setSearch] = useState('');
    const [area, setArea] = useState('');
    const [timeRange, setTimeRange] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);


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

    const { groups, areaOptions } = useMemo(() => {
        const result = {
            groups: { inProgress: [], completed: [] },
            areaMap: new Map(),
        };

        data.forEach((c) => {
            const teacherId = c.TeacherHR?._id || c.TeacherHR
            const isTeacher = String(teacherId) === String(user.id)
            const isTA = c.Detail?.some(d => String(d.TeachingAs?._id || d.TeachingAs) === String(user.id))
            if (!isTeacher && !isTA) return
            if (c.Area && c.Area._id) { result.areaMap.set(c.Area._id, c.Area); }
            if (!c.Status && c.Type !== 'Học thử') { result.groups.inProgress.push(c) }
            else if (c.Status && c.Type === 'AI Robotic') { result.groups.completed.push(c) }
        });

        const sortByNewest = (a, b) => String(b._id).localeCompare(String(a._id))
        result.groups.inProgress.sort(sortByNewest)
        result.groups.completed.sort(sortByNewest)

        return {
            groups: result.groups,
            areaOptions: Array.from(result.areaMap.values()),
        };
    }, [data, user?.id]);

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
            case 2:
                return [...groups.inProgress.filter(courseFilter), ...groups.completed.filter(courseFilter)];
            default:
                return [];
        }
    }, [tab, groups, courseFilter]);

    return (
        <>
            <div className={'flex flex-col h-full'}>
                <div className={'flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 p-2 md:p-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]'}>
                    <div className={`flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 w-full ${showFilters ? 'flex' : 'hidden'} md:flex`}>
                        <input
                            className='px-3 py-2 md:py-2.5 border border-gray-200 rounded bg-white text-sm outline-none resize-none text-[var(--text-primary)] w-full md:flex-1 min-w-0'
                            placeholder="Tìm kiếm..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                         <select
                             className='px-3 py-2 md:py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none text-[var(--text-primary)] w-full md:w-auto'
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

                         <div className='flex gap-2 w-full md:w-auto'>
                             <input
                                 type="date"
                                 className='px-3 py-2 md:py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none flex-1 min-w-0'
                                 value={startDate}
                                 onChange={(e) => { setStartDate(e.target.value); setTimeRange('') }}
                             />

                             <input
                                 type="date"
                                 className='px-3 py-2 md:py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none flex-1 min-w-0'
                                 value={endDate}
                                 onChange={(e) => { setEndDate(e.target.value); setTimeRange('') }}
                             />
                         </div>

                         <div className='flex items-center gap-2 w-full md:w-auto'>
                             <select
                                 className='px-3 py-2 md:py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none flex-1 md:flex-none'
                                 value={tab}
                                 onChange={(e) => setTab(Number(e.target.value))}
                             >
                                 <option value={2}>Tất cả</option>
                                 <option value={0}>Đang học</option>
                                 <option value={1}>Hoàn thành</option>
                             </select>
                             <button
                                 className='px-4 py-2 md:py-2.5 rounded-lg font-medium cursor-pointer flex items-center gap-2 bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0] text-sm shrink-0'
                                 onClick={reloadData}
                                 disabled={isReloading}
                             >
                                 {isReloading ? 'Đang tải...' : 'Làm mới'}
                             </button>
                         </div>
                    </div>
                    <button className="md:hidden flex items-center justify-end w-full border-none cursor-pointer bg-transparent" onClick={() => setShowFilters(!showFilters)}>
                        <div className="w-7 h-7 rounded-full border border-[var(--border-color)] flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={14} height={14} fill="var(--text-secondary)">
                                <path d="M3.9 54.9C10.5 40.9 24.5 32 40 32l432 0c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9 320 448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6l0-79.1L9 97.5C-.7 85.4-2.8 68.8 3.9 54.9z"/>
                            </svg>
                        </div>
                    </button>
                </div>

                <div className={'flex-1 overflow-y-auto p-3 md:p-[16px_3px] m-[0_-3px] box-border'}>
                    {listForTab.length ? (
                        <div className={'flex flex-wrap gap-3 md:gap-4'}>
                            {(tab === 0 || tab === 2) && <CourseTryItem data={trys} />}
                            {listForTab.map((c) =>
                                <CourseItem key={c.ID} data={c} />
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
