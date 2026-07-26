import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import Student from '@/models/student';
import Invoice from '@/models/invoices';
import { clearCacheByTag, clearAllCache } from '@/lib/cache';
import { revalidatePath } from 'next/cache';

export async function POST() {
    try {
        await connectDB();

        const students = await Student.find({}).lean();
        let processed = 0;
        let skipped = 0;
        let errors = [];

        for (const student of students) {
            if (!student.Course || student.Course.length === 0) continue;

            for (const course of student.Course) {
                if (course.tuition != null) {
                    skipped++;
                    continue;
                }
                if (!course.course) continue;

                try {
                    const invoice = await Invoice.create({
                        studentId: student._id,
                        courseId: course.course,
                        amountInitial: 0,
                        amountPaid: 0,
                        paymentMethod: 0,
                        discount: 0,
                        createBy: student._id,
                    });

                    await Student.updateOne(
                        { _id: student._id, 'Course.course': course.course },
                        { $set: { 'Course.$.tuition': invoice._id } }
                    );

                    processed++;
                } catch (err) {
                    errors.push({ student: student.ID || student._id, course: course.course, error: err.message });
                }
            }
        }

        clearCacheByTag('students');
        clearAllCache();
        revalidatePath('/academic/debt');

        return NextResponse.json({
            mes: `Hoàn tất: ${processed} khoản, đã đóng trước đó: ${skipped} khoản`,
            processed,
            skipped,
            errors: errors.length > 0 ? errors.slice(0, 5) : [],
        });
    } catch (error) {
        console.error('Bulk pay error:', error);
        return NextResponse.json({ mes: 'Lỗi server: ' + error.message }, { status: 500 });
    }
}
