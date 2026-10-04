import Link from "next/link"
import Dot from "./dot"
import { formatDate } from "@/function";

export default function Timeline({ data = {}, props, selectedLessonId }) {
    const details = Array.isArray(data?.Detail) ? [...data.Detail] : [];
    details.sort((a, b) => {
        const dateA = new Date(a?.Day || 0);
        const dateB = new Date(b?.Day || 0);
        return dateA - dateB;
    });

    const allDates = details.map(item => item?.Day ? new Date(item.Day) : null).filter(Boolean);
    let dateRange = ['Chưa có dữ liệu', 'Chưa có dữ liệu'];
    if (allDates.length > 0) {
        dateRange = [formatDate(new Date(Math.min(...allDates))), formatDate(new Date(Math.max(...allDates)))];
    }

    const courseCode = data?.ID || data?._id || '';

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%', flex: 1.6, minHeight: 0 }}>

            <div style={{
                borderRadius: '8px', padding: 16, background: 'linear-gradient(90deg, rgba(32,97,165,1) 0%, rgba(18,57,98,1) 100%)',
                boxShadow: 'var(--boxshaw)', overflow: 'hidden',
            }}><Link href={`/course/${courseCode}`}>
                    <div className="text-base font-medium text-[var(--text-primary)]" style={{ color: 'white', fontWeight: '500' }}>{data?.Type || ''}</div>
                    <div className="text-xl font-semibold text-[var(--text-primary)]" style={{ margin: '4px 0', color: 'white' }}>Lớp: {data?.ID || courseCode}</div>
                    <div className="text-base font-medium text-[var(--text-primary)]" style={{ color: 'white' }}>Từ {dateRange[0]} đến {dateRange[1]}</div>
                </Link>
            </div>


            <div style={{ flex: 1, overflowX: 'hidden', overflowY: 'auto', minHeight: 0, maxHeight: '100%' }}>
                {details.map((e, i) => {
                    let datalesson = { ...e }
                    datalesson.Student = (data?.Student || []).map((s) => {
                        const learnItem = (s.Learn || []).find(t => String(t.Lesson) === String(e._id))
                        return {
                            studentId: s.ID,
                            studentName: s.Name,
                            Checkin: learnItem ? Number(learnItem.Checkin) : 0,
                            Cmt: learnItem?.Cmt || [],
                            CmtFn: learnItem?.CmtFn || '',
                            Image: learnItem?.Image || [],
                            absenceReason: learnItem?.absenceReason || ''
                        }
                    })
                    return (
                        i == details.length - 1 ?
                            <Dot key={e._id || i} props={props} selectedLessonId={selectedLessonId} course={courseCode} type="end" index={i} data={datalesson} /> :
                            i == 0 ? <Dot key={e._id || i} props={props} selectedLessonId={selectedLessonId} course={courseCode} type="center" index={i} data={datalesson} /> :
                                <Dot key={e._id || i} props={props} selectedLessonId={selectedLessonId} course={courseCode} type="main" index={i} data={datalesson} />
                    )
                })}
            </div>
        </div>
    )
}

