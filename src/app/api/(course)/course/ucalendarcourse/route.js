/* app/api/course/udetail/route.js */
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import Area from '@/models/area';
import { NextResponse } from 'next/server';
import { Types, isValidObjectId } from 'mongoose';
import { reloadCourse } from '@/data/actions/reload';
import { getDriveClient, createDriveFolder } from '@/function/drive/folder';

const PARENT_FOLDER_ID = process.env.DRIVE_COURSE_FOLDER_ID;
const CREATE_LESSON_REQUIRED = ['Day', 'Topic', 'Room', 'Time', 'Teacher'];

// Helper: Tìm _id của phòng từ tên phòng
async function findRoomIdByName(roomName) {
    if (!roomName || typeof roomName !== 'string') return null;
    const areaDoc = await Area.findOne({ 'rooms.name': roomName }, { 'rooms.$': 1 });
    return areaDoc?.rooms?.[0]?._id || null;
}

export async function POST(request) {
    try {
        const { courseId, detailId, data, student = [], type } = await request.json();
        
        if (!courseId || !data || typeof data !== 'object') {
            return NextResponse.json({ status: 1, mes: 'Thiếu courseId hoặc data' }, { status: 400 });
        }

        await connectDB();
        if (type === 'Học bù') {
            const missing = CREATE_LESSON_REQUIRED.filter(k => !(k in data));
            if (missing.length) {
                return NextResponse.json({ status: 1, mes: `Thiếu trường khi tạo buổi học: ${missing.join(', ')}` }, { status: 400 });
            }
            const roomId = await findRoomIdByName(data.Room);
            if (!roomId) {
                return NextResponse.json({ status: 1, mes: `Phòng học '${data.Room}' không tồn tại` }, { status: 404 });
            }

            if (!isValidObjectId(data.Topic)) return NextResponse.json({ status: 1, mes: 'Topic ID không hợp lệ' }, { status: 400 });
            if (!isValidObjectId(data.Teacher)) return NextResponse.json({ status: 1, mes: 'Teacher ID không hợp lệ' }, { status: 400 });
            if (data.TeachingAs && !isValidObjectId(data.TeachingAs)) return NextResponse.json({ status: 1, mes: 'TeachingAs ID không hợp lệ' }, { status: 400 });

            const lessonDay = new Date(data.Day);
            if (isNaN(lessonDay.getTime())) return NextResponse.json({ status: 1, mes: 'Định dạng ngày (Day) không hợp lệ.' }, { status: 400 });

            let imageURL = '';
            try {
                const drive = getDriveClient();
                const course = await PostCourse.findById(courseId).select('ID').lean();
                let courseFolderId = '';
                if (course?.ID) {
                    const list = await drive.files.list({
                        q: `name='${course.ID}' and '${PARENT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                        fields: 'files(id)',
                        supportsAllDrives: true,
                        includeItemsFromAllDrives: true,
                    });
                    if (list.data.files?.length) {
                        courseFolderId = list.data.files[0].id;
                    } else {
                        courseFolderId = await createDriveFolder(drive, course.ID, PARENT_FOLDER_ID);
                    }
                }
                if (courseFolderId) {
                    imageURL = await createDriveFolder(drive, new Date(data.Day).toISOString(), courseFolderId);
                } else {
                    imageURL = await createDriveFolder(drive, data.Day, PARENT_FOLDER_ID);
                }
            } catch (err) {
                console.error('[udetail] DRIVE_FOLDER_ERROR:', err);
            }

            const newLessonObjectId = new Types.ObjectId();

            const newDetailEntry = {
                _id: newLessonObjectId,
                Topic: new Types.ObjectId(data.Topic),
                Day: lessonDay,
                Room: roomId, // Sử dụng ObjectId của phòng đã tìm được
                Time: data.Time,
                Teacher: new Types.ObjectId(data.Teacher),
                TeachingAs: data.TeachingAs ? new Types.ObjectId(data.TeachingAs) : null,
                Image: imageURL,
                DetailImage: [],
                Type: type,
                Note: data.Note || ''
            };

            const updatedCourse = await PostCourse.findByIdAndUpdate(
                courseId,
                { $push: { Detail: newDetailEntry } },
                { new: true, projection: { Detail: 1, ID: 1, Student: 1 } }
            );

            if (!updatedCourse) return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học để thêm buổi học' }, { status: 404 });

            if (student.length > 0) {
                await PostCourse.updateOne(
                    { _id: courseId },
                    { $push: { "Student.$[studentElem].Learn": { Lesson: newLessonObjectId } } },
                    { arrayFilters: [{ "studentElem.ID": { $in: student } }] }
                );
            }

            return NextResponse.json({ status: 2, mes: `Đã thêm buổi ${type} thành công`, data: updatedCourse }, { status: 200 });
        }

        // --- Handle 'Báo nghỉ' ---
        if (type === 'Báo nghỉ') {
            if (!detailId || !isValidObjectId(detailId)) return NextResponse.json({ status: 1, mes: 'Thiếu hoặc sai định dạng detailId để báo nghỉ' }, { status: 400 });
            
            const updated = await PostCourse.findOneAndUpdate(
                { _id: courseId, 'Detail._id': detailId },
                { $set: { 'Detail.$.Type': type, 'Detail.$.Note': data.Note || '' } },
                { new: true, projection: { Detail: 1, ID: 1 } }
            );

            if (!updated) return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học hoặc buổi học để báo nghỉ' }, { status: 404 });
            return NextResponse.json({ status: 2, mes: 'Báo nghỉ buổi học thành công', data: updated }, { status: 200 });
        }

        // --- Handle Cập nhật thông thường ---
        if (!detailId || !isValidObjectId(detailId)) return NextResponse.json({ status: 1, mes: 'Thiếu hoặc sai định dạng detailId để cập nhật' }, { status: 400 });

        const setObj = {};
        const { Room, Teacher, TeachingAs = null, Students: updatedStudentIds = null } = data;

        if (Room !== undefined) {
            const roomId = await findRoomIdByName(Room);
            if (!roomId) return NextResponse.json({ status: 1, mes: `Phòng học '${Room}' không tồn tại.` }, { status: 404 });
            setObj['Detail.$.Room'] = roomId;
        }
        if (Teacher) {
            if (!isValidObjectId(Teacher)) return NextResponse.json({ status: 1, mes: 'ID giáo viên (Teacher) không hợp lệ' }, { status: 400 });
            setObj['Detail.$.Teacher'] = new Types.ObjectId(Teacher);
        }
        if (TeachingAs !== undefined) {
            if (TeachingAs === null) {
                setObj['Detail.$.TeachingAs'] = null;
            } else if (isValidObjectId(TeachingAs)) {
                setObj['Detail.$.TeachingAs'] = new Types.ObjectId(TeachingAs);
            } else {
                return NextResponse.json({ status: 1, mes: 'ID trợ giảng (TeachingAs) không hợp lệ' }, { status: 400 });
            }
        }
        if (data.Note !== undefined) {
            setObj['Detail.$.Note'] = data.Note;
        }

        let courseAfterUpdate;
        if (Object.keys(setObj).length > 0) {
            courseAfterUpdate = await PostCourse.findOneAndUpdate(
                { _id: courseId, 'Detail._id': detailId },
                { $set: setObj },
                { new: true, projection: { Detail: 1, ID: 1, Student: 1 } }
            );
            if (!courseAfterUpdate) return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học hoặc buổi học để cập nhật' }, { status: 404 });
        } else {
            courseAfterUpdate = await PostCourse.findById(courseId, { Detail: 1, ID: 1, Student: 1 });
            if (!courseAfterUpdate) return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học' }, { status: 404 });
        }

        if (updatedStudentIds !== null) {
            const lessonObjectId = new Types.ObjectId(detailId);
            const currentLessonStudents = new Set();
            courseAfterUpdate.Student.forEach(s => {
                if (s.Learn.some(learnItem => learnItem.Lesson.equals(lessonObjectId))) {
                    currentLessonStudents.add(s.ID);
                }
            });

            const newStudentIdsSet = new Set(updatedStudentIds);
            const studentsToRemoveLearn = [...currentLessonStudents].filter(sId => !newStudentIdsSet.has(sId));
            const studentsToAddLearn = [...newStudentIdsSet].filter(sId => !currentLessonStudents.has(sId));

            if (studentsToRemoveLearn.length > 0) {
                await PostCourse.updateOne(
                    { _id: courseId },
                    { $pull: { "Student.$[studentElem].Learn": { Lesson: lessonObjectId } } },
                    { arrayFilters: [{ "studentElem.ID": { $in: studentsToRemoveLearn } }] }
                );
            }

            if (studentsToAddLearn.length > 0) {
                await PostCourse.updateOne(
                    { _id: courseId },
                    { $push: { "Student.$[studentElem].Learn": { Lesson: lessonObjectId } } },
                    { arrayFilters: [{ "studentElem.ID": { $in: studentsToAddLearn } }] }
                );
            }
        }
        reloadCourse(courseId);
        return NextResponse.json({ status: 2, mes: 'Cập nhật buổi học thành công', data: courseAfterUpdate }, { status: 200 });

    } catch (err) {
        console.error('[udetail] top-level error:', err);
        return NextResponse.json({ status: 1, mes: err.message || 'Server Error' }, { status: 500 });
    }
}