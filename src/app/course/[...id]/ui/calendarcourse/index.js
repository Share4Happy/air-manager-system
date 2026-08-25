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
const MoreIcons = React.memo(({ lesson, onEdit, onDelete, onMakeup }) => {
    const isCancelled = lesson?.Type === 'Báo nghỉ';
    const isPast = useMemo(() => {
        if (!lesson?.Day) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lDate = new Date(lesson.Day);
        lDate.setHours(0, 0, 0, 0);
        return lDate < today;
    }, [lesson?.Day]);

    return (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
            <WrapIcon icon={<svg viewBox="0 0 24 24" width="14" height="14" fill="#fff"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>} content="Sửa lịch học" placement="bottom" style={{ background: 'var(--yellow)' }} click={onEdit} />
            {isCancelled ? (
                <span className="px-2 py-1 rounded text-red-700 bg-red-100 text-xs font-semibold select-none">
                    Đã báo nghỉ
                </span>
            ) : isPast ? (
                <WrapIcon
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={12} height={12} fill="#94a3b8">
                            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"/>
                        </svg>
                    }
                    content="Buổi học đã diễn ra (Không thể báo nghỉ)"
                    placement="bottom"
                    style={{ background: '#e2e8f0', cursor: 'not-allowed' }}
                    click={onDelete}
                />
            ) : (
                <button
                    onClick={onDelete}
                    className="px-2.5 py-1.5 flex items-center gap-1.5 rounded text-white text-xs font-medium cursor-pointer border-none hover:opacity-90 transition-all"
                    style={{ background: '#dc2626' }}
                    title="Báo nghỉ buổi học"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={12} height={12} fill="white">
                        <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"/>
                    </svg>
                    <span>Báo nghỉ</span>
                </button>
            )}
            <WrapIcon icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={13} height={13} fill="#fff"><path d="M128 0c17.7 0 32 14.3 32 32l0 32 128 0 0-32c0-17.7 14.3-32 32-32s32 14.3 32 32l0 32 48 0c26.5 0 48 21.5 48 48l0 48L0 160l0-48C0 85.5 21.5 64 48 64l48 0 0-32c0-17.7 14.3-32 32-32zM0 192l448 0 0 272c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 192zm232 96c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 48-48 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l48 0 0 48c0 13.3 10.7 24 24 24s24-10.7 24-24l0-48 48 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-48 0 0-48z"/></svg>} content="Tạo buổi bù" placement="bottom" style={{ background: 'var(--green)' }} click={onMakeup} />
        </div>
    );
});
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
                            case 'more': return <Cell key={col.key} flex={col.flex} align={col.align}><MoreIcons lesson={row} onEdit={() => onEdit(row)} onDelete={() => onDelete(row)} onMakeup={() => onMakeup(row)} /></Cell>;
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

    const lastLesson = useMemo(() => {
        const list = toArr(course.Detail).filter(d => d.Type !== 'Báo nghỉ');
        return list[list.length - 1] || toArr(course.Detail)[0] || null;
    }, [course.Detail]);

    // Danh sách GV và Trợ giảng của chính lớp học này
    const courseTeachers = useMemo(() => {
        const set = new Set();
        if (course.TeacherHR?.name) set.add(course.TeacherHR.name);
        toArr(course.Detail).forEach(d => {
            if (d.Teacher?.name) set.add(d.Teacher.name);
            else if (typeof d.Teacher === 'string' && d.Teacher) set.add(d.Teacher);
        });
        const list = Array.from(set);
        return list.length > 0 ? list : allTeachers.map(t => t.name);
    }, [course.TeacherHR, course.Detail, allTeachers]);

    const courseAssistants = useMemo(() => {
        const set = new Set();
        toArr(course.Detail).forEach(d => {
            if (d.TeachingAs?.name) set.add(d.TeachingAs.name);
            else if (typeof d.TeachingAs === 'string' && d.TeachingAs) set.add(d.TeachingAs);
        });
        const list = Array.from(set);
        return ['— Không chọn —', ...(list.length > 0 ? list : allTeachers.map(t => t.name))];
    }, [course.Detail, allTeachers]);

    // Ngày kết thúc (buổi cuối cùng) của khóa học
    const maxCourseDate = useMemo(() => {
        const dates = toArr(course.Detail).map(d => new Date(d.Day).getTime()).filter(t => !isNaN(t));
        return dates.length > 0 ? Math.max(...dates) : null;
    }, [course.Detail]);

    // Tính ngày mặc định cho buổi học bù: Sau khi khóa học đã kết thúc (+ 7 ngày sau buổi cuối)
    const defaultMakeupDate = useMemo(() => {
        if (!maxCourseDate) return new Date().toISOString().split('T')[0];
        const lastDate = new Date(maxCourseDate);
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + 7);
        return nextDate.toISOString().split('T')[0];
    }, [maxCourseDate]);

    // Thống kê số buổi vắng của từng học sinh trong khóa
    const studentAbsenceMap = useMemo(() => {
        const map = new Map();
        toArr(course.Student).forEach(st => {
            const absentCount = (st.Learn || []).filter(l => l.Checkin === 2 || l.Checkin === 3).length;
            map.set(st.ID, absentCount);
        });
        return map;
    }, [course.Student]);

    const absentStudentIds = useMemo(() => {
        return toArr(course.Student).filter(s => (studentAbsenceMap.get(s.ID) || 0) > 0).map(s => s.ID);
    }, [course.Student, studentAbsenceMap]);

    // Điền sẵn thông tin thông minh
    const initialFormState = useMemo(() => {
        const defaultDay = isEditMode
            ? (lesson.Day ? lesson.Day.split('T')[0] : '')
            : defaultMakeupDate;

        const defaultStart = isEditMode
            ? (lesson.Time ? lesson.Time.split('-')[0] : '')
            : (lastLesson?.Time ? lastLesson.Time.split('-')[0] : '18:00');

        const defaultTopic = isEditMode
            ? (lesson.LessonDetails?.Name || '')
            : (lesson?.LessonDetails?.Name || '');

        const defaultTeacher = isEditMode
            ? (lesson.Teacher?.name || '')
            : (course.TeacherHR?.name || lastLesson?.Teacher?.name || courseTeachers[0] || '');

        const defaultTeachingAs = isEditMode
            ? (lesson.TeachingAs?.name || '')
            : (lastLesson?.TeachingAs?.name || '');

        const defaultRoom = isEditMode
            ? (lesson.Room || '')
            : (lastLesson?.Room || (allRooms[0] || ''));

        let defaultStudents = [];
        if (isEditMode) {
            defaultStudents = toArr(course.Student).filter(s => s.Learn?.some(l => l.Lesson === lesson._id)).map(s => s.ID);
        } else if (initialStudents.length > 0) {
            defaultStudents = initialStudents;
        } else if (absentStudentIds.length > 0) {
            defaultStudents = absentStudentIds;
        } else {
            defaultStudents = toArr(course.Student).map(s => s.ID);
        }

        return {
            Day: defaultDay,
            Start: defaultStart,
            Topic: defaultTopic,
            Teacher: defaultTeacher,
            TeachingAs: defaultTeachingAs,
            Room: defaultRoom,
            Students: defaultStudents,
        };
    }, [isEditMode, lesson, lastLesson, course.TeacherHR, course.Student, courseTeachers, allRooms, initialStudents, absentStudentIds, defaultMakeupDate]);

    const [form, setForm] = useState(initialFormState);
    const [open, setOpen] = useState({ topic: false, teacher: false, assist: false, room: false });
    const [saving, setSaving] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const isStudentListLocked = useMemo(() => mode === 'makeup' && initialStudents.length > 0, [mode, initialStudents]);

    const handleFormChange = useCallback((field, value) => setForm(f => ({ ...f, [field]: value })), []);
    const toggleStu = useCallback(id => {
        setForm(f => ({
            ...f,
            Students: f.Students.includes(id) ? f.Students.filter(x => x !== id) : [...f.Students, id]
        }));
    }, []);

    const handleSelectAllStudents = useCallback(() => {
        setForm(f => ({ ...f, Students: toArr(course.Student).map(s => s.ID) }));
    }, [course.Student]);

    const handleDeselectAllStudents = useCallback(() => {
        setForm(f => ({ ...f, Students: [] }));
    }, []);

    const handleSelectAbsentOnly = useCallback(() => {
        setForm(f => ({ ...f, Students: absentStudentIds }));
    }, [absentStudentIds]);

    const handleOpen = useCallback((menu, value) => setOpen(o => ({ ...o, [menu]: value })), []);
    const handlePick = useCallback((field, menuName, value) => { handleFormChange(field, value); handleOpen(menuName, false); }, [handleFormChange, handleOpen]);

    const save = useCallback(async () => {
        if (!isEditMode && (!form.Topic || !form.Day || !form.Start)) {
            onDone(null, false, 'Vui lòng nhập đủ thông tin bắt buộc (Chủ đề, Ngày, Giờ).');
            return;
        }
        if (form.Students.length === 0) {
            onDone(null, false, 'Vui lòng chọn ít nhất 1 học sinh tham gia buổi học bù.');
            return;
        }
        const teacherEntry = allTeachers.find(t => t.name === form.Teacher);
        const teachingAsEntry = allTeachers.find(t => t.name === form.TeachingAs);
        const topicEntry = topicMap.get(form.Topic);

        const [h, m] = form.Start.split(':').map(Number);
        const totalMin = (h || 0) * 60 + (m || 0) + (topicEntry?.Period || lesson?.LessonDetails?.Period || 0) * 45;
        const endH = String(Math.floor(totalMin / 60)).padStart(2, '0');
        const endM = String(totalMin % 60).padStart(2, '0');

        let payload = {
            courseId: course._id,
            student: form.Students || [],
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

    const availableTeachers = useMemo(() => courseTeachers.filter(t => t !== form.TeachingAs), [courseTeachers, form.TeachingAs]);
    const availableAssistants = useMemo(() => courseAssistants.filter(t => t !== form.Teacher), [courseAssistants, form.Teacher]);
    const allTopics = useMemo(() => Array.from(topicMap.keys()), [topicMap]);
    const studentIdToNameMap = useMemo(() => new Map(toArr(course.Student).map(s => [s.ID, s.Name])), [course.Student]);

    // Lọc danh sách học sinh theo ô tìm kiếm
    const filteredStudentList = useMemo(() => {
        const list = toArr(course.Student);
        if (!studentSearch) return list;
        const q = studentSearch.toLowerCase();
        return list.filter(s =>
            (s.Name && s.Name.toLowerCase().includes(q)) ||
            (s.ID && s.ID.toLowerCase().includes(q))
        );
    }, [course.Student, studentSearch]);

    return (
        <>
            {saving && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 2500 }}><Loading content={isEditMode ? "Đang cập nhật..." : "Đang lưu..."} /></div>}
            <div className="flex flex-col gap-4 p-4 max-h-[80vh] overflow-y-auto">
                {/* Chủ đề bài học */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                        Chủ đề bài học <span className="text-rose-500">*</span>
                    </label>
                    {isEditMode ? (
                        <p className="text-xs md:text-sm font-medium text-[var(--text-primary)] p-2.5 bg-[var(--bg-secondary)] rounded border border-[var(--border-color)]">
                            {form.Topic || 'Chưa chọn chủ đề'}
                        </p>
                    ) : (
                        <Menu
                            menuItems={<ListMenu arr={allTopics} empty="Chưa có chủ đề" onPick={v => handlePick('Topic', 'topic', v)} />}
                            menuPosition="bottom"
                            isOpen={open.topic}
                            onOpenChange={v => handleOpen('topic', v)}
                            customButton={
                                <button type="button" className="w-full p-2.5 text-xs md:text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded transition-all text-left flex items-center justify-between hover:border-gray-400">
                                    <span className={form.Topic ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'}>
                                        {form.Topic || '-- Chọn chủ đề bài học --'}
                                    </span>
                                    <span className="text-xs text-[var(--text-secondary)]">▼</span>
                                </button>
                            }
                        />
                    )}
                </div>

                {/* Ngày và Giờ học */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-[var(--text-primary)]">
                            Ngày học bù <span className="text-rose-500">*</span>
                        </label>
                        <DateInput
                            className="w-full p-2.5 text-xs md:text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-left"
                            placeholder="Chọn ngày học"
                            value={form.Day}
                            onChange={v => handleFormChange('Day', v)}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-[var(--text-primary)]">
                            Giờ bắt đầu <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="time"
                            className="w-full p-2.5 text-xs md:text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] outline-none focus:border-gray-400"
                            value={form.Start}
                            onChange={e => handleFormChange('Start', e.target.value)}
                        />
                    </div>
                </div>

                {/* Giáo viên & Trợ giảng (Lấy từ chính lớp học) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-[var(--text-primary)]">Giáo viên phụ trách</label>
                        <Menu
                            menuItems={<ListMenu arr={availableTeachers} empty="Chưa có GV" onPick={v => handlePick('Teacher', 'teacher', v)} />}
                            menuPosition="bottom"
                            isOpen={open.teacher}
                            onOpenChange={v => handleOpen('teacher', v)}
                            customButton={
                                <button type="button" className="w-full p-2.5 text-xs md:text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded transition-all text-left flex items-center justify-between hover:border-gray-400">
                                    <span className={form.Teacher ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'}>
                                        {form.Teacher || '-- Chọn giáo viên lớp --'}
                                    </span>
                                    <span className="text-xs text-[var(--text-secondary)]">▼</span>
                                </button>
                            }
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-[var(--text-primary)]">Trợ giảng</label>
                        <Menu
                            menuItems={<ListMenu arr={availableAssistants} empty="" onPick={v => handlePick('TeachingAs', 'assist', v === '— Không chọn —' ? '' : v)} />}
                            menuPosition="bottom"
                            isOpen={open.assist}
                            onOpenChange={v => handleOpen('assist', v)}
                            customButton={
                                <button type="button" className="w-full p-2.5 text-xs md:text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded transition-all text-left flex items-center justify-between hover:border-gray-400">
                                    <span className={form.TeachingAs ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'}>
                                        {form.TeachingAs || 'Không có trợ giảng'}
                                    </span>
                                    <span className="text-xs text-[var(--text-secondary)]">▼</span>
                                </button>
                            }
                        />
                    </div>
                </div>

                {/* Phòng học */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">Phòng học</label>
                    <Menu
                        menuItems={<ListMenu arr={allRooms} empty="Chưa có phòng" onPick={v => handlePick('Room', 'room', v)} />}
                        menuPosition="bottom"
                        isOpen={open.room}
                        onOpenChange={v => handleOpen('room', v)}
                        customButton={
                            <button type="button" className="w-full p-2.5 text-xs md:text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded transition-all text-left flex items-center justify-between hover:border-gray-400">
                                <span className={form.Room ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'}>
                                    {form.Room || '-- Chọn phòng học --'}
                                </span>
                                <span className="text-xs text-[var(--text-secondary)]">▼</span>
                            </button>
                        }
                    />
                </div>

                {/* Học sinh tham gia */}
                <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-color)]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[var(--text-primary)]">
                                {isStudentListLocked ? 'Học sinh tham gia (cố định)' : 'Chọn học sinh tham gia buổi bù'}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium border border-[var(--border-color)]">
                                Đã chọn {form.Students.length}/{toArr(course.Student).length}
                            </span>
                        </div>

                        {/* Nút thao tác nhanh */}
                        {!isStudentListLocked && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                    type="button"
                                    onClick={handleSelectAllStudents}
                                    className="text-[11px] px-2 py-0.5 rounded bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] font-medium transition-colors"
                                >
                                    Chọn tất cả
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeselectAllStudents}
                                    className="text-[11px] px-2 py-0.5 rounded bg-[var(--bg-secondary)] hover:bg-rose-50 hover:text-rose-600 text-[var(--text-secondary)] border border-[var(--border-color)] font-medium transition-colors"
                                >
                                    Bỏ chọn
                                </button>
                                {absentStudentIds.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleSelectAbsentOnly}
                                        className="text-[11px] px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-medium transition-colors"
                                    >
                                        Chỉ HS vắng ({absentStudentIds.length})
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Ô tìm kiếm học sinh */}
                    {!isStudentListLocked && toArr(course.Student).length > 4 && (
                        <div className="relative">
                            <input
                                className="w-full pl-3 pr-3 py-1.5 text-xs rounded border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-gray-400"
                                placeholder="Tìm theo tên hoặc mã học sinh..."
                                value={studentSearch}
                                onChange={e => setStudentSearch(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Danh sách học sinh */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto p-0.5">
                        {isStudentListLocked ? (
                            toArr(form.Students).map(id => (
                                <div
                                    key={id}
                                    className="p-2 rounded border border-[var(--border-color)] bg-[#e3f2fd] flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-[#1565c0]">✓</span>
                                        <div>
                                            <p className="text-xs font-medium text-[var(--text-primary)]">{studentIdToNameMap.get(id)}</p>
                                            <p className="text-[10px] text-[var(--text-secondary)] font-mono">{id}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : filteredStudentList.length === 0 ? (
                            <p className="text-xs text-[var(--text-secondary)] py-4 text-center col-span-2">Không tìm thấy học sinh phù hợp</p>
                        ) : (
                            filteredStudentList.map(s => {
                                const isSelected = form.Students.includes(s.ID);
                                const absentCount = studentAbsenceMap.get(s.ID) || 0;

                                return (
                                    <div
                                        key={s.ID}
                                        onClick={() => toggleStu(s.ID)}
                                        className={`p-2 rounded border border-[var(--border-color)] cursor-pointer transition-colors flex items-center justify-between select-none ${
                                            isSelected
                                                ? 'bg-[#e3f2fd]'
                                                : 'bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border text-[9px] ${
                                                isSelected ? 'bg-[#1565c0] text-white border-[#1565c0]' : 'border-gray-300 bg-white'
                                            }`}>
                                                {isSelected ? '✓' : ''}
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-[var(--text-primary)]">
                                                    {s.Name}
                                                </p>
                                                <p className="text-[10px] text-[var(--text-secondary)] font-mono">
                                                    {s.ID}
                                                </p>
                                            </div>
                                        </div>

                                        {absentCount > 0 && (
                                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded border bg-rose-50 text-rose-700 border-rose-200">
                                                Vắng {absentCount}b
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-3 border-t border-[var(--border-color)] flex gap-2 justify-end bg-[var(--bg-secondary)]/30">
                <button
                    type="button"
                    className="px-4 py-2 text-xs md:text-sm font-medium rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                    onClick={onCancel}
                >
                    Hủy bỏ
                </button>
                <button
                    type="button"
                    className="px-5 py-2 text-xs md:text-sm font-medium rounded bg-[#1565c0] hover:bg-[#0d47a1] text-white shadow-xs transition-all flex items-center gap-1.5"
                    onClick={save}
                >
                    <span>Lưu buổi học bù</span>
                </button>
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
        if (course.ID) await reloadCourse(course.ID);
        const freshData = await course_data(course._id);
        if (freshData) setCurCourse(freshData);
        window.location.reload();
    }, [course._id, course.ID]);
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
        if (type === 'cancel' && data) {
            if (data.Type === 'Báo nghỉ') {
                setToast({ open: true, status: false, mes: 'Buổi học này đã được báo nghỉ trước đó.' });
                return;
            }
            if (data.Day) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const lDate = new Date(data.Day);
                lDate.setHours(0, 0, 0, 0);
                if (lDate < today) {
                    setToast({
                        open: true,
                        status: false,
                        mes: `Không thể báo nghỉ: Buổi học này đã diễn ra vào ngày ${formatDate(new Date(data.Day))}.`
                    });
                    return;
                }
            }
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