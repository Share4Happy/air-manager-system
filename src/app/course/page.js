import Navbar from "./template/navbar"
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';
import { area_data, book_data, course_data, coursetry_data, user_data } from "@/data/actions/get";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(process.env.token)?.value;
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  const roles = Array.isArray(decodedToken?.role) ? decodedToken.role : [decodedToken?.role];
  const isTeacherOrAdmin = roles.some(r => /^(admin|academic|teacher)$/i.test(r));
  if (!isTeacherOrAdmin && roles.some(r => /^sale$/i.test(r))) {
    redirect('/academic/course-manager');
  }
  const [courses, books, areas, user, trial] = await Promise.all([course_data(), book_data(), area_data(), user_data({ activeOnly: true }), coursetry_data()])
  return (
    <Navbar data={courses} book={books} areas={areas} user={decodedToken} teacher={user} trys={trial} />
  )
}
