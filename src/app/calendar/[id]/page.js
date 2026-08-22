
import { Data_lesson } from "@/data/course";
import { redirect } from "next/navigation";
import Main from "./ui/main";

export default async function CourseLessonPage({ params }) {
    const { id } = await params;
    const data = await Data_lesson(id);

    if (data?.course?.ID && data?.session?._id) {
        const buoi = data.session.buoi || (data.course.Detail?.findIndex(d => String(d._id) === String(data.session._id)) + 1) || 1;
        redirect(`/course/${data.course.ID}/lesson/${buoi}`);
    }

    return (
        <Main data={data} />
    );
}
