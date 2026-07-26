import { student_data } from '@/data/actions/get'
import DebtClient from './client'
import connectDB from '@/config/connectDB'
import Course from '@/models/course'
import Debt from '@/models/debt'
import '@/models/book'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DebtPage() {
    const allStudents = await student_data()

    await connectDB()
    const allCourses = await Course.find({})
        .populate({ path: 'Book', select: 'Price Name' })
        .select('ID Book Detail.Day Student.ID Student.Learn.Checkin')
        .lean()

    const debts = await Debt.find({}).sort({ createdAt: -1 }).lean()

    const courseMap = {}
    const attendanceMap = {}
    allCourses.forEach(c => {
        const cid = String(c._id)
        const days = (c.Detail || []).map(d => d.Day).filter(Boolean).sort((a, b) => new Date(a) - new Date(b))
        courseMap[cid] = {
            name: c.ID,
            price: c.Book && typeof c.Book === 'object' && c.Book.Price ? c.Book.Price : 0,
            startDate: days.length > 0 ? days[0] : null,
            endDate: days.length > 0 ? days[days.length - 1] : null,
            totalLessons: (c.Detail || []).length,
        }
        attendanceMap[cid] = {}
        ;(c.Student || []).forEach(st => {
            const attended = (st.Learn || []).filter(l => l.Checkin > 0).length
            attendanceMap[cid][st.ID] = attended
        })
    })

    return <DebtClient students={allStudents || []} courseMap={courseMap} attendanceMap={attendanceMap} debts={JSON.parse(JSON.stringify(debts))} />
}
