import Timeline from "./ui/timeline";
import Detail from "./ui/detailcourse";
import { course_data, student_data, user_data } from "@/data/actions/get";
import { Data_lesson } from "@/data/course";
import { redirect } from "next/navigation";
import LessonMain from "@/app/calendar/[id]/ui/main";

export default async function OverviewTab({ params, searchParams }) {
    const { id } = await params;
    const sParams = await searchParams;

    // Support clean URL: /course/[code]/lesson/[buoi] (e.g. /course/26FZ1012/lesson/7)
    if (id.length >= 3 && id[1] === 'lesson') {
        const courseCode = id[0];
        const lessonParam = id[2];
        const data = await course_data(courseCode);
        if (!data) return <div className="flex items-center justify-center h-full text-sm text-[var(--text-secondary)]">Không tìm thấy khóa học {courseCode}</div>;

        let session = null;
        let buoiNum = parseInt(lessonParam, 10);
        if (!isNaN(buoiNum) && buoiNum > 0 && buoiNum <= (data.Detail?.length || 0)) {
            session = data.Detail[buoiNum - 1];
        } else {
            // Nếu truy cập bằng hash ID cũ (ví dụ 6a65e94928ef1c467d7b94c1), redirect sang số buổi chuẩn!
            const foundIdx = (data.Detail || []).findIndex(d => String(d._id) === String(lessonParam));
            if (foundIdx >= 0) {
                buoiNum = foundIdx + 1;
                redirect(`/course/${courseCode}/lesson/${buoiNum}`);
            } else {
                session = data.Detail?.find(d => String(d._id) === String(lessonParam));
            }
        }

        if (!session?._id) {
            return <div className="flex items-center justify-center h-full text-sm text-[var(--text-secondary)]">Không tìm thấy buổi học {lessonParam} của lớp {courseCode}</div>;
        }

        const lessonData = await Data_lesson(session._id);
        return <LessonMain data={lessonData} />;
    }

    const data = await course_data(id[0]);
    if (!data) return <div className="flex items-center justify-center h-full text-sm text-[var(--text-secondary)]">Không tìm thấy khóa học</div>
    let students = await student_data();
    const users = await user_data({ activeOnly: true })
    const tienDo = tinhTienDoHocTap(data);
    data.Progress = tienDo; 

    // Support ?lesson=1..N (1-based index) or ?lesson=<id> or fallback to id[1]
    let selectedLessonId = id.length > 1 ? id[1] : null;
    if (sParams?.lesson) {
        const lessonNum = parseInt(sParams.lesson, 10);
        if (!isNaN(lessonNum) && lessonNum > 0 && lessonNum <= (data.Detail?.length || 0)) {
            selectedLessonId = data.Detail[lessonNum - 1]?._id;
        } else {
            const matched = data.Detail?.find(d => String(d._id) === String(sParams.lesson));
            if (matched) selectedLessonId = matched._id;
            else selectedLessonId = sParams.lesson;
        }
    }
    
    return (
        <div className="flex flex-col lg:flex-row" style={{ height: '100%', width: '100%', gap: 16 }}>
            <div className="hidden lg:block" style={{ flex: '1.6 1.6 0%', minWidth: 0, minHeight: 0 }}>
                <Timeline data={data} props={id} selectedLessonId={selectedLessonId} />
            </div>
            <div className="lg:flex-[4] min-w-0">
                <Detail data={data} params={id} initialLessonId={selectedLessonId} studentsx={students} users={users}>
                    <Timeline data={data} props={id} selectedLessonId={selectedLessonId} />
                </Detail>
            </div>
        </div>
    );
}

function tinhTienDoHocTap(data) {
    let tongSoTiet = 0;
    let tietDaHoc = 0;
    const ngayHienTai = new Date();
    const danhSachBuoiHoc = data?.Detail || [];

    danhSachBuoiHoc.forEach(buoiHoc => {
        const soTiet = buoiHoc?.LessonDetails?.Period;
        if (typeof soTiet === 'number') {
            tongSoTiet += soTiet;

            try {
                const ngayHoc = new Date(buoiHoc.Day);
                if (ngayHoc < ngayHienTai) {
                    tietDaHoc += soTiet;
                }
            } catch (e) {
                console.error("Lỗi khi xử lý ngày của buổi học:", e);
            }
        }
    });

    return `${tietDaHoc}/${tongSoTiet}`;
}
