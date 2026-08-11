'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import { Svg_Add, Svg_Delete } from '@/components/(icon)/svg';
import Menu from '@/components/(ui)/(button)/menu';
import Noti from '@/components/(features)/(noti)/noti';
import Loading from '@/components/(ui)/(loading)/loading';
import DateInput from '@/components/(ui)/(input)/DateInput';
import WrapIcon from '@/components/(ui)/(button)/hoveIcon';

export default function Add({ book = [], student = [], teacher = [], area = [], onCreate }) {
    const router = useRouter();
    const students = Array.isArray(student) ? student : [];
    const teachers = Array.isArray(teacher) ? teacher : [];
    const books = Array.isArray(book) ? book : [];
    const areas = Array.isArray(area) ? area : [];

    const roomList = useMemo(() => {
        const m = new Map();
        areas.forEach(a => (a.rooms || []).forEach(r => r._id && r.name && m.set(r._id, r.name)));
        return [...m].map(([id, name]) => ({ id, name }));
    }, [areas]);

    const bookMap = useMemo(() => Object.fromEntries(books.map(b => [b._id, b])), [books]);
    const teacherRaw = useMemo(() => teachers.filter(t => Array.isArray(t.role) && t.role.includes('Teacher')), [teachers]);

    /* ---------- default selections ---------- */
    const defaultBook = useMemo(() => books.find(b => b._id === '685633c413427722b24c3892') || books[0], [books]);
    const defaultTopic = useMemo(() => defaultBook?.Topics?.find(t => t._id === '68565eaf13427722b24c3f50') || defaultBook?.Topics?.[0], [defaultBook]);
    const defaultTeacher = useMemo(() => teachers.find(t => t.name && /khắc\s*hoàng/i.test(t.name.toLowerCase())) || teacherRaw[0], [teachers, teacherRaw]);
    const defaultRoom = useMemo(() => roomList.find(r => r.name === 'B304') || roomList[0], [roomList]);

    /* ---------- state ---------- */
    const [open, setOpen] = useState(false);
    const [showStu, setShowStu] = useState(false);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [notification, setNoti] = useState({ open: false, status: false, mes: '' });
    const [form, setForm] = useState(() => ({
        day: new Date().toISOString().slice(0, 10),
        time: '08:00-10:00',
        room: defaultRoom?.id || '',
        book: defaultBook?._id || '',
        topicId: defaultTopic?._id || '',
        teacher: defaultTeacher?._id || '',
        teachingAs: '',
        studentIds: [],
        note: ''
    }));

    const topics = useMemo(() => bookMap[form.book]?.Topics ?? [], [form.book, bookMap]);

    const selectedStudents = useMemo(() => {
        const selectedIds = new Set(form.studentIds);
        return students.filter(s => selectedIds.has(s._id));
    }, [form.studentIds, students]);

    /* ---------- utils ---------- */
    const normalizeTime = useCallback(v => {
        const m = v.match(/^(\d{1,2})(?::?(\d{0,2}))?-(\d{1,2})(?::?(\d{0,2}))?$/);
        if (!m) return '08:00-10:00';
        const pad = (x, lim) => String(Math.min(lim, +x)).padStart(2, '0');
        const s = `${pad(m[1], 23)}:${pad(m[2] || 0, 59)}`;
        const e = `${pad(m[3], 23)}:${pad(m[4] || 0, 59)}`;
        return s < e ? `${s}-${e}` : `${s}-10:00`;
    }, []);

    const toggleStudent = id =>
        setForm(f =>
            f.studentIds.includes(id)
                ? { ...f, studentIds: f.studentIds.filter(x => x !== id) }
                : { ...f, studentIds: [...f.studentIds, id] }
        );

    /* ---------- submit ---------- */
    const save = async () => {
        if (form.studentIds.length === 0) {
            setNoti({ open: true, status: false, mes: 'Vui lòng chọn ít nhất một học sinh.' });
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/coursetry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            }).then(r => r.json());

            if (!res.status) {
                setNoti({ open: true, status: false, mes: res.mes || 'Tạo buổi thất bại' });
            } else {
                setNoti({ open: true, status: true, mes: 'Thêm buổi học thử thành công!' });
                setOpen(false);
                onCreate && onCreate(res.data);
                setTimeout(() => window.location.reload(), 600);
            }
        } catch (e) {
            setNoti({ open: true, status: false, mes: 'Lỗi mạng hoặc máy chủ' });
        } finally {
            router.refresh();
            setLoading(false);
        }
    };

    /* ---------- dropdown menus ---------- */
    const wrap = arr => <div className={'bg-[var(--bg-primary)] p-2 shadow-[var(--boxshaw2)] mt-[5px] rounded-md max-h-[200px] overflow-y-auto'}>{arr}</div>;
    const bookM = wrap(book.map(b => <p key={b._id} className={'rounded transition-all duration-300 cursor-pointer p-[10px] flex gap-2 items-center hover:bg-[var(--hover)]'} onClick={() => setForm({ ...form, book: b._id, topicId: '' })}>{b.Name}</p>));
    const topicM = wrap(topics.map(t => <p key={t._id} className={'rounded transition-all duration-300 cursor-pointer p-[10px] flex gap-2 items-center hover:bg-[var(--hover)]'} onClick={() => setForm({ ...form, topicId: t._id })}>{t.Name}</p>));
    const roomM = wrap(roomList.map(r => <p key={r.id} className={'rounded transition-all duration-300 cursor-pointer p-[10px] flex gap-2 items-center hover:bg-[var(--hover)]'} onClick={() => setForm({ ...form, room: r.id })}>{r.name}</p>));
    const teachM = wrap(teacherRaw.map(t => <p key={t._id} className={'rounded transition-all duration-300 cursor-pointer p-[10px] flex gap-2 items-center hover:bg-[var(--hover)]'} onClick={() => setForm({ ...form, teacher: t._id })}>{t.name}</p>));
    const asstM = wrap(teacherRaw.map(t => <p key={t._id} className={'rounded transition-all duration-300 cursor-pointer p-[10px] flex gap-2 items-center hover:bg-[var(--hover)]'} onClick={() => setForm({ ...form, teachingAs: t._id })}>{t.name}</p>));

    /* ---------- students popup ---------- */
    const filteredStu = useMemo(() => {
        const q = search.toLowerCase();
        return students.filter(s =>
            (s.Name && s.Name.toLowerCase().includes(q)) ||
            (s.ID && s.ID.toLowerCase().includes(q))
        );
    }, [search, students]);

    const stuList = (
        <div className={'flex flex-col gap-2.5 p-4 flex-1 min-h-0'}>
            <input className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none shrink-0' placeholder='Tìm tên/ID …' value={search} onChange={e => setSearch(e.target.value)} />
            <div className={'overflow-y-auto border border-[#e0e0e0] rounded p-1.5 flex flex-col flex-1 min-h-0'}>
                {filteredStu.map(s => (
                    <label key={s._id} className={'flex gap-2 items-center text-sm cursor-pointer p-2 hover:bg-[#f5f5f5] hover:rounded'}>
                        <input type='checkbox' checked={form.studentIds.includes(s._id)} onChange={() => toggleStudent(s._id)} />
                        <span>{s.ID} – {s.Name}</span>
                    </label>
                ))}
                {filteredStu.length === 0 && (
                    <p className={'text-center p-4 text-[var(--text-secondary)] italic text-sm'}>Không có học sinh</p>
                )}
            </div>
            <button className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5 shrink-0' style={{ width: '100%', marginTop: 12, justifyContent: 'center', borderRadius: 5 }} onClick={() => setShowStu(false)}>Xong</button>
        </div>
    );

    /* ---------- select wrapper ---------- */
    const Select = ({ label, value, menu }) => (
        <div className={'flex flex-col gap-2 mb-3'}>
            <p className='text-sm font-semibold text-[var(--text-primary)]'>{label}</p>
            <Menu buttonContent={value} menuItems={menu} customButton={<div className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' style={{ cursor: 'pointer' }}><span className='text-sm font-normal text-[var(--text-primary)]'>{value || 'Tùy chọn'}</span></div>} />
        </div>
    );

    /* ---------- main popup ---------- */
    const body = (
        <div className={'p-4'}>
            <div className={'flex flex-col gap-2 mb-3'}><p className='text-sm font-semibold text-[var(--text-primary)]'>Ngày học:</p><DateInput className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' value={form.day} onChange={v => setForm({ ...form, day: v })} /></div>
            <div className={'flex flex-col gap-2 mb-3'}><p className='text-sm font-semibold text-[var(--text-primary)]'>Giờ:</p><input className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} onBlur={e => setForm({ ...form, time: normalizeTime(e.target.value) })} /></div>
            <Select label='Chương trình' value={bookMap[form.book]?.Name} menu={bookM} />
            <Select label='Chủ đề' value={topics.find(t => t._id === form.topicId)?.Name} menu={topicM} />
            <Select label='Phòng' value={roomList.find(r => r.id === form.room)?.name} menu={roomM} />
            <Select label='Giáo viên' value={teachers.find(t => t._id === form.teacher)?.name} menu={teachM} />
            <Select label='Trợ giảng' value={teachers.find(t => t._id === form.teachingAs)?.name} menu={asstM} />

            <div className={'flex flex-col gap-2 mb-3'}>
                <div className={'flex justify-between items-center w-full mb-2'}>
                    <p className='text-sm font-semibold text-[var(--text-primary)]'>Học sinh đã chọn ({selectedStudents.length})</p>
                    <button className={'flex items-center gap-1.5 bg-transparent border border-[var(--border-color)] p-[4px_10px] rounded-md cursor-pointer transition-colors duration-200 hover:bg-[var(--hover)]'} onClick={() => { setSearch(''); setShowStu(true); }}>
                        <Svg_Add w={14} h={14} c="var(--main_b)" />
                        <span>Thêm</span>
                    </button>
                </div>
                <div className={'w-full max-h-[120px] overflow-y-auto border border-[var(--border-color)] rounded-md p-1 bg-[var(--bg-secondary)]'}>
                    {selectedStudents.length > 0 ? (
                        selectedStudents.map(s => (
                            <div key={s._id} className={'flex justify-between items-center p-[6px_8px] rounded hover:bg-[var(--hover)]'}>
                                <span className={'text-xs text-[var(--text-primary)]'}>{s.ID} – {s.Name}</span>
                                <WrapIcon
                                    icon={<Svg_Delete w={12} h={12} c="white" />}
                                    click={() => toggleStudent(s._id)}
                                    content="Xóa"
                                    style={{ padding: 8, background: 'var(--red)', borderRadius: 5 }}
                                />
                            </div>
                        ))
                    ) : (
                        <p className={`${'text-center p-4 text-[var(--text-secondary)] italic'} text-sm font-normal text-[var(--text-primary)]`}>Chưa có học sinh nào được chọn.</p>
                    )}
                </div>
            </div>

            <div className={'flex flex-col gap-2 mb-3'}><p className='text-sm font-semibold text-[var(--text-primary)]'>Ghi chú:</p><textarea rows={3} className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></div>
            <button className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ width: '100%', marginTop: 16, borderRadius: 5, justifyContent: 'center' }} onClick={save}>Thêm buổi học thử</button>
        </div>
    );

    return (
        <>
            <div className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ margin: 0, borderRadius: 5 }} onClick={() => setOpen(true)}>
                <Svg_Add w={16} h={16} c='#fff' /><p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: '#fff' }}>Thêm buổi học thử</p>
            </div>
            <FlexiblePopup
                open={open}
                onClose={() => setOpen(false)}
                title='Tạo buổi học thử'
                renderItemList={() => body}
                width={480}
                globalZIndex={1200}
            />

            {showStu && (
                <div className={'fixed inset-0 bg-black/50 flex items-center justify-center z-[1300]'} onMouseDown={() => setShowStu(false)}>
                    <div className={'bg-[var(--bg-primary)] rounded-xl shadow-2xl flex flex-col w-[480px] max-w-[calc(100vw-32px)] h-[70vh]'} onMouseDown={e => e.stopPropagation()}>
                        <div className={'flex justify-between items-center px-4 py-3 h-12 border-b border-[var(--border-color)] shrink-0'}>
                            <h4 className={'font-normal text-[var(--text-primary)]'}>Danh sách học sinh</h4>
                            <button className='bg-transparent border-none text-2xl cursor-pointer text-[var(--text-primary)]' onClick={() => setShowStu(false)}>&times;</button>
                        </div>
                        {stuList}
                    </div>
                </div>
            )}
            {loading && (
                <div className={'fixed inset-0 bg-black/60 flex justify-center items-center z-[9999] backdrop-blur-[4px]'}>
                    <Loading content={<p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Đang thực thi...</p>} />
                </div>
            )}
            <Noti
                open={notification.open}
                status={notification.status}
                mes={notification.mes}
                onClose={() => setNoti(prev => ({ ...prev, open: false }))}
                button={
                    <div className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ width: 'calc(100% - 24px)', justifyContent: 'center' }} onClick={() => setNoti(prev => ({ ...prev, open: false }))}>
                        <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Tắt thông báo</p>
                    </div>
                }
            />
        </>
    )
}