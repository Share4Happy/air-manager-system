import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import PostCourse from '@/models/course'
import User from '@/models/users'
import Area from '@/models/area'
import Book from '@/models/book'

export async function GET() {
    try {
        await connectDB()

        const [teachers, areas, courses, books] = await Promise.all([
            User.find({ status: true }, '_id name code role').lean(),
            Area.find({}, '_id name rooms').lean(),
            PostCourse.find({}, '_id ID Name Status TeacherHR Area').sort({ createdAt: -1 }).limit(200).lean(),
            Book.find({}, '_id Name Topics').lean()
        ])

        // Trích xuất danh sách phòng học từ các khu vực (Area)
        const rooms = []
        areas.forEach(area => {
            (area.rooms || []).forEach(r => {
                rooms.push({
                    _id: r._id ? r._id.toString() : r.name,
                    name: r.name,
                    fullName: `${r.name} (${area.name})`,
                    areaId: area._id,
                    areaName: area.name
                })
            })
        })

        return NextResponse.json({
            teachers: teachers || [],
            rooms: rooms || [],
            courses: courses || [],
            books: books || []
        })
    } catch (err) {
        console.error('Fetch makeup options error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
