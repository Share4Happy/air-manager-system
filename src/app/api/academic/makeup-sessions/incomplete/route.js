import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import PostCourse from '@/models/course'
import PostStudent from '@/models/student'

export async function GET(req) {
    try {
        await connectDB()

        const { searchParams } = new URL(req.url)
        const q = searchParams.get('q')

        const filter = { Status: true }
        if (q) {
            filter.$or = [
                { ID: { $regex: q, $options: 'i' } },
                { 'Book.Name': { $regex: q, $options: 'i' } },
            ]
        }

        const courses = await PostCourse.find(filter)
            .populate('Book', 'Name')
            .select('ID Book Detail Student')
            .limit(50)
            .lean()

        const allStudentIds = new Set()
        courses.forEach(c => (c.Student || []).forEach(s => allStudentIds.add(s.ID)))
        const students = await PostStudent.find({ ID: { $in: [...allStudentIds] } }, 'ID Name').lean()
        const studentMap = new Map(students.map(s => [s.ID, s.Name]))

        const result = []
        for (const course of courses) {
            const detailIds = course.Detail.map(d => d._id.toString())
            const totalLessons = detailIds.length
            if (totalLessons === 0) continue

            const courseStudents = []
            for (const student of (course.Student || [])) {
                const attendedMap = new Set(
                    student.Learn.filter(l => l.Checkin > 0).map(l => l.Lesson?.toString()).filter(Boolean)
                )
                const missingDetail = course.Detail.filter(d => !attendedMap.has(d._id.toString()))

                if (missingDetail.length > 0) {
                    courseStudents.push({
                        studentId: student.ID,
                        studentName: studentMap.get(student.ID) || 'N/A',
                        attendedLessons: attendedMap.size,
                        totalLessons,
                        missingLessons: missingDetail.length,
                        missingDetail: missingDetail.map(d => ({
                            lessonId: d._id,
                            Day: d.Day,
                            Time: d.Time,
                            Topic: d.Topic,
                        })),
                    })
                }
            }

            if (courseStudents.length > 0) {
                result.push({
                    course: { _id: course._id, ID: course.ID, Name: course.Book?.Name || course.ID },
                    totalLessons,
                    students: courseStudents,
                })
            }
        }

        return NextResponse.json({ items: result })
    } catch (err) {
        console.error('Incomplete courses error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
