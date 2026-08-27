import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import PostBook from '@/models/book';
import PostArea from '@/models/area';
import Postuser from '@/models/users';
import User from '@/models/users';
import PostStudent from '@/models/student';
import { NextResponse } from 'next/server';
import authenticate from '@/utils/authenticate';
import { reloadCourse, reloadStudent } from '@/data/actions/reload';
import { course_data } from '@/data/actions/get';
import { clearCacheByTag } from '@/lib/cache';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

export async function POST(request, { params }) {
    try {
        const id = (await params).id;
        const body = await request.json();
        const { students } = body;

        if (!id || !Array.isArray(students)) {
            return NextResponse.json({ mes: 'Thiếu thông tin' }, { status: 400 });
        }

        await connectDB();
        const course = await PostCourse.findOne({ _id: id });
        if (!course) {
            return NextResponse.json({ mes: 'Không tìm thấy khóa học' }, { status: 404 });
        }

        const user = await authenticate(request);
        const isAdminOrAcademic = user?.role?.includes('Admin') || user?.role?.includes('Academic');
        if (!isAdminOrAcademic) {
            return NextResponse.json({ mes: 'Bạn không có quyền thực hiện hành động này' }, { status: 403 });
        }

        course.Student = students;
        await course.save();

        reloadCourse(id);

        return NextResponse.json({ status: 2, mes: 'Thành công' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ mes: 'Lỗi: ' + error.message }, { status: 500 });
    }
}

// Xác nhận hoàn thành khóa học
export async function PATCH(request, { params }) {
    const { id } = await params;
    if (!id) return NextResponse.json({ status: 1, mes: 'Thiếu ID của khóa học.' }, { status: 400 });

    try {
        const { user, body } = await authenticate(request);
        if (Object.keys(body).length === 0) return NextResponse.json({ status: 1, mes: 'Không có dữ liệu để cập nhật.' }, { status: 400 });

        await connectDB();
        const course = await course_data(id);
        if (!course) return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học.' }, { status: 404 });

        const teacherHRId = course.TeacherHR?._id ? String(course.TeacherHR._id) : (course.TeacherHR ? String(course.TeacherHR) : '');
        const isTeacherHR = teacherHRId === String(user.id);
        const isAdminOrAcademic = user.role?.some(r => /^(admin|academic)$/i.test(r));
        if (!isAdminOrAcademic && !isTeacherHR) return NextResponse.json({ status: 1, mes: 'Bạn không có quyền thực hiện hành động này.' }, { status: 403 });

        delete body.ID;
        const filterQuery = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { ID: id };
        const updatedCourse = await PostCourse.findOneAndUpdate(filterQuery, { $set: body }, { new: true }).populate('Book', 'ID Name').lean();
        if (!updatedCourse) return NextResponse.json({ status: 1, mes: 'Cập nhật khóa học thất bại.' }, { status: 404 });

        if (body.Status === true) {
            const studentIDsInCourse = (updatedCourse.Student || []).map(s => s.ID).filter(Boolean);
            if (studentIDsInCourse.length > 0) {
                const students = await PostStudent.find({ ID: { $in: studentIDsInCourse } }).select('_id ID Course Profile');
                const bulkOperations = [];

                const bookId = updatedCourse.Book?.ID || updatedCourse.Book?._id?.toString() || updatedCourse.Book?.toString() || 'CHUA_XAC_DINH';
                const bookName = updatedCourse.Book?.Name || 'Chương trình học';

                for (const student of students) {
                    await reloadStudent(student._id);
                    if (!student.Profile || typeof student.Profile !== 'object' || student.Profile === null) {
                        student.Profile = { Present: [] };
                    }

                    const studentInCourseData = (updatedCourse.Student || []).find(s => s.ID === student.ID);
                    const allComments = (studentInCourseData?.Learn || []).flatMap(l => l.Cmt || []).filter(cmt => cmt && typeof cmt === 'string' && cmt.trim() !== '');
                    const summaryComment = allComments?.length > 0 ? allComments.join('. ') : "Học sinh đã hoàn thành khóa học.";

                    const newPresentation = {
                        course: updatedCourse._id,
                        bookId: bookId,
                        bookName: bookName,
                        Comment: summaryComment,
                        Video: '',
                        Img: ''
                    };
                    
                    const currentPresentations = Array.isArray(student.Profile?.Present) ? student.Profile.Present : [];
                    const otherPresentations = currentPresentations.filter(p => p && p.bookId !== bookId);
                    const newPresentArray = [...otherPresentations, newPresentation];
                    const newProfileObject = {
                        ...(student.Profile || {}), 
                        Present: newPresentArray 
                    };

                    const studentCourses = Array.isArray(student.Course) ? student.Course : [];
                    const hasOtherActiveCourses = studentCourses.some(c => c && c.course && c.course.toString() !== updatedCourse._id.toString() && c.status === 0);
                    const newStatusForStudent = {
                        status: hasOtherActiveCourses ? 2 : 1,
                        act: hasOtherActiveCourses ? 'học' : 'chờ',
                        date: new Date(),
                        note: `Hoàn thành khóa học ${updatedCourse.ID || updatedCourse._id}`
                    };
                    
                    bulkOperations.push({
                        updateOne: {
                            filter: { _id: student._id },
                            update: {
                                $set: {
                                    'Course.$[c].status': 2,
                                    'Profile': newProfileObject
                                },
                                $push: { Status: newStatusForStudent }
                            },
                            arrayFilters: [{ 'c.course': updatedCourse._id }]
                        }
                    });
                }

                if (bulkOperations.length > 0) {
                    await PostStudent.bulkWrite(bulkOperations);
                }
            }
        }

        await reloadCourse(updatedCourse._id, updatedCourse.ID);
        if (id && String(id) !== String(updatedCourse._id)) {
            await reloadCourse(id);
        }

        return NextResponse.json({ status: 2, mes: 'Cập nhật thành công.' }, { status: 200 });
    } catch (error) {
        console.error('[COURSE_UPDATE_ERROR]', error);
        return NextResponse.json({ status: 1, mes: error.message }, { status: 500 });
    }
}