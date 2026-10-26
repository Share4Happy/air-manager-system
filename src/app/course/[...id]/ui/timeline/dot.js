import Link from 'next/link';
import { formatDate } from '@/function';

const getEventStatus = (data) => {
    if (data.Type === 'Báo nghỉ') {
        return { text: 'Báo nghỉ', color: 'var(--red)' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(data.Day);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate < today) {
        return { text: 'Đã diễn ra', color: 'var(--green)' };
    } else if (eventDate.getTime() === today.getTime()) {
        return { text: 'Đang diễn ra', color: 'var(--main_d)' };
    } else {
        return { text: 'Chưa diễn ra', color: '#64748b' };
    }
};

const statusLesson2 = (data) => {
    if (data.Type === 'Học bù') { return { text: 'Học bù', color: 'var(--yellow)' }; }
    if (data.Type === 'Báo nghỉ') { return { text: 'Báo nghỉ', color: 'var(--red)' }; }
    return null;
}



export default function TimeLine_Dot({ course, type, index, data, props, selectedLessonId, onSelectLesson }) {
    let statusLesson = [1, 1, 1];
    let numCheckedIn = 0;
    const students = data?.Student || [];

    if (students.length === 0) {
        statusLesson = [0, 0, 0];
    } else {
        students.forEach(element => {
            const checkinVal = Number(element.Checkin);
            if (!checkinVal || checkinVal === 0) {
                statusLesson[0] = 0;
            }
            if (checkinVal === 1) {
                numCheckedIn++;
                if (!element.Cmt || element.Cmt.length === 0) {
                    statusLesson[1] = 0;
                }
                if (!element.Image || element.Image.length === 0) {
                    statusLesson[2] = 0;
                }
            }
        });

        if (numCheckedIn === 0) {
            const allAbsentChecked = students.length > 0 && students.every(s => Number(s.Checkin) === 2 || Number(s.Checkin) === 3);
            if (allAbsentChecked) {
                statusLesson[0] = 1;
                statusLesson[1] = 1;
                statusLesson[2] = 1;
            } else {
                statusLesson[1] = 0;
                statusLesson[2] = 0;
            }
        }
    }

    const lessonPropId = Array.isArray(props) ? (props[1] || '') : (props || '');
    let id = data._id;
    const isSelected = selectedLessonId ? String(selectedLessonId) === String(id) : (lessonPropId === String(id));

    const status = getEventStatus(data);
    const status2 = statusLesson2(data);

    const handleClick = (e) => {
        if (onSelectLesson) {
            e.preventDefault();
            onSelectLesson(data._id, index + 1);
        }
    };

    const content = (
        <div
            data-timeline-dot="true"
            onClick={handleClick}
            className={`w-full p-2.5 my-1 rounded-lg cursor-pointer transition-all duration-150 ${isSelected ? 'bg-sky-50 shadow-sm border border-sky-200' : 'hover:bg-slate-100/80 border border-transparent'}`}
            style={{ position: 'relative' }}
        >
            <div style={{ display: 'flex', position: 'relative', width: '100%' }}>
                {type == 'end' ? null : type == 'main' ?
                    <div className="pointer-events-none" style={{ position: 'absolute', left: 18.5, top: '50%', height: '100%', width: '3px', backgroundColor: '#1f5fa2', zIndex: 0 }}></div> :
                    <div className="pointer-events-none" style={{ position: 'absolute', left: 18.5, top: '0', height: '200%', width: '3px', backgroundColor: '#1f5fa2', zIndex: 0 }}></div>}
                <div style={{ display: 'flex', width: '100%', gap: 16, zIndex: 1, alignItems: 'flex-start' }}>

                    <div className={`w-10 h-10 rounded-full text-white z-[1] shrink-0 flex items-center justify-center font-semibold transition-all duration-150 ${isSelected ? 'bg-[var(--main_d)] ring-2 ring-white shadow-md scale-105' : 'bg-[#1f5fa2]'}`} >{index + 1}</div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                            <p className="Chip text-xs font-normal text-[var(--text-primary)]" style={{ background: status.color, color: 'white', padding: '2px 8px', borderRadius: 12, width: 'max-content' }}>
                                {status.text}
                            </p>
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: statusLesson[0] == 1 ? 'var(--green)' : 'var(--red)' }} title={statusLesson[0] == 1 ? 'Đã điểm danh' : 'Chưa điểm danh'}></span>
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: statusLesson[1] == 1 ? 'var(--green)' : 'var(--red)' }} title={statusLesson[1] == 1 ? 'Đã nhận xét' : 'Chưa nhận xét'}></span>
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: statusLesson[2] == 1 ? 'var(--green)' : 'var(--red)' }} title={statusLesson[2] == 1 ? 'Đã có minh chứng' : 'Chưa có minh chứng'}></span>
                        </div>
                        <p className={`text-sm sm:text-base font-semibold truncate ${isSelected ? 'text-[var(--main_d)]' : 'text-[var(--text-primary)]'}`}>
                            {data?.LessonDetails?.Name || 'Không có tên chủ đề'}
                            {status2 && <span className='text-xs sm:text-sm font-semibold' style={{ marginLeft: 5, color: status2.color }}>({status2.text})</span>}
                        </p>
                        <div className='text-xs sm:text-sm font-normal text-[var(--text-secondary)]'>Ngày {formatDate(new Date(data.Day))}</div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (!onSelectLesson) {
        return (
            <Link href={`/course/${course}?lesson=${index + 1}`} style={{ textDecoration: 'none', display: 'block' }}>
                {content}
            </Link>
        );
    }

    return content;
}
