import { book_data } from '@/data/actions/get'
import ProgramClient from './client'

export default async function AcademicProgramPage() {
    let books = await book_data()
    const programs = Array.isArray(books) ? books : []
    return <ProgramClient programs={programs} />
}
