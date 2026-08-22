"use client";
import { useState, useMemo, useEffect, memo } from 'react';import ResponsiveGrid from '@/components/(ui)/grid';
import DetailStudent from '../detatilstudent';
import Student from '../student';
import Calendar from '../calendarcourse';
import Image from 'next/image';
import { Svg_Area, Svg_Canlendar, Svg_Course, Svg_Map, Svg_Profile, Svg_Student } from '@/components/(icon)/svg';
import { useRouter } from 'next/navigation';
import Loading from '@/components/(ui)/(loading)/loading';
import CommentPopup from '../cmt';
import { formatDate, srcImage } from '@/function';
import ImageComponent from '@/components/(ui)/(image)';
import BoxFile from '@/components/(ui)/(box)/file';
import Noti from '@/components/(features)/(noti)/noti';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Link from 'next/link';
import WrapIcon from '@/components/(ui)/(button)/hoveIcon';
import { reloadCourse } from '@/data/actions/reload';
import Pay from '@/app/student/list/ui/pay';
import Export from '../exportStudents';
import CancelLessonPopup from '@/components/(features)/(popup)/cancel_lesson_popup';
import { getEportfolioUrl } from '@/utils/env'

function Detail({ data = [], params, initialLessonId, book, users, studentsx, children }) {
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({
        open: false,
        status: true,
        mes: ''
    });
    const router = useRouter();
    const today = new Date();

    const [sortConfig, setSortConfig] = useState({ key: 'Name', direction: 'ascending' });
    const [showCompletePopup, setShowCompletePopup] = useState(false);
    const [showForceConfirm, setShowForceConfirm] = useState(false);
    const [completeIssues, setCompleteIssues] = useState([]);
    const [activeLessonTab, setActiveLessonTab] = useState(initialLessonId || (params.length > 1 ? params[1] : null));
    const [showNotePopup, setShowNotePopup] = useState(false);
    const [showTimelinePopup, setShowTimelinePopup] = useState(false);
    const [showCancelLessonPopup, setShowCancelLessonPopup] = useState(false);

    useEffect(() => {
        if (initialLessonId) {
            setActiveLessonTab(initialLessonId);
        } else if (params.length > 1) {
            setActiveLessonTab(params[1]);
        } else {
            setActiveLessonTab(null);
        }
    }, [initialLessonId, params[0], params[1]]);

    const lessonFilterId = activeLessonTab || (params.length > 1 ? params[1] : null);

    const images = useMemo(() => {
        const allImages = lessonFilterId
            ? data.Detail?.filter((t) => t._id == lessonFilterId)[0]?.DetailImage || []
            : data.Detail?.flatMap(lesson => lesson.DetailImage || []);
        return allImages?.filter(item => item.type === 'image');
    }, [data.Detail, lessonFilterId]);

    const videos = useMemo(() => {
        const allImages = lessonFilterId
            ? data.Detail?.filter((t) => t._id == lessonFilterId)[0]?.DetailImage || []
            : data.Detail?.flatMap(lesson => lesson.DetailImage || []);
        return allImages?.filter(item => item.type === 'video');
    }, [data.Detail, lessonFilterId]);

    const listColumnsConfig = { mobile: 3, tablet: 5, desktop: 6 };

    const lessProductItems = images?.map((item, index) => (<ImageComponent key={index} width={'100%'} imageInfo={item} refreshData={() => reload()} />));
    const lessProductVideos = videos?.map((item, index) => (<ImageComponent key={index} width={'100%'} imageInfo={item} refreshData={() => reload()} />));

    const handleCompleteCourse = async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const issues = [];

        if (!data || !Array.isArray(data.Detail) || !Array.isArray(data.Student)) {
            issues.push('Dữ liệu khóa học không hợp lệ.');
        } else {
            for (const lesson of data.Detail) {
                if (lesson.Type === 'Báo nghỉ') continue;
                const lessonDate = new Date(lesson.Day);
                if (isNaN(lessonDate.getTime()) || lessonDate > today) {
                    issues.push(`Còn buổi học trong tương lai (${formatDate(lessonDate)}).`);
                }
                if (!lesson.DetailImage || lesson.DetailImage.length === 0) {
                    issues.push(`Buổi học ngày ${formatDate(lessonDate)} thiếu hình ảnh.`);
                }
            }

            const lessonIds = new Set(data.Detail.filter(d => d.Type !== 'Báo nghỉ').map(d => d._id.toString()));
            for (const student of data.Student) {
                if (student.Learn && Array.isArray(student.Learn)) {
                    const relevantLearnHistory = student.Learn.filter(learnItem => lessonIds.has(learnItem.Lesson.toString()));
                    for (const learnItem of relevantLearnHistory) {
                        const lesson = data.Detail.find(d => d._id.toString() === learnItem.Lesson.toString());
                        const lessonDate = lesson ? formatDate(new Date(lesson.Day)) : 'không rõ ngày';
                        if (learnItem.Checkin === 0) {
                            issues.push(`Học sinh ${student.Name || student.StudentId} chưa được điểm danh (buổi ${lessonDate}).`);
                        }
                        if (learnItem.Checkin === 1 && (!learnItem.Cmt || learnItem.Cmt.length === 0)) {
                            issues.push(`Học sinh ${student.Name || student.StudentId} thiếu nhận xét (buổi ${lessonDate}).`);
                        }
                    }
                }
            }
        }

        if (issues.length > 0) {
            setCompleteIssues(issues);
            setShowCompletePopup(true);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/course/${data._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Status: true }),
            });

            const result = await response.json();

            if (response.ok) {
                setNotification({
                    open: true,
                    status: true,
                    mes: result.mes || 'Xác nhận hoàn thành khóa học thành công!'
                });
                router.refresh();
            } else {
                throw new Error(result.mes || 'Có lỗi xảy ra, vui lòng thử lại.');
            }
        } catch (error) {
            setNotification({
                open: true,
                status: false,
                mes: error.message
            });
        } finally {
            setLoading(false);
        }
    };



    const sortedStudents = useMemo(() => {
        const enrichedStudents = enrichStudents(data);

        if (sortConfig.key !== null) {
            const sorted = [...enrichedStudents].sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
            return sorted;
        }
        return enrichedStudents;
    }, [data, sortConfig]);

    const dateRange = useMemo(() => {
        if (!data.Detail?.length) return ['Chưa có dữ liệu', 'Chưa có dữ liệu'];
        let min = Infinity, max = -Infinity;
        for (const item of data.Detail) {
            const d = new Date(item.Day).getTime();
            if (d < min) min = d;
            if (d > max) max = d;
        }
        return [formatDate(new Date(min)), formatDate(new Date(max))];
    }, [data.Detail]);
    const uniqueRooms = useMemo(() => {
        if (!data.Detail) return []
        const isObjectId = v => /^[0-9a-fA-F]{24}$/.test(v)
        const rooms = data.Detail.map(d => d.Room).filter(Boolean).filter(r => !isObjectId(r))
        return [...new Set(rooms)]
    }, [data.Detail])

    const handleSort = (key) => {
        let direction = 'descending';
        if (sortConfig.key === key && sortConfig.direction === 'descending') {
            direction = 'ascending';
        }
        setSortConfig({ key, direction });
    };

    const detailcourse = (
        <> {sortedStudents.map(stu => (
            <div key={stu._id || stu.ID} style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }} >
                {title.map(col =>
                    col.data === 'More' ? (
                        <Cell key="more" flex={col.flex} align={col.align}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} >
                                <Link href={`/${stu.userId}`}>
                                    <WrapIcon
                                        icon={<svg viewBox="0 0 448 512" width="16" height="16" fill="white">
                                            <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512h388.6c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z" />
                                        </svg>}
                                        content={"Chi tiết học sinh"}
                                        placement='bottom'
                                        style={{ background: 'var(--main_d)', borderRadius: 3, margin: 0 }}
                                    />
                                </Link>
                                <Link href={`${getEportfolioUrl()}/e-portfolio/${stu.userId}`} target='_blank'>
                                    <WrapIcon
                                        icon={<Svg_Profile w={16} h={16} c='white' />}
                                        content={"Hồ sơ điện tử"}
                                        placement='bottom'
                                        style={{ background: stu.StatusProfile ? 'var(--main_d)' : 'var(--red)', borderRadius: 3, margin: 0 }}
                                    />
                                </Link>
                                <Pay _id={stu.userId} courseId={data._id} status={stu.StatusCourse} />
                                <DetailStudent data={stu} course={data.Detail} c={data} users={users} studentsx={studentsx} />
                            </div>
                        </Cell>
                    ) : (<Cell key={col.data} flex={col.flex} align={col.align}> {stu[col.data]} </Cell>)
                )}
            </div>
        ))} </>
    )

    const reload = async () => {
        setLoading(true);
        reloadCourse(data._id);
        router.refresh();
        setLoading(false);
    }
    let lesson;
    let statusLesson = [1, 1, 1];
    let checkinStatus = 'chua';
    let slide = ''
    const lessonId = activeLessonTab || (params.length > 1 ? params[1] : null);
    if (lessonId) {
        lesson = data.Detail.find(lesson => lesson._id === lessonId);
        slide = lesson?.LessonDetails?.Slide || '';
        if (!lesson) lesson = data.Detail[0];
        lesson.Student = data.Student.flatMap((s) => {
            let g = (s.Learn || []).filter(t => t.Lesson == lesson._id)
            return g
        })

        let num = 0
        lesson.Student.forEach(element => {
            if (element.Checkin == 0) { statusLesson[0] = 0 }
            if (element.Checkin == 1) {
                num++;
                if ((element.Cmt || []).length == 0) {
                    statusLesson[1] = 0;
                }
                if ((element.Image || []).length == 0) {
                    statusLesson[2] = 0;
                }
            }
        });
        if (num == 0) {
            statusLesson[1] = 0
            statusLesson[2] = 0
        }

        if (lesson?.Checkin?.id) {
            checkinStatus = lesson.Checkin.status === 'tre' ? 'tre' : 'dung-gio';
        }

    }

    return (
        <div className={'p-4 flex flex-col gap-2 overflow-auto rounded-lg shadow-[var(--boxshaw2)] lg:h-[calc(100%-32px)] w-full min-w-0'}>
            <div className={'bg-white rounded flex flex-col lg:flex-row flex-wrap border border-[var(--border-color)] w-full min-w-0'} style={{ padding: 16, gap: 16 }}>
                <div className={'hidden lg:block relative w-[100px] lg:w-[150px] aspect-[4/5] shrink-0'}>
                    {data.Book?.Image ? (
                        <Image priority={true} src={srcImage(data.Book.Image)} fill alt={data.Book.Name} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-secondary)] bg-gray-100 rounded">No image</div>
                    )}
                </div>
                <div style={{ flex: 1 }}>
                    <p className="text-base font-semibold text-[var(--text-primary)]" style={{ marginBottom: 8 }}>
                        {lessonId ? `Thông tin buổi học (${lesson?.Type === 'Báo nghỉ' ? 'Báo nghỉ' : lesson?.Type === 'Học bù' ? 'Học bù' : (new Date(lesson?.Day) < new Date().setHours(0,0,0,0) ? 'Đã diễn ra' : 'Chưa diễn ra')})` : 'Thông tin khóa học'}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {!lessonId ?
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width={14} height={14} fill='var(--text-primary)'><path d="M249.6 471.5c10.8 3.8 22.4-4.1 22.4-15.5l0-377.4c0-4.2-1.6-8.4-5-11C247.4 52 202.4 32 144 32C93.5 32 46.3 45.3 18.1 56.1C6.8 60.5 0 71.7 0 83.8L0 454.1c0 11.9 12.8 20.2 24.1 16.5C55.6 460.1 105.5 448 144 448c33.9 0 79 14 105.6 23.5zm76.8 0C353 462 398.1 448 432 448c38.5 0 88.4 12.1 119.9 22.6c11.3 3.8 24.1-4.6 24.1-16.5l0-370.3c0-12.1-6.8-23.3-18.1-27.6C529.7 45.3 482.5 32 432 32c-58.4 0-103.4 20-123 35.6c-3.3 2.6-5 6.8-5 11L304 456c0 11.4 11.7 19.3 22.4 15.5z" /></svg>
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Chương trình học :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">{data.Book.Name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width={14} height={14} fill='var(--text-primary)'>
                                        <path d="M0 48V487.7C0 501.1 10.9 512 24.3 512c5 0 9.9-1.5 14-4.4L192 400 345.7 507.6c4.1 2.9 9 4.4 14 4.4c13.4 0 24.3-10.9 24.3-24.3V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48z" /></svg>
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Tên khóa học :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">{data.ID}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Student w={15} h={15} c='var(--text-primary)' />
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Sỉ số khóa :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">{data.Student.length} học sinh</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Canlendar w={14} h={14} c='var(--text-primary)' />
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Thời gian học :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">{dateRange[0] || 'Trống'} - {dateRange[1] || 'Trống'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Profile w={14} h={14} c='var(--text-primary)' />
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Giáo viên chủ nhiệm :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">{data.TeacherHR?.name || 'Trống'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Map w={14} h={14} c='var(--text-primary)' />
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Phòng học :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">
                                        {uniqueRooms.length > 0 ? uniqueRooms.join(', ') : (data.Area?.name || 'Trống')}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width={14} height={14} fill='var(--text-primary)'>
                                        <path d="M0 24C0 10.7 10.7 0 24 0L360 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-8 0 0 19c0 40.3-16 79-44.5 107.5L225.9 256l81.5 81.5C336 366 352 404.7 352 445l0 19 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24L24 512c-13.3 0-24-10.7-24-24s10.7-24 24-24l8 0 0-19c0-40.3 16-79 44.5-107.5L158.1 256 76.5 174.5C48 146 32 107.3 32 67l0-19-8 0C10.7 48 0 37.3 0 24zM110.5 371.5c-3.9 3.9-7.5 8.1-10.7 12.5l184.4 0c-3.2-4.4-6.8-8.6-10.7-12.5L192 289.9l-81.5 81.5zM284.2 128C297 110.4 304 89 304 67l0-19L80 48l0 19c0 22.1 7 43.4 19.8 61l184.4 0z" /></svg>
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Tiến độ :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">{data.Progress} Tiết</span>
                                </div>
                            </> :
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Course w={14} h={14} c='var(--text-primary)' />
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Chủ đề học :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">{lesson.LessonDetails.Name || 'Trống'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Canlendar w={14} h={14} c='var(--text-primary)' />
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Thời gian học :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">{lesson.Time || 'Trống'} - {formatDate(new Date(lesson.Day)) || 'Trống'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Map w={14} h={14} c='var(--text-primary)' />
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Phòng học :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">{lesson.Room && !/^[0-9a-fA-F]{24}$/.test(lesson.Room) ? lesson.Room : 'Trống'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Area w={14} h={14} c='var(--text-primary)' />
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Khu vực :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">{data.Area?.name || 'Trống'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <Svg_Map w={14} h={14} c='var(--text-primary)' />
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Trạng thái lớp học :</span>
                                </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <p className="Chip text-xs font-normal text-[var(--text-primary)]" style={{ background: checkinStatus === 'dung-gio' ? 'var(--green)' : checkinStatus === 'tre' ? 'var(--yellow)' : 'var(--red)', color: 'white', padding: '4px 12px', borderRadius: 12, width: 'max-content' }}>
                                        {checkinStatus === 'dung-gio' ? 'Checkin đúng giờ' : checkinStatus === 'tre' ? 'Checkin trễ' : 'Chưa checkin'}
                                    </p>
                                    <p className="Chip text-xs font-normal text-[var(--text-primary)]" style={{ background: statusLesson[0] == 1 ? 'var(--green)' : 'var(--red)', color: 'white', padding: '4px 12px', borderRadius: 12, width: 'max-content' }}>
                                        Điểm danh
                                    </p>
                                    <p className="Chip text-xs font-normal text-[var(--text-primary)]" style={{ background: statusLesson[1] == 1 ? 'var(--green)' : 'var(--red)', color: 'white', padding: '4px 12px', borderRadius: 12, width: 'max-content' }}>
                                        Nhận xét
                                    </p>
                                    <p className="Chip text-xs font-normal text-[var(--text-primary)]" style={{ background: statusLesson[2] == 1 ? 'var(--green)' : 'var(--red)', color: 'white', padding: '4px 12px', borderRadius: 12, width: 'max-content' }}>
                                        Minh chứng
                                    </p>
                                </div>
                            </>}
                        <div style={{ display: 'flex', gap: 8 }}>
                            <div className='px-2.5 py-1.5 bg-[var(--main_b)] flex items-center gap-1.5 w-max rounded text-white text-xs font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ marginTop: 8, borderRadius: 5, background: 'var(--main_d)' }} onClick={reload}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={14} height={14} fill='white'>
                                    <path d="M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160 352 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l111.5 0c0 0 0 0 0 0l.4 0c17.7 0 32-14.3 32-32l0-112c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 35.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1L16 432c0 17.7 14.3 32 32 32s32-14.3 32-32l0-35.1 17.6 17.5c0 0 0 0 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.8c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-.1-.1L125.6 352l34.4 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L48.4 288c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.6 1z" /></svg>
                                <p className='hidden sm:inline text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Tải lại dữ liệu</p>
                            </div>
                            {lessonId && <div className='px-2.5 py-1.5 bg-[var(--main_b)] flex items-center gap-1.5 w-max rounded text-white text-xs font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ marginTop: 8, borderRadius: 5, background: '#f59e0b' }} onClick={() => router.push(`/calendar/${lessonId}`)}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={14} height={14} fill='white'>
                                    <path d="M152 24c0-13.3 10.7-24 24-24s24 10.7 24 24l0 40 112 0 0-40c0-13.3 10.7-24 24-24s24 10.7 24 24l0 40 48 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 128C0 92.7 28.7 64 64 64l48 0 0-40zM337 209L209 337c-9.4 9.4-24.6 9.4-33.9 0l-47-47c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l30.1 30.1L303.1 175.1c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"/>
                                </svg>
                                <p className='hidden sm:inline text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Điểm danh bù</p>
                            </div>}
                            {(lessonId && !data.Status) &&
                                <div
                                    className='px-2.5 py-1.5 bg-red-600 flex items-center gap-1.5 w-max rounded text-white text-xs font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-red-700 hover:-translate-y-0.5'
                                    style={{ marginTop: 8, borderRadius: 5, background: '#dc2626' }}
                                    onClick={() => setShowCancelLessonPopup(true)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={14} height={14} fill='white'>
                                        <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"/>
                                    </svg>
                                    <p className='hidden sm:inline text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Báo nghỉ</p>
                                </div>}
                            {!lessonId &&
                                <>
                                    {data.Status ?
                                        <div
                                            className='px-2.5 py-1.5 bg-[var(--main_b)] flex items-center gap-1.5 w-max rounded text-white text-xs font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5'
                                            style={{
                                                marginTop: 8,
                                                borderRadius: 5,
                                                background: 'var(--green)',
                                                cursor: 'not-allowed',
                                                transform: 'none'
                                            }}

                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width={14} height={14} fill='white'>
                                                <path d="M96 80c0-26.5 21.5-48 48-48l288 0c26.5 0 48 21.5 48 48l0 304L96 384 96 80zm313 47c-9.4-9.4-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L409 161c9.4-9.4 9.4-24.6 0-33.9zM0 336c0-26.5 21.5-48 48-48l16 0 0 128 448 0 0-128 16 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48L48 480c-26.5 0-48-21.5-48-48l0-96z" />
                                            </svg>
                                            <p className='hidden sm:inline text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Đã hoàn thành</p>
                                        </div> : <div
                                            className='px-2.5 py-1.5 bg-[var(--main_b)] flex items-center gap-1.5 w-max rounded text-white text-xs font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5'
                                            style={{
                                                marginTop: 8,
                                                borderRadius: 5,
                                                background: 'var(--main_d)',
                                                cursor: 'pointer'
                                            }}
                                            onClick={handleCompleteCourse}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width={14} height={14} fill='white'>
                                                <path d="M96 80c0-26.5 21.5-48 48-48l288 0c26.5 0 48 21.5 48 48l0 304L96 384 96 80zm313 47c-9.4-9.4-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L409 161c9.4-9.4 9.4-24.6 0-33.9zM0 336c0-26.5 21.5-48 48-48l16 0 0 128 448 0 0-128 16 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48L48 480c-26.5 0-48-21.5-48-48l0-96z" />
                                            </svg>
                                            <p className='hidden sm:inline text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}> Xác nhận hoàn thành</p>
                                        </div>}
                                    <Export />
                                    <div className='px-2.5 py-1.5 bg-[var(--main_b)] flex items-center gap-1.5 w-max rounded text-white text-xs font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5 lg:hidden' style={{ marginTop: 8, borderRadius: 5, background: 'var(--main_d)' }} onClick={() => setShowTimelinePopup(true)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={14} height={14} fill="white">
                                            <path d="M156.6 384.9L125.7 354c-8.5-8.5-11.5-20.8-7.7-32.2c3-8.9 7-20.5 11.8-33.8L24 288c-8.6 0-16.6-4.6-20.9-12.1s-4.2-16.7 .2-24.1l52.5-88.5c4.7-7.8 13-12.9 22.2-13c.4 0 .8 0 1.2 0c9.4 .3 18.1 4.8 23.4 12.4l66.9 94.5c5.5-3.5 11.4-6.9 17.8-10.4c7.9-4.3 15.4-8.1 22.5-11.4l-36.6-70.3c-4.5-8.6-3.4-18.8 2.8-26.3s15.9-10.2 25-9.2l93.6 9.8c3.3 .3 6.6 .9 9.8 1.7l78.6-87.9c5.8-6.5 14.1-10.2 22.8-10.2s17 3.7 22.8 10.2l45 50.4c6.5 7.3 6.5 18 0 25.3L409.5 146.9c2.7 1.5 5.4 3.1 8.1 4.9c11.9 7.9 22.2 17.2 30.9 27.7l0 0 0 0c20.8 25.1 37.3 55.6 48.1 89.3c2.6 8.2 4.9 16.8 6.8 25.6c2.7 12.3-1.2 25-10.3 33.9s-21.4 12.8-33.8 11.6c-9.1-.9-18.1-3.5-27-6.3c-18.9-5.9-37.3-14.8-54.4-25.9c-2.5-1.6-4.9-3.3-7.3-5L243.1 403.2c-5.2 7.4-13.9 12-23.3 12c-2.9 0-5.7-.4-8.4-1.3l-84.3-23.8c-6.6-1.9-12-6.4-15-12.2s-3.3-13.2 .6-19z"/>
                                        </svg>
                                        <p className='hidden sm:inline text-xs font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Lộ trình</p>
                                    </div>
                                </>

                            }
                        </div>
                    </div>
                </div>
                <div className="w-full lg:w-[220px]">
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-2 lg:gap-3 w-full">
                        <div className="w-full flex-1 h-12 lg:h-auto lg:aspect-square lg:w-[104px]"><Student course={data} student={sortedStudents} /></div>
                        <div className="w-full flex-1 h-12 lg:h-auto lg:aspect-square lg:w-[104px]"><Calendar course={data} student={sortedStudents} /></div>
                    </div>
                </div>
            </div>

            <div className={'bg-white rounded flex justify-between border border-[var(--border-color)] w-full min-w-0'}>
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', flexWrap: 'nowrap' }}>
                        <button
                            className="px-3 py-2 text-sm font-medium whitespace-nowrap"
                            style={{
                                flex: '0 0 auto',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: activeLessonTab === null ? 'var(--main_d)' : 'var(--text-primary)',
                                fontWeight: activeLessonTab === null ? 600 : 400,
                                borderBottom: activeLessonTab === null ? '2px solid var(--main_d)' : '2px solid transparent',
                                transition: 'all 0.2s',
                            }}
                            onClick={() => {
                                setActiveLessonTab(null);
                                if (typeof window !== 'undefined') {
                                    window.history.pushState(null, '', `/course/${data.ID || params[0]}`);
                                }
                            }}
                        >
                            Tổng quan
                        </button>
                        {data.Detail.map((lesson, idx) => (
                            <button
                                key={lesson._id}
                                className="px-3 py-2 text-sm font-medium whitespace-nowrap"
                                style={{
                                    flex: '0 0 auto',
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    color: activeLessonTab === lesson._id ? 'var(--main_d)' : 'var(--text-primary)',
                                    fontWeight: activeLessonTab === lesson._id ? 600 : 400,
                                    borderBottom: activeLessonTab === lesson._id ? '2px solid var(--main_d)' : '2px solid transparent',
                                    transition: 'all 0.2s',
                                }}
                                onClick={() => {
                                    setActiveLessonTab(lesson._id);
                                    if (typeof window !== 'undefined') {
                                        window.history.pushState(null, '', `/course/${data.ID || params[0]}?lesson=${idx + 1}`);
                                    }
                                }}
                            >
                                Buổi {idx + 1}
                            </button>
                        ))}
                    </div>
                    <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                        <div style={{ minWidth: 650 }}>
                        <div style={{ display: 'flex', background: 'var(--border-color)' }}>
                            {title.map((e, i) => {
                            if (activeLessonTab && e.data === 'b') return null;
                            const isSortable = !activeLessonTab && ['m', 'k', 'c', 'b'].includes(e.data);

                            return (
                                <div key={i} className="text-sm font-normal text-[var(--text-primary)]" style={{ flex: e.flex, padding: '12px 8px', fontWeight: '500', display: 'flex', justifyContent: e.align, alignItems: 'center' }}>
                                    {isSortable ? (
                                        <button onClick={() => handleSort(e.data)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}>
                                            {e.content}
                                        </button>
                                    ) : (
                                        e.content
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    {activeLessonTab ? (
                        <> {data.Student.filter((stu, idx, arr) => { const k = stu._id?.toString() || stu.ID || idx; return arr.findIndex(s => (s._id?.toString() || s.ID) === k) === idx; }).map(stu => {
                            return (
                                <div key={stu._id || stu.ID} style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }} >
                                    {title.map(col => {
                                        let learnDetailsArray = Object.values(stu.Learn || {});
                                        learnDetailsArray = (learnDetailsArray || []).filter(ld => ld.Lesson?.toString() === activeLessonTab.toString())[0]
                                        let m = learnDetailsArray?.Checkin == '1' ? 1 : 0;
                                        let c = learnDetailsArray?.Checkin == '3' ? 1 : 0;
                                        let k = learnDetailsArray?.Checkin == '2' ? 1 : 0;
                                        let cmt = learnDetailsArray?.Cmt || [];
                                        let cmtfn = learnDetailsArray?.CmtFn || '';
                                        stu.course = data.ID;
                                        stu.lesson = data.Detail.find(lesson => lesson._id === activeLessonTab);
                                        stu.m = m;
                                        stu.c = c;
                                        stu.k = k;
                                        stu.cmt = cmt;
                                        stu.cmtfn = cmtfn;
                                        if (col.data === 'b') return null;
                                        return (
                                            col.data === 'More' ?
                                                <Cell key="more" flex={col.flex} align={col.align}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} >
                                                        <CommentPopup data={stu} lesson={activeLessonTab} course={data._id} />
                                                        <DetailStudent data={stu} course={data.Detail} c={data} users={users} studentsx={studentsx} />
                                                    </div>
                                                </Cell>
                                                : <Cell key={col.data} flex={col.flex} align={col.align}>{stu[col.data]}</Cell>
                                        )
                                    })}
                                </div>
                            )
                        })} </>
                    ) : detailcourse}
                    </div>
                    </div>
                    {activeLessonTab && data.Detail.find(l => l._id === activeLessonTab) && (
                        <div style={{ padding: '8px 16px', display: 'flex' }}>
                            <button
                                className="px-3 py-1.5 text-sm font-medium transition-colors rounded flex items-center gap-1.5 border-none cursor-pointer"
                                style={{
                                    background: 'var(--main_d)',
                                    color: 'white',
                                }}
                                onClick={() => setShowNotePopup(true)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={14} height={14} fill="white">
                                    <path d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z"/>
                                </svg>
                                Ghi chú
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className={'bg-white rounded flex justify-between border border-[var(--border-color)]'}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <p style={{ padding: 16, borderBottom: 'thin solid var(--border-color)' }} className='text-base font-semibold text-[var(--text-primary)]'>Hình ảnh</p>
                    <div style={{ padding: 8 }}>
                        {images.length > 0 ? (
                            <ResponsiveGrid items={lessProductItems} columns={listColumnsConfig} type="list" />
                        ) : (
                            <div style={{ padding: 16, textAlign: 'center' }} className='text-sm font-normal text-[var(--text-primary)]'>Không có hình ảnh nào.</div>
                        )}
                    </div>
                </div>
            </div>

            <div className={'bg-white rounded flex justify-between border border-[var(--border-color)]'}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <p style={{ padding: 16, borderBottom: 'thin solid var(--border-color)' }} className='text-base font-semibold text-[var(--text-primary)]'>Video thuyết trình</p>
                    <div style={{ padding: 8 }}>
                        {videos.length > 0 ? (
                            <ResponsiveGrid items={lessProductVideos} columns={listColumnsConfig} type="list" />
                        ) : (
                            <div style={{ padding: 16, textAlign: 'center' }} className='text-sm font-normal text-[var(--text-primary)]'>Không có video nào.</div>
                        )}
                    </div>
                </div>
            </div>

            {lessonId &&
                <div className={'bg-white rounded flex justify-between border border-[var(--border-color)]'}>
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <p style={{ padding: 16, borderBottom: 'thin solid var(--border-color)' }} className='text-base font-semibold text-[var(--text-primary)]'>Tài nguyên giảng dạy</p>
                        <div style={{ padding: 8 }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                <BoxFile type='Ppt' name='Slide giảng dạy' href={slide} />
                            </div>
                        </div>
                    </div>
                </div>
            }

            {loading && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                <Loading />
            </div>}

            <Noti
                open={notification.open}
                onClose={() => setNotification({ ...notification, open: false })}
                status={notification.status}
                mes={notification.mes}
            />

            <CenterPopup open={showCompletePopup} onClose={() => setShowCompletePopup(false)} title="Chưa thể hoàn thành khóa học" size="md">
                <div className="p-4 flex flex-col gap-3">
                    {completeIssues.map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={14} height={14} fill="#dc2626" className="mt-0.5 shrink-0">
                                <path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .1 40.1S486.3 480 472 480L40 480c-14.3 0-27.6-7.7-34.6-20.1s-7.2-27.6 0-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24l0 112c0 13.3 10.7 24 24 24s24-10.7 24-24l0-112c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/>
                            </svg>
                            <span>{issue}</span>
                        </div>
                    ))}
                    <div className="flex gap-3 justify-center mt-2">
                        <button
                            className="px-4 py-2 rounded text-white text-sm font-medium border-none cursor-pointer"
                            style={{ background: 'var(--green)' }}
                            onClick={() => setShowForceConfirm(true)}
                        >
                            Đồng ý hoàn thành khóa
                        </button>
                        <button
                            className="px-4 py-2 rounded text-white text-sm font-medium border-none cursor-pointer"
                            style={{ background: 'var(--main_d)' }}
                            onClick={() => setShowCompletePopup(false)}
                        >
                            Đã hiểu
                        </button>
                    </div>
                </div>
            </CenterPopup>

            <CenterPopup open={showForceConfirm} onClose={() => setShowForceConfirm(false)} title="Xác nhận hoàn thành khóa học" size="md">
                <div className="p-4 flex flex-col gap-3">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Khóa học vẫn còn những vấn đề sau:</p>
                    <div className="max-h-[300px] overflow-y-auto flex flex-col gap-2">
                        {completeIssues.map((issue, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={14} height={14} fill="#ca8a04" className="mt-0.5 shrink-0">
                                    <path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .1 40.1S486.3 480 472 480L40 480c-14.3 0-27.6-7.7-34.6-20.1s-7.2-27.6 0-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24l0 112c0 13.3 10.7 24 24 24s24-10.7 24-24l0-112c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/>
                                </svg>
                                <span>{issue}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">Bạn có chắc muốn hoàn thành khóa học bất chấp những vấn đề trên?</p>
                    <div className="flex gap-3 justify-center mt-2">
                        <button
                            className="px-4 py-2 rounded text-white text-sm font-medium border-none cursor-pointer"
                            style={{ background: 'var(--red)' }}
                            onClick={async () => {
                                setShowForceConfirm(false);
                                setShowCompletePopup(false);
                                setLoading(true);
                                try {
                                    const response = await fetch(`/api/course/${data._id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ Status: true }),
                                    });
                                    const result = await response.json();
                                    if (response.ok) {
                                        setNotification({
                                            open: true, status: true,
                                            mes: result.mes || 'Xác nhận hoàn thành khóa học thành công!'
                                        });
                                        router.refresh();
                                    } else {
                                        throw new Error(result.mes || 'Có lỗi xảy ra, vui lòng thử lại.');
                                    }
                                } catch (error) {
                                    setNotification({
                                        open: true, status: false, mes: error.message
                                    });
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        >
                            Xác nhận
                        </button>
                        <button
                            className="px-4 py-2 rounded text-white text-sm font-medium border-none cursor-pointer"
                            style={{ background: 'var(--text-secondary)' }}
                            onClick={() => setShowForceConfirm(false)}
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            </CenterPopup>

            <CenterPopup open={showNotePopup} onClose={() => setShowNotePopup(false)} title="Ghi chú buổi học" size="sm">
                <div className="p-4 flex flex-col gap-3">
                    <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                        {data.Detail.find(l => l._id === activeLessonTab)?.Note || 'Không có ghi chú'}
                    </p>
                    <button
                        className="px-4 py-2 rounded text-white text-sm font-medium border-none cursor-pointer self-center mt-2"
                        style={{ background: 'var(--main_d)' }}
                        onClick={() => setShowNotePopup(false)}
                    >
                        Đóng
                    </button>
                </div>
            </CenterPopup>

            <CenterPopup open={showTimelinePopup} onClose={() => setShowTimelinePopup(false)} title="Lộ trình khóa học" size="lg">
                <div className="max-h-[80vh] overflow-y-auto">
                    {children}
                </div>
            </CenterPopup>

            <CancelLessonPopup
                open={showCancelLessonPopup}
                onClose={() => setShowCancelLessonPopup(false)}
                courseId={data?._id}
                lessonId={lessonFilterId}
                lessonData={data?.Detail?.find(l => l._id === lessonFilterId)}
                courseData={data}
                onSuccess={reload}
                showNoti={(status, mes) => setNotification({ open: true, status, mes })}
            />
        </div>
    )
}

export default memo(Detail);

const title = [
    { content: 'ID', flex: 0.5, data: 'ID', align: 'start' },
    { content: 'Họ và tên', flex: 1, data: 'Name', align: 'start' },
    { content: 'Có mặt', flex: 0.5, data: 'm', align: 'center' },
    { content: 'Không phép', flex: 0.5, data: 'k', align: 'center' },
    { content: 'Có phép', flex: 0.5, data: 'c', align: 'center' },
    { content: 'Thêm', flex: 1, data: 'More', align: 'center' },
]

function enrichStudents(course, now = new Date()) {
    if (!course || !course.Detail) {
        return [];
    }

    const pastLessonIds = new Set(
        course.Detail
            .filter(({ Day }) => {
                if (!Day) return false;
                return new Date(Day) <= now;
            })
            .map(({ _id }) => _id.toString())
    );

    const totalPastLessons = pastLessonIds.size;

    if (!course.Student) {
        return [];
    }

    const seen = new Set();
    return course.Student.filter(stu => {
        const key = stu._id?.toString() || stu.ID;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    }).map(stu => {
        const counts = [0, 0, 0, 0];

        if (stu.Learn && Array.isArray(stu.Learn)) {
            for (const learnItem of stu.Learn) {
                const { Lesson, Checkin } = learnItem;
                const lessonIdStr = Lesson?.toString();

                if (!lessonIdStr || !pastLessonIds.has(lessonIdStr)) {
                    continue;
                }

                const idx = Number(Checkin);
                if (!isNaN(idx) && idx >= 0 && idx <= 3) {
                    counts[idx] += 1;
                }
            }
        }
        const [_, m, k, c] = counts;
        return { ...stu, m, k, c };
    });
}

const Cell = ({ flex, align, children }) => (
    <div style={{ flex, padding: '8px 8px', display: 'flex', justifyContent: align }} className="text-sm font-normal text-[var(--text-primary)]" > {children} </div>
);