'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import WrapIcon from '@/components/(ui)/(button)/hoveIcon';
import Noti from '@/components/(features)/(noti)/noti';
import Menu from '@/components/(ui)/(button)/menu';
import Loading from '@/components/(ui)/(loading)/loading';
import DateInput from '@/components/(ui)/(input)/DateInput';
import TextNoti from '@/components/(features)/(noti)/textnoti';
import CancelLessonPopup from '@/components/(features)/(popup)/cancel_lesson_popup';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/function';
import { reloadCourse } from '@/data/actions/reload';
import { course_data, user_data } from '@/data/actions/get';

const toArr = v => Array.isArray(v) ? v : v == null ? [] : typeof v === 'object' ? Object.values(v) : [v];
const Cell = React.memo(({ flex, align, header, children }) => (<div style={{ flex, justifyContent: align, fontWeight: header ? 600 : 400 }} className={`${'flex p-[8px_8px]'} text-sm font-normal text-[var(--text-primary)]`}>{children}</div>));
const MoreIcons = React.memo(({ onEdit, onDelete, onMakeup }) => (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
        <WrapIcon icon={<svg viewBox="0 0 24 24" width="14" height="14" fill="#fff"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>} content="Sửa lịch học" placement="bottom" style={{ background: 'var(--yellow)' }} click={onEdit} />
        <button
            onClick={onDelete}
            className="px-2.5 py-1.5 flex items-center gap-1.5 rounded text-white text-xs font-medium cursor-pointer border-none hover:opacity-90 transition-all"
            style={{ background: '#dc2626' }}
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={12} height={12} fill="white">
                <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"/>
            </svg>
            <span>Báo nghỉ</span>
        </button>
        <WrapIcon icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={13} height={13} fill="#fff"><path d="M128 0c17.7 0 32 14.3 32 32l0 32 128 0 0-32c0-17.7 14.3-32 32-32s32 14.3 32 32l0 32 48 0c26.5 0 48 21.5 48 48l0 48L0 160l0-48C0 85.5 21.5 64 48 64l48 0 0-32c0-17.7 14.3-32 32-32zM0 192l448 0 0 272c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 192zm232 96c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 48-48 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l48 0 0 48c0 13.3 10.7 24 24 24s24-10.7 24-24l0-48 48 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-48 0 0-48z"/></svg>} content="Tạo buổi bù" placement="bottom" style={{ background: 'var(--green)' }} click={onMakeup} />
    </div>
));
const ListMenu = React.memo(({ arr, loading, empty, onPick }) => {
    const body = useMemo(() => {
        if (loading) return <Loading content="đang tải..." />;
        const data = toArr(arr);
        if (data.length === 0) return <div style={{ padding: 12 }}>{empty}</div>;
        return data.map((v, i) => (<p key={i} className="text-sm font-normal text-[var(--text-primary)]" onClick={() => onPick(v)}>{v}</p>));
    }, [arr, loading, empty, onPick]);
    return <div className={'mt-2 bg-white p-2 rounded-lg shadow-[var(--boxshaw2)]'}>{body}</div>;
});
const cols = [{ key: 'Day', label: 'Ngày', flex: 0.6, align: 'left' }, { key: 'Time', label: 'Giờ', flex: 0.6, align: 'left' }, { key: 'Topic', label: 'Chủ đề', flex: 2, align: 'left' }, { key: 'Room', label: 'Phòng', flex: 0.7, align: 'left' }, { key: 'Teacher', label: 'Giáo viên', flex: 1.2, align: 'left' }, { key: 'Type', label: 'Trạng thái', flex: 0.8, align: 'center' }, { key: 'more', label: 'Hành động', flex: 1, align: 'center' }];
const ScheduleTable = React.memo(({ course, onEdit, onDelete, onMakeup }) => {

    return (
        <div className={'m-4 border border-[var(--border-color)] rounded-md overflow-x-auto'}>
            <div style={{ minWidth: 800 }}>
            <div className={'flex p-2 border-b border-[var(--border-color)] bg-[var(--border-color)]'}>{cols.map((col, i) => <Cell key={i} flex={col.flex} align={col.align} header>{col.label}</Cell>)}</div>
            {toArr(course?.Detail).map((row, index) => (
                <div key={row._id || index} className={'flex items-center border-b border-[var(--border-color)] bg-white'}>
                    {cols.map(col => {
                        switch (col.key) {
                            case 'Topic': return <Cell key={col.key} flex={col.flex} align={col.align}>{row.LessonDetails?.Name || 'N/A'}</Cell>;
                            case 'Teacher': return <Cell key={col.key} flex={col.flex} align={col.align}>{row.Teacher?.name || 'N/A'}</Cell>;
                            case 'Day': return <Cell key={col.key} flex={col.flex} align={col.align}>{formatDate(new Date(row.Day))}</Cell>;
                            case 'more': return <Cell key={col.key} flex={col.flex} align={col.align}><MoreIcons onEdit={() => onEdit(row)} onDelete={() => onDelete(row)} onMakeup={() => onMakeup(row)} /></Cell>;
                            case 'Type': {
                                let statusText = 'Chưa diễn ra';
                                let statusBg = '#64748b';
                                if (row.Type === 'Báo nghỉ') {
                                    statusText = 'Báo nghỉ';
                                    statusBg = 'var(--red)';
                                } else {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const eventDate = new Date(row.Day);
                                    eventDate.setHours(0, 0, 0, 0);
                                    if (eventDate < today) {
                                        statusText = 'Đã diễn ra';
                                        statusBg = 'var(--green)';
                                    } else if (eventDate.getTime() === today.getTime()) {
                                        statusText = 'Đang diễn ra';
                                        statusBg = 'var(--main_d)';
                                    } else {
                                        statusText = 'Chưa diễn ra';
                                        statusBg = '#64748b';
                                    }
                                }
                                return (
                                    <Cell key={col.key} flex={col.flex} align={col.align}>
                                        <span className='text-xs font-semibold' style={{ padding: '4px 12px', borderRadius: '12px', background: statusBg, color: 'white', whiteSpace: 'nowrap' }}>
                                            {statusText}
                                        </span>
                                    </Cell>
                                );
                            }
                            default: return <Cell key={col.key} flex={col.flex} align={col.align}>{row[col.key]}</Cell>;
                        }
                    })}
                </div>
            ))}
            </div>
        </div>
    );
});
const LessonForm = React.memo(({ mode = 'makeup', course, lesson, onDone, onCancel, initialStudents = [], allTeachers, allRooms, topicMap }) => {
    const isEditMode = mode === 'edit';
    const initialFormState = useMemo(() => ({
        Day: isEditMode ? lesson.Day.split('T')[0] : '',
        Start: isEditMode ? lesson.Time.split('-')[0] : '',
        Topic: isEditMode ? lesson.LessonDetails?.Name : '',
        Teacher: isEditMode ? lesson.Teacher?.name : '',
        TeachingAs: isEditMode ? lesson.TeachingAs?.name : '',
        Room: isEditMode ? lesson.Room : '',
        Students: isEditMode ? toArr(course.Student).filter(s => s.Learn?.some(l => l.Lesson === lesson._id)).map(s => s.ID) : initialStudents,
    }), [mode, lesson, course.Student, initialStudents]);

    const [form, setForm] = useState(initialFormState);
    const [open, setOpen] = useState({ topic: false, teacher: false, assist: false, room: false });
    const [saving, setSaving] = useState(false);
    const isStudentListLocked = useMemo(() => mode === 'makeup' && initialStudents.length > 0, [mode, initialStudents]);

    const handleFormChange = useCallback((field, value) => setForm(f => ({ ...f, [field]: value })), []);
    const toggleStu = useCallback(id => { setForm(f => ({ ...f, Students: f.Students.includes(id) ? f.Students.filter(x => x !== id) : [...f.Students, id] })); }, []);
    const handleOpen = useCallback((menu, value) => setOpen(o => ({ ...o, [menu]: value })), []);
    const handlePick = useCallback((field, menuName, value) => { handleFormChange(field, value); handleOpen(menuName, false); }, [handleFormChange, handleOpen]);

    const save = useCallback(async () => {
        if (!isEditMode && (!form.Topic || !form.Day || !form.Start)) {
            onDone(null, false, 'Vui lòng nhập đủ thông tin bắt buộc.');
            return;
        }
        const teacherEntry = allTeachers.find(t => t.name === form.Teacher);
        const teachingAsEntry = allTeachers.find(t => t.name === form.TeachingAs);
        const topicEntry = topicMap.get(form.Topic);

        const [h, m] = form.Start.split(':').map(Number);
        const totalMin = h * 60 + m + (topicEntry?.Period || lesson?.LessonDetails?.Period || 0) * 45;
        const endH = String(Math.floor(totalMin / 60)).padStart(2, '0');
        const endM = String(totalMin % 60).padStart(2, '0');

        let payload = {
            courseId: course._id,
            data: { ...form, Teacher: teacherEntry?._id, TeachingAs: teachingAsEntry?._id, Time: `${form.Start}-${endH}:${endM}` }
        };
        if (isEditMode) {
            payload.detailId = lesson._id;
        } else {
            payload.type = 'Học bù';
            payload.data.Topic = topicEntry?._id;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/course/ucalendarcourse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const json = await res.json();
            onDone(form, res.ok && json.status === 2, json.mes || (res.ok ? 'Thao tác thành công' : 'Thao tác thất bại'));
        } catch (err) {
            onDone(form, false, err.message || 'Lỗi kết nối máy chủ');
        } finally {
            setSaving(false);
        }
    }, [form, allTeachers, topicMap, course._id, lesson, isEditMode, onDone]);

    const availableTeachers = useMemo(() => allTeachers.filter(t => t.name !== form.TeachingAs).map(t => t.name), [allTeachers, form.TeachingAs]);
    const availableAssistants = useMemo(() => ['— Không chọn —', ...allTeachers.filter(t => t.name !== form.Teacher).map(t => t.name)], [allTeachers, form.Teacher]);
    const allTopics = useMemo(() => Array.from(topicMap.keys()), [topicMap]);
    const studentIdToNameMap = useMemo(() => new Map(toArr(course.Student).map(s => [s.ID, s.Name])), [course.Student]);

    return (
        <>
            {saving && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 2500 }}><Loading content={isEditMode ? "Đang cập nhật..." : "Đang lưu..."} /></div>}
            <div className={'flex flex-col gap-3 p-4'}>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Chủ đề buổi học</p>
                {isEditMode ? <p className="text-sm font-normal text-[var(--text-primary)]" style={{ padding: '10px 12px', background: 'var(--bg_color)', borderRadius: 4 }}>{form.Topic}</p> : <Menu menuItems={<ListMenu arr={allTopics} empty="Chưa có chủ đề" onPick={v => handlePick('Topic', 'topic', v)} />} menuPosition="bottom" isOpen={open.topic} onOpenChange={v => handleOpen('topic', v)} customButton={<button className={'flex-1 w-full p-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg transition-all duration-200 outline-none cursor-pointer text-left'} style={{ textAlign: 'left' }}><p className="text-sm font-normal text-[var(--text-primary)]">{form.Topic || 'Chọn chủ đề'}</p></button>} />}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <DateInput className={'flex-1 w-full p-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg transition-all duration-200 outline-none cursor-pointer text-left'} style={{ flex: 1 }} value={form.Day} onChange={v => handleFormChange('Day', v)} />
                    <input type="time" className={'flex-1 w-full p-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg transition-all duration-200 outline-none cursor-pointer text-left'} style={{ flex: 1 }} value={form.Start} onChange={e => handleFormChange('Start', e.target.value)} />
                </div>
                <p className="text-sm font-semibold text-[var(--text-primary)]" style={{ marginTop: 8 }}>Giáo viên</p>
                <Menu menuItems={<ListMenu arr={availableTeachers} empty="Chưa có GV" onPick={v => handlePick('Teacher', 'teacher', v)} />} menuPosition="bottom" isOpen={open.teacher} onOpenChange={v => handleOpen('teacher', v)} customButton={<button className={'flex-1 w-full p-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg transition-all duration-200 outline-none cursor-pointer text-left'} style={{ textAlign: 'left' }}><p className="text-sm font-normal text-[var(--text-primary)]">{form.Teacher || 'Chọn GV'}</p></button>} />
                <p className="text-sm font-semibold text-[var(--text-primary)]" style={{ marginTop: 8 }}>Trợ giảng</p>
                <Menu menuItems={<ListMenu arr={availableAssistants} empty="" onPick={v => handlePick('TeachingAs', 'assist', v === '— Không chọn —' ? '' : v)} />} menuPosition="bottom" isOpen={open.assist} onOpenChange={v => handleOpen('assist', v)} customButton={<button className={'flex-1 w-full p-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg transition-all duration-200 outline-none cursor-pointer text-left'} style={{ textAlign: 'left' }}><p className="text-sm font-normal text-[var(--text-primary)]">{form.TeachingAs || 'Không có'}</p></button>} />
                <p className="text-sm font-semibold text-[var(--text-primary)]" style={{ marginTop: 8 }}>Phòng học</p>
                <Menu menuItems={<ListMenu arr={allRooms} empty="Chưa có phòng" onPick={v => handlePick('Room', 'room', v)} />} menuPosition="bottom" isOpen={open.room} onOpenChange={v => handleOpen('room', v)} customButton={<button className={'flex-1 w-full p-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg transition-all duration-200 outline-none cursor-pointer text-left'} style={{ textAlign: 'left' }}><p className="text-sm font-normal text-[var(--text-primary)]">{form.Room || 'Chọn phòng'}</p></button>} />
                <p className="text-sm font-semibold text-[var(--text-primary)]" style={{ marginTop: 8 }}>{isStudentListLocked ? 'Học sinh tham gia (cố định)' : 'Chọn học sinh tham gia'}</p>
                <div className={''}>
                    {isStudentListLocked ? toArr(form.Students).map(id => (<div key={id} className="text-sm font-normal text-[var(--text-primary)]" style={{ padding: '10px 16px', borderRadius: 4, background: 'var(--green)', color: '#fff', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><p style={{ fontSize: 14 }}>{id} – {studentIdToNameMap.get(id)}</p></div>)) : toArr(course.Student).map(s => {
                        const selected = form.Students.includes(s.ID);
                        return (<div key={s.ID} className="text-sm font-normal text-[var(--text-primary)]" onClick={() => toggleStu(s.ID)} style={{ padding: '10px 16px', borderRadius: 4, cursor: 'pointer', background: selected ? 'var(--green)' : 'var(--border-color)', color: selected ? '#fff' : 'var(--text-primary)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><p style={{ fontSize: 14 }}>{s.ID} – {s.Name}</p><p style={{ fontSize: 14 }}>{selected ? 'Chọn' : 'Không chọn'}</p></div>);
                    })}
                </div>
            </div>
            <div className={'p-2 border-t border-[var(--border-color)] flex gap-2 justify-end'}>
                <button className="px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5" style={{ borderRadius: 5, background: 'var(--border-color)' }} onClick={onCancel}>Huỷ bỏ</button>
                <button className="px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5" style={{ borderRadius: 5, background: 'var(--green)' }} onClick={save}>Lưu thông tin</button>
            </div>
        </>
    );
});
export default function Calendar({ course }) {
    const router = useRouter();
    const [curCourse, setCurCourse] = useState(course);
    const [allTeachers, setAllTeachers] = useState([]);
    const [allRooms, setAllRooms] = useState([]);
    const [open, setOpen] = useState(false);
    const [popupState, setPopupState] = useState({ type: null, data: null });
    const [toast, setToast] = useState({ open: false, status: false, mes: '' });
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => { setCurCourse(course); }, [course]);
    useEffect(() => {
        const fetchData = async () => {
            const users = await user_data({ activeOnly: true });
            setAllTeachers(users);
            setAllRooms(toArr(course.Area?.rooms).map(r => r.name));
        };
        fetchData();
    }, [course.Area]);

    const topicMap = useMemo(() => new Map(toArr(course.Book?.Topics).map(t => [t.Name, t])), [course.Book?.Topics]);

    const handleClosePopup = useCallback(() => setPopupState({ type: null, data: null }), []);
    const handleUpdateCourse = useCallback(async () => {
        setIsProcessing(true);
        await reloadCourse(course._id);
        const freshData = await course_data(course._id);
        if (freshData) setCurCourse(freshData);
        router.refresh();
        setIsProcessing(false);
    }, [course._id, router]);
    const handleApiResponse = useCallback(async (isSuccess, message) => {
        setToast({ open: true, status: isSuccess, mes: message });
        if (isSuccess) {
            handleClosePopup();
            await handleUpdateCourse();
        }
    }, [handleClosePopup, handleUpdateCourse]);

    const handleOpenPopup = useCallback((type, data = null) => {
        if (type === 'edit' && data?.Type === 'Báo nghỉ') {
            setToast({ open: true, status: false, mes: 'Không thể chỉnh sửa buổi học đã báo nghỉ.' });
            return;
        }
        setPopupState({ type, data });
    }, []);

    const handleFormDone = useCallback((_, ok, mes) => handleApiResponse(ok, mes), [handleApiResponse]);

    const openMakeupForCancelled = useCallback((lesson) => {
        const studentIds = toArr(course.Student).filter(s => s.Learn?.some(l => l.Lesson === lesson._id)).map(s => s.ID);
        handleOpenPopup('makeup', { initialStudents: studentIds });
    }, [course.Student, handleOpenPopup]);

    const renderPopupContent = () => {
        const { type, data } = popupState;
        switch (type) {
            case 'makeup': return <LessonForm mode="makeup" course={curCourse} allTeachers={allTeachers} allRooms={allRooms} topicMap={topicMap} onDone={handleFormDone} onCancel={handleClosePopup} initialStudents={data?.initialStudents || []} />;
            case 'edit': return <LessonForm mode="edit" course={curCourse} lesson={data} allTeachers={allTeachers} allRooms={allRooms} topicMap={topicMap} onDone={handleFormDone} onCancel={handleClosePopup} />;
            default: return null;
        }
    };

    return (
        <>
            {isProcessing && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 2500 }}><Loading content="Đang xử lý..." /></div>}
            <div className={'w-full h-full flex flex-row lg:flex-col items-center justify-center gap-2 rounded-md cursor-pointer bg-[#eaf9ff] transition-all duration-100 hover:bg-[#e1fff6] hover:-translate-y-0.5 px-3 py-2 border-none'} onClick={() => setOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={16} height={16}><path fill="currentColor" d="M96 32v32H48C21.5 64 0 85.5 0 112v48h448v-48c0-26.5-21.5-48-48-48h-48V32a32 32 0 1 0-64 0v32H160V32a32 32 0 1 0-64 0zM448 192H0v272c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V192z" /></svg>
                <p className="text-xs sm:text-sm lg:text-xs font-semibold text-[var(--text-primary)]">Lịch học</p>
            </div>
            <FlexiblePopup open={open} onClose={() => setOpen(false)} title={`Lịch học - ${curCourse.ID}`} width={1200} renderItemList={() => <><div className="flex justify-end px-4 pt-2"><div className='px-2.5 py-1.5 flex items-center gap-1.5 w-max rounded text-white text-xs font-medium cursor-pointer border-none hover:opacity-90 transition-all' style={{ background: 'var(--green)' }} onClick={() => handleOpenPopup('makeup', { initialStudents: [] })}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={12} height={12} fill="white"><path d="M128 0c17.7 0 32 14.3 32 32l0 32 128 0 0-32c0-17.7 14.3-32 32-32s32 14.3 32 32l0 32 48 0c26.5 0 48 21.5 48 48l0 48L0 160l0-48C0 85.5 21.5 64 48 64l48 0 0-32c0-17.7 14.3-32 32-32zM0 192l448 0 0 272c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 192zm232 96c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 48-48 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l48 0 0 48c0 13.3 10.7 24 24 24s24-10.7 24-24l0-48 48 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-48 0 0-48z"/></svg><span>Tạo buổi bù</span></div></div><ScheduleTable course={curCourse} onEdit={(lesson) => handleOpenPopup('edit', lesson)} onDelete={(lesson) => handleOpenPopup('cancel', lesson)} onMakeup={(lesson) => openMakeupForCancelled(lesson)} /></>} />
            {popupState.type && popupState.type !== 'cancel' && <FlexiblePopup open={true} onClose={handleClosePopup} title={popupState.type === 'makeup' ? 'Tạo buổi bù' : 'Chỉnh sửa buổi học'} width={600} renderItemList={renderPopupContent} />}
            <CancelLessonPopup
                open={popupState.type === 'cancel'}
                onClose={handleClosePopup}
                courseId={curCourse._id}
                lessonId={popupState.data?._id}
                lessonData={popupState.data}
                courseData={curCourse}
                onSuccess={async () => {
                    handleClosePopup();
                    await handleUpdateCourse();
                }}
                showNoti={(status, mes) => setToast({ open: true, status, mes })}
            />
            <Noti open={toast.open} status={toast.status} mes={toast.mes} onClose={() => setToast(t => ({ ...t, open: false }))} />
        </>
    );
}