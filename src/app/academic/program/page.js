import { book_data } from '@/data/actions/get'
import ProgramClient from './client'
import checkAuthToken from "@/utils/checktoken"

export default async function AcademicProgramPage() {
    const user = await checkAuthToken()
    if (!user || (!user.role?.includes('Admin') && !user.role?.includes('Academic'))) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <h4 style={{ fontStyle: 'italic' }}>Bạn không có quyền truy cập trang này</h4>
            </div>
        )
    }
    let books = await book_data()
    const programs = Array.isArray(books) ? books : []
    return <ProgramClient programs={programs} />
}
