import { Data_coursetry } from "@/data/course";
import Link from "next/link";
import CourseTryPages from "./main";
import CourseTryFilter from "./filter";
import { area_data, book_data, student_data, user_data } from "@/data/actions/get";

export default async function CourseTryPage() {
    let [data, book, student, teacher, area] = await Promise.all([
        Data_coursetry(),
        book_data(),
        student_data(),
        user_data({ activeOnly: true }),
        area_data(),
    ]);

    if (data?.sessions && Array.isArray(data.sessions)) {
        data.sessions.sort((a, b) => new Date(b.day) - new Date(a.day));
    }

    const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = sessions.filter(s => s.day && new Date(s.day) >= today).length;
    const totalStudents = sessions.reduce((acc, s) => acc + (Array.isArray(s.students) ? s.students.length : 0), 0);

    return (
        <div className={'flex flex-col lg:flex-row h-full w-full gap-3 lg:gap-5'}>
            <div className={'flex flex-col w-full lg:w-[400px] lg:flex-none h-full min-w-0 min-h-0 overflow-hidden'}>
                <div style={{
                    borderRadius: '12px',
                    padding: '18px 20px',
                    background: 'linear-gradient(90deg, var(--yellow) 0%, rgb(249, 174, 0) 100%)',
                    boxShadow: 'var(--boxshaw)', overflow: 'hidden',
                    marginBottom: 12,
                }}>
                    <Link href={`/course/trycourse`}>
                        <div className="text-base font-medium text-[var(--text-primary)]" style={{ color: 'white', fontWeight: '500' }}>AI Robotic</div>
                        <div className="text-xl font-semibold text-[var(--text-primary)]" style={{ margin: '4px 0', color: 'white' }}>Lớp: HỌC THỬ</div>
                        <div className="text-base font-medium text-[var(--text-primary)]" style={{ color: 'white' }}>Học thử miễn phí AI Robotic</div>
                        <div className={'flex gap-2 mt-3'}>
                            <span className={'p-[6px_12px] rounded-lg text-xs font-semibold flex items-center'} style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}>Buổi học: {sessions.length}</span>
                            <span className={'p-[6px_12px] rounded-lg text-xs font-semibold flex items-center'} style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}>Sắp tới: {upcoming}</span>
                            <span className={'p-[6px_12px] rounded-lg text-xs font-semibold flex items-center'} style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}>HS thử: {totalStudents}</span>
                        </div>
                    </Link>
                </div>
                <CourseTryFilter data={data} book={book} student={student} teacher={teacher} area={area} />
            </div>
            <div className={'flex-1 min-w-0 h-full'}>
                <CourseTryPages data={data} book={book} student={student} teacher={teacher} area={area} />
            </div>
        </div>
    );
}