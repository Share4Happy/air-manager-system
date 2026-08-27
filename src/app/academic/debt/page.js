import { student_data } from '@/data/actions/get'
import DebtClient from './client'
import connectDB from '@/config/connectDB'
import Course from '@/models/course'
import Debt from '@/models/debt'
import '@/models/book'
import Session from '@/models/session'
import Attendance from '@/models/attendance'
import checkAuthToken from "@/utils/checktoken"

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DebtPage() {
    const user = await checkAuthToken()
    if (!user || (!user.role?.includes('Admin') && !user.role?.includes('Academic'))) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <h4 style={{ fontStyle: 'italic' }}>Bạn không có quyền truy cập trang này</h4>
            </div>
        )
    }
    const allStudents = await student_data()

    await connectDB()
    const [allCourses, debts, allSessions, allAttendances] = await Promise.all([
        Course.find({})
            .populate({ path: 'Book', select: 'Price Name' })
            .select('ID Book Detail Student.ID')
            .lean(),
        Debt.find({}).sort({ createdAt: -1 }).lean(),
        Session.find({}).select('course day').lean(),
        Attendance.find({ checkin: { $gt: 0 } }).select('course studentId').lean(),
    ]);

    const sessionByCourse = new Map();
    allSessions.forEach(s => {
        const cid = String(s.course);
        if (!sessionByCourse.has(cid)) sessionByCourse.set(cid, []);
        if (s.day) sessionByCourse.get(cid).push(s.day);
    });

    const attendedCountByCourseStudent = new Map();
    allAttendances.forEach(a => {
        const key = `${String(a.course)}_${a.studentId}`;
        attendedCountByCourseStudent.set(key, (attendedCountByCourseStudent.get(key) || 0) + 1);
    });

    const courseMap = {}
    const attendanceMap = {}
    allCourses.forEach(c => {
        const cid = String(c._id)
        const sDays = sessionByCourse.get(cid) || (c.Detail || []).map(d => d.Day).filter(Boolean);
        const sortedDays = sDays.sort((a, b) => new Date(a) - new Date(b));

        courseMap[cid] = {
            name: c.ID,
            price: c.Book && typeof c.Book === 'object' && c.Book.Price ? c.Book.Price : 0,
            startDate: sortedDays.length > 0 ? sortedDays[0] : null,
            endDate: sortedDays.length > 0 ? sortedDays[sortedDays.length - 1] : null,
            totalLessons: sDays.length,
        }
        attendanceMap[cid] = {}
        ;(c.Student || []).forEach(st => {
            const attended = attendedCountByCourseStudent.get(`${cid}_${st.ID}`) ?? (st.Learn || []).filter(l => l.Checkin > 0).length;
            attendanceMap[cid][st.ID] = attended;
        })
    })

    return <DebtClient students={allStudents || []} courseMap={courseMap} attendanceMap={attendanceMap} debts={JSON.parse(JSON.stringify(debts))} />
}
