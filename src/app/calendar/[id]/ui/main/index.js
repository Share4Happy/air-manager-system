'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Re_lesson } from '@/data/course';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import CommentForm from '../formcmt';
import BoxFile from '@/components/(ui)/(box)/file';
import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';
import Image from 'next/image';
import ImageUploader from '../formimage';
import StudentCourseImageManager from '../formimages';
import CheckinPopup from '../checkin';
import { Svg_Detail, Svg_Pen } from '@/components/(icon)/svg';
import Link from 'next/link';
import { driveThumbnailUrl, driveFolderUrl } from '@/function';

const updateAttendance = async (courseId, sessionId, attendanceData) => {
    const r = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, sessionId, attendanceData })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
};

export default function Main({ data }) {
    const { course, session, students } = data || {};
    const [att, setAtt] = useState({});
    const [cmts, setCmts] = useState({});
    const [saving, setSaving] = useState(false);
    const [reloading, setReloading] = useState(false);
    const [notiOpen, setNotiOpen] = useState(false);
    const [notiOK, setNotiOK] = useState(false);
    const [notiMsg, setNotiMsg] = useState('');
    const [showImagePopup, setShowImagePopup] = useState(false);
    const [popupImageUrl, setPopupImageUrl] = useState('');
    const [showComment, setShowComment] = useState(false);
    const [selStu, setSelStu] = useState(null);
    const [showNote, setShowNote] = useState(false);
    const [note, setNote] = useState(() => session?.Note || '');
    const [mobileDocsOpen, setMobileDocsOpen] = useState(true);
    const [savingNote, setSavingNote] = useState(false);
    const [showCheckin, setShowCheckin] = useState(false);
    const router = useRouter();

    if (!course || !session) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">Không tìm thấy buổi học</p>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">ID buổi học không hợp lệ hoặc đã bị xóa.</p>
                    <button onClick={() => window.history.back()}
                        className="px-4 py-2 bg-[var(--main_d)] text-white text-sm font-medium rounded hover:opacity-90 cursor-pointer border-none">
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const isTrialCourse = course?.type === 'trial' || false;

    const checkinInfo = session?.Checkin || session?.checkin || null;
    const alreadyChecked = !!checkinInfo?.id;

    const roll = (students || []).map(stu => ({
        ID: stu.ID,
        Name: stu.Name,
        Image: stu.attendance?.Image ?? [],
        Checkin: String(stu.attendance?.Checkin ?? ''),
        originalComment: stu.attendance?.Cmt ?? [],
        Avt: stu.Avt ? driveThumbnailUrl(stu.Avt, 200) : driveThumbnailUrl('1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG', 200)
    }));

    const cur = s => (att[s.ID] !== undefined ? att[s.ID] : s.Checkin);

    const cm = roll.filter(s => cur(s) === '1').length;
    const vk = roll.filter(s => cur(s) === '2').length;
    const vc = isTrialCourse ? 0 : roll.filter(s => cur(s) === '3').length;

    const changeAtt = (id, v) => setAtt(prev => ({ ...prev, [id]: v }));

    const saveComment = async (arr) => {
        if (!selStu) return;
        setCmts(p => ({ ...p, [selStu.ID]: arr }));
        setShowComment(false);
        const checkinVal = cur(selStu);
        setSaving(true);
        try {
            const res = await updateAttendance(course._id, session._id, [{ studentId: selStu.ID, checkin: checkinVal, comment: arr }]);
            if (res.status === 2) {
                setNotiOK(true); setNotiMsg('Lưu nhận xét thành công!');
            } else {
                setCmts(p => { const n = { ...p }; delete n[selStu.ID]; return n; });
                setNotiOK(false); setNotiMsg(res.mes || 'Lưu nhận xét thất bại!');
            }
        } catch {
            setCmts(p => { const n = { ...p }; delete n[selStu.ID]; return n; });
            setNotiOK(false); setNotiMsg('Có lỗi xảy ra khi lưu nhận xét!');
        } finally {
            setSaving(false); setNotiOpen(true);
            setSelStu(null);
        }
    };

    const buildPayload = () => {
        const arr = [];
        Object.keys(att).forEach(id =>
            arr.push({ studentId: id, checkin: att[id], comment: cmts[id] })
        );
        Object.keys(cmts).forEach(id => {
            if (!arr.find(i => i.studentId === id)) {
                const stu = roll.find(s => s.ID === id);
                if (stu) arr.push({ studentId: id, checkin: stu.Checkin, comment: cmts[id] });
            }
        });
        return arr;
    };

    const reloadData = async () => {
        setAtt({});
        setCmts({});
        setReloading(true);
        try {
            await Re_lesson(data.session._id);
            router.refresh();
        } catch (e) {
            console.error('Reload error:', e);
        } finally {
            setReloading(false);
        }
    }

    const handleImageUploadSuccess = () => {
        router.refresh();
    }

    const saveNote = async () => {
        setSavingNote(true);
        try {
            if (isTrialCourse) {
                const res = await fetch('/api/coursetry', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: session._id,
                        note: note
                    })
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.mes || 'Lưu thất bại');
            } else {
                const res = await fetch('/api/course/ucalendarcourse', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        courseId: course._id,
                        detailId: session._id,
                        data: { Note: note }
                    })
                });
                const json = await res.json();
                if (json.status !== 2) throw new Error(json.mes || 'Lưu thất bại');
            }
            setNotiOK(true); setNotiMsg('Lưu ghi chú thành công!'); setNotiOpen(true);
            setShowNote(false);
            await Re_lesson(session._id);
            router.refresh();
        } catch (err) {
            setNotiOK(false); setNotiMsg(err.message); setNotiOpen(true);
        } finally {
            setSavingNote(false);
        }
    }

    const saveAll = async () => {
        const payload = buildPayload();
        if (!payload.length) {
            setNotiOK(false); setNotiMsg('Không có gì thay đổi'); setNotiOpen(true);
            setSaving(false);
            return;
        }

        setSaving(true);
        try {
            const res = await updateAttendance(course._id, session._id, payload);
            if (res.status === 2) {
                setNotiOK(true); setNotiMsg('Lưu thành công!'); setNotiOpen(true);
                await Re_lesson(session._id);
                router.refresh();
            } else {
                setNotiOK(false); setNotiMsg(res.mes || 'Lưu thất bại!'); setNotiOpen(true);
            }
        } catch {
            setNotiOK(false); setNotiMsg('Có lỗi xảy ra khi gọi API!'); setNotiOpen(true);
        } finally {
            setSaving(false);
        }
    };

    const notiBtn = (
        <button onClick={() => setNotiOpen(false)}
            className="px-3 py-2.5 border-none rounded bg-[var(--main_d)] text-white font-medium cursor-pointer transition-opacity w-full">
            Tắt thông báo
        </button>
    );

    const handleImageClick = (imageUrl) => {
        setPopupImageUrl(imageUrl);
        setShowImagePopup(true);
    };

    const headers = isTrialCourse
        ? ['ID', 'Học sinh', 'Có mặt', 'Vắng mặt', 'Nhận xét']
        : ['ID', 'Học sinh', 'Có mặt', 'Vắng mặt', 'Có phép', 'Nhận xét'];

    const colFlex = (t) => {
        if (t === 'Học sinh') return 3;
        if (t === 'Có mặt' || t === 'Vắng mặt') return isTrialCourse ? 1.5 : 1;
        return 1;
    };

    const attendanceOptions = isTrialCourse ? ['1', '2'] : ['1', '2', '3'];

    return (
        <>
            {(saving || reloading) && (
                <div className="fixed bg-black/35 flex justify-center items-center w-full h-full top-0 left-0 z-[1200]">
                    <Loading content={saving ? 'Đang lưu điểm danh…' : 'Đang tải lại…'} />
                </div>
            )}

            <Noti open={notiOpen} onClose={() => setNotiOpen(false)}
                status={notiOK} mes={notiMsg} button={notiBtn} />

            {showImagePopup && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1050] cursor-pointer p-4" onClick={() => setShowImagePopup(false)}>
                    <div className="relative w-full max-w-[85vw] sm:max-w-[50vh] aspect-square bg-white overflow-hidden rounded-lg" onClick={e => e.stopPropagation()}>
                        <Image src={popupImageUrl} alt="Student Avatar Popup" fill sizes="(max-width: 640px) 85vw, 50vh" style={{ objectFit: 'contain' }} />
                    </div>
                </div>
            )}

            <div className="flex flex-col w-full overflow-hidden rounded-lg h-[calc(100%-2px)] bg-[var(--bg-primary)] border border-[var(--border-color)]">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 md:px-6 py-3 border-b border-[var(--border-color)] gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <p className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">{course.ID ?? '-'} – Chủ đề: {session.Topic.Name ?? '-'}</p>
                        <Link href={`/course/${course._id}`} className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100 self-start sm:self-auto' >
                            <Svg_Detail w={16} h={16} c={'var(--main_d)'} />
                            <h5>Chi tiết khóa học</h5>
                        </Link>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <h5 className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded border-2 border-[#43a300] bg-[#e6f4e6] text-[#1f4d1f] text-sm sm:text-base`}>Có mặt: {cm}</h5>
                        <h5 className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded border-2 border-[#cc1d1d] bg-[#fdecea] text-[#5a1a1a] text-sm sm:text-base`}>Vắng mặt: {vk + (isTrialCourse ? vc : 0)}</h5>
                        {!isTrialCourse && (
                            <h5 className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded border-2 border-[#d6a800] bg-[#fff8e1] text-[#665900] text-sm sm:text-base`}>Vắng có phép: {vc}</h5>
                        )}
                    </div>
                </header>

                {/* Mobile: Documents section */}
                <div className="md:hidden border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
                    <div className="flex items-center justify-between px-4 py-3 cursor-pointer select-none" onClick={() => setMobileDocsOpen(o => !o)}>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">Tài liệu buổi học</p>
                        <svg className={`w-4 h-4 transition-transform ${mobileDocsOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>
                    </div>
                    {mobileDocsOpen && (
                        <div className="px-4 pb-3 flex flex-row gap-3">
                            <div className="flex-1 min-w-0">
                                {course.Version === 0 ? (<BoxFile type="Image" name="Hình ảnh buổi học" href={driveFolderUrl(session.Image)} />) : <ImageUploader session={session} courseId={course.ID} onUploadSuccess={handleImageUploadSuccess} />}
                            </div>
                            {session.Topic?.Slide && (
                                <div className="flex-1 min-w-0">
                                    <BoxFile type="Ppt" name="Slide giảng dạy" href={session.Topic.Slide} />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
                    {/* Desktop: Sidebar */}
                    <aside className="hidden md:flex w-[240px] p-6 bg-[var(--bg-primary)] border-r border-[var(--border-color)] overflow-y-auto flex-col gap-4 shrink-0">
                        <p className="text-base font-semibold text-[var(--text-primary)]">Tài liệu buổi học</p>
                        {course.Version === 0 ? (<BoxFile type="Image" name="Hình ảnh buổi học" href={driveFolderUrl(session.Image)} />) : <ImageUploader session={session} courseId={course.ID} onUploadSuccess={handleImageUploadSuccess} />}
                        {session.Topic?.Slide && <BoxFile type="Ppt" name="Slide giảng dạy" href={session.Topic.Slide} />}
                    </aside>

                    <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                        <p className="text-base font-semibold text-[var(--text-primary)] mb-4">Thông tin buổi học</p>
                        <section className="bg-[var(--bg-primary)] rounded border border-[var(--border-color)] p-3 md:p-4">
                            <div className="flex flex-wrap gap-2 md:gap-4 bg-[var(--main_d)] text-white p-2 md:p-2.5 rounded">
                                <h5 className="text-xs md:text-sm" style={{ color: 'white' }}>Thời gian: <span className="font-normal">{session.Time}</span></h5>
                                <h5 className="text-xs md:text-sm" style={{ color: 'white' }}>Giáo viên: <span className="font-normal">{session.Teacher.name}</span></h5>
                                <h5 className="text-xs md:text-sm" style={{ color: 'white' }}>Trợ giảng: <span className="font-normal">{session.TeachingAs?.name || '–'}</span></h5>
                                <h5 className="text-xs md:text-sm" style={{ color: 'white' }}>Phòng học: <span className="font-normal">{session.Room || '–'}</span></h5>
                            </div>
                            <div className="h-px bg-[#e0e0e0] my-3" />
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                <p className="text-base font-semibold text-[var(--text-primary)]">Sổ điểm danh</p>
                                <div className="flex flex-wrap gap-2 self-stretch sm:self-auto">
                                    <button onClick={() => setShowCheckin(true)} className="text-sm text-white w-full sm:w-auto sm:flex-none" style={{ padding: '8px 16px', background: alreadyChecked ? 'var(--green)' : 'var(--yellow)', border: 'none', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        {alreadyChecked ? (
                                            <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/></svg>
                                        )}
                                        {alreadyChecked ? 'Đã checkin' : 'Checkin'}
                                    </button>
                                    <button onClick={reloadData} disabled={reloading} className="text-sm text-white flex-1 sm:flex-none" style={{ padding: '8px 16px', background: reloading ? 'var(--text-secondary)' : 'var(--green)', border: 'none', borderRadius: 5, cursor: reloading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        {reloading && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                        {reloading ? 'Đang tải lại…' : 'Tải lại dữ liệu '}
                                    </button>
                                    <button onClick={saveAll} disabled={saving} className="text-sm text-white flex-1 sm:flex-none" style={{ padding: '8px 16px', background: saving ? 'var(--text-secondary)' : 'var(--green)', border: 'none', borderRadius: 5, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        {saving && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                        {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
                                    </button>
                                    <button onClick={() => setShowNote(true)} className="text-sm text-white w-full sm:w-auto sm:flex-none" style={{ padding: '8px 16px', background: 'var(--main_d)', border: 'none', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <Svg_Pen w={16} h={16} c="white" />
                                        Ghi chú
                                    </button>
                                </div>
                            </div>
                            {roll.length ? (
                                <div className="overflow-x-auto">
                                    <div className="min-w-[600px] md:min-w-0">
                                        <div className="flex items-center transition-colors duration-200 bg-[var(--main_d)] rounded text-white mt-2 border-b border-[var(--border-color)]">
                                            {headers.map(t => (
                                                <div key={t} className="text-sm font-normal text-white px-2 py-2" style={{ flex: colFlex(t), textAlign: t === 'ID' || t === 'Học sinh' ? 'left' : 'center' }}>
                                                    {t}
                                                </div>
                                            ))}
                                            {course.Version !== 0 && <div className="text-sm font-normal text-white px-2 py-2 text-center" style={{ flex: 1 }}>Hình ảnh</div>}
                                        </div>
                                        {roll.map(stu => {
                                            if (stu.Checkin === '-1') return null;

                                            const currentCheckinValue = cur(stu);
                                            let displayValue = currentCheckinValue;
                                            if (isTrialCourse) {
                                                displayValue = (currentCheckinValue === '1') ? '1' : '2';
                                            }

                                            return (
                                                <div key={stu.ID} className="flex items-center transition-colors duration-200 hover:bg-[var(--hover)]" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                                                    <div className="text-xs md:text-sm text-[var(--text-primary)] font-medium px-2 py-2.5 md:py-3" style={{ flex: colFlex('ID') }}>{stu.ID}</div>
                                                    <div className="text-xs md:text-sm text-[var(--text-primary)] font-medium px-2 flex items-center gap-1.5 min-w-0" style={{ flex: colFlex('Học sinh') }}>
                                                        <div className="w-7 h-7 md:w-9 md:h-9 relative shrink-0 overflow-hidden cursor-pointer rounded" onClick={() => handleImageClick(stu.Avt)}>
                                                            <Image fill sizes="36px" className="object-cover" src={stu.Avt} alt={stu.Name} />
                                                        </div>
                                                        <span className="truncate">{stu.Name}</span>
                                                    </div>
                                                    {attendanceOptions.map(v => {
                                                        return (
                                                            <div key={v} className="flex items-center justify-center px-2 py-2.5 md:py-3" style={{ flex: isTrialCourse && (v === '1' || v === '2') ? 1.5 : 1 }}>
                                                                <label className="flex items-center justify-center cursor-pointer">
                                                                    <input type="radio" name={`att_${stu.ID}`} value={v}
                                                                        checked={displayValue === v}
                                                                        onChange={() => changeAtt(stu.ID, v)}
                                                                        className="cursor-pointer" />
                                                                </label>
                                                            </div>
                                                        );
                                                    })}
                                                    <button onClick={() => { setSelStu(stu); setShowComment(true); }} className="flex items-center justify-center bg-transparent border-none cursor-pointer px-2 py-2.5 md:py-3" style={{ flex: colFlex('Nhận xét') }}>
                                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--text-primary)"><path d="M14 11c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1s.45-1 1-1h9c.55 0 1-.45 1-1M3 7c0 .55.45 1 1 1h9c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1m7 8c0-.55-.45 1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1h5c.55 0 1-.45 1-1m8.01-2.13.71-.71c.39-.39 1.02-.39 1.41 0l.71.71c.39.39.39 1.02 0 1.41l-.71.71zm-.71.71-5.16 5.16c-.09.09-.14.21-.14.35v1.41c0 .28.22.5.5.5h1.41c.13 0 .26-.05.35-.15l5.16-5.16z" /></svg>
                                                    </button>
                                                    {course.Version !== 0 && (
                                                        <div className="flex items-center justify-center px-2" style={{ flex: 1 }}>
                                                            <StudentCourseImageManager courseInfo={data.session} studentInfo={stu} course={data.course} />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 text-center text-[#777]"><p>Không có học sinh tham gia khóa học</p></div>
                            )}
                        </section>
                    </main>
                </div>
            </div>

            <CenterPopup open={showComment} onClose={() => setShowComment(false)} size="lg">
                <CommentForm
                    student={selStu}
                    initialComment={selStu ? cmts[selStu.ID] || selStu.originalComment : []}
                    onSave={saveComment}
                    onCancel={() => setShowComment(false)}
                />
            </CenterPopup>

            <CenterPopup open={showNote} onClose={() => setShowNote(false)} size="md">
                <div className="flex flex-col gap-4 p-4 w-full sm:min-w-[400px]">
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">Ghi chú buổi học</h3>
                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 bg-white text-sm outline-none text-gray-700 resize-none"
                        style={{ minHeight: 150, resize: 'vertical' }}
                        placeholder="Nhập ghi chú cho buổi học này..."
                    />
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setShowNote(false)}
                            className="px-4 py-2 bg-gray-200 text-sm cursor-pointer border-none rounded">
                            Đóng
                        </button>
                        <button onClick={saveNote} disabled={savingNote}
                            className="px-4 py-2 bg-[var(--main_b)] text-white text-sm cursor-pointer border-none rounded hover:bg-[var(--main_d)] disabled:opacity-50">
                            {savingNote ? 'Đang lưu...' : 'Lưu ghi chú'}
                        </button>
                    </div>
                </div>
            </CenterPopup>

            <CenterPopup open={showCheckin} onClose={() => setShowCheckin(false)} size="md">
                <CheckinPopup
                    sessionId={session._id}
                    buoi={session.buoi}
                    day={session.Day}
                    startTime={session.Time}
                    checkin={checkinInfo}
                    onClose={() => setShowCheckin(false)}
                    onDone={async (status) => {
                        try { await Re_lesson(session._id); } catch { }
                        router.refresh();
                        setShowCheckin(false);
                        setNotiOK(true);
                        setNotiMsg(status === 'tre' ? 'Checkin thành công (Trễ).' : 'Checkin thành công (Đúng giờ).');
                        setNotiOpen(true);
                    }}
                />
            </CenterPopup>
        </>
    );
}
