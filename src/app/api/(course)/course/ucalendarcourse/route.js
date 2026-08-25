/* app/api/course/udetail/route.js */
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import Area from '@/models/area';
import { NextResponse } from 'next/server';
import { Types, isValidObjectId } from 'mongoose';
import { reloadCourse } from '@/data/actions/reload';
import { getDriveClient, createDriveFolder, lessonFolderName } from '@/function/drive/folder';

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
                    imageURL = await createDriveFolder(drive, lessonFolderName(course.ID, data.Day), courseFolderId);
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
                Room: roomId,
                Time: data.Time,
                Teacher: new Types.ObjectId(data.Teacher),
                TeachingAs: data.TeachingAs ? new Types.ObjectId(data.TeachingAs) : null,
                Image: imageURL,
                DetailImage: [],
                Type: type,
                Note: data.Note || ''
            };

            const Session = (await import('@/models/session')).default;
            const Attendance = (await import('@/models/attendance')).default;

            const updatedCourse = await PostCourse.findByIdAndUpdate(
                courseId,
                { $push: { Detail: newDetailEntry } },
                { new: true, projection: { Detail: 1, ID: 1, Student: 1 } }
            );

            if (!updatedCourse) return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học để thêm buổi học' }, { status: 404 });

            await Session.create({
                _id: newLessonObjectId,
                course: courseId,
                courseCode: updatedCourse.ID,
                courseName: updatedCourse.ID,
                buoi: (updatedCourse.Detail || []).length || 1,
                day: lessonDay,
                time: data.Time,
                room: roomId,
                teacher: new Types.ObjectId(data.Teacher),
                teachingAs: data.TeachingAs ? new Types.ObjectId(data.TeachingAs) : null,
                topic: new Types.ObjectId(data.Topic),
                image: imageURL,
                detailImage: [],
                type: type || 'Học bù',
                status: true,
                note: data.Note || ''
            }).catch(err => console.error('[udetail] Session.create error:', err));

            const studentList = (student && Array.isArray(student) && student.length > 0)
                ? student
                : (data?.Students && Array.isArray(data.Students) ? data.Students : (data?.student && Array.isArray(data.student) ? data.student : []));

            if (studentList.length > 0) {
                await PostCourse.updateOne(
                    { _id: courseId },
                    { $push: { "Student.$[studentElem].Learn": { Lesson: newLessonObjectId, Checkin: 0, makeupStatus: 'MAKEUP_SCHEDULED' } } },
                    { arrayFilters: [{ "studentElem.ID": { $in: studentList } }] }
                ).catch(err => console.error('[udetail] PostCourse Learn error:', err));

                const attDocs = studentList.map(stId => ({
                    session: newLessonObjectId,
                    course: courseId,
                    courseCode: updatedCourse.ID,
                    studentId: stId,
                    checkin: 0,
                    cmt: [],
                    cmtFn: '',
                    note: '',
                    images: [],
                    absenceReason: '',
                    makeupStatus: 'MAKEUP_SCHEDULED'
                }));
                await Attendance.insertMany(attDocs).catch(err => console.error('[udetail] Attendance.insertMany error:', err));
            }

            await reloadCourse(courseId);
            if (updatedCourse?.ID) {
                await reloadCourse(updatedCourse.ID);
            }
            return NextResponse.json({ status: 2, mes: 'Tạo buổi học bù thành công', data: updatedCourse }, { status: 201 });
        }

        // --- Handle 'Báo nghỉ' ---
        if (type === 'Báo nghỉ') {
            if (!detailId || !isValidObjectId(detailId)) return NextResponse.json({ status: 1, mes: 'Thiếu hoặc sai định dạng detailId để báo nghỉ' }, { status: 400 });
            
            // Kiểm tra nếu buổi học đã diễn ra trong quá khứ
            const courseDoc = await PostCourse.findById(courseId).select('Detail ID');
            if (!courseDoc) return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học' }, { status: 404 });
            const targetLesson = courseDoc.Detail?.id ? courseDoc.Detail.id(detailId) : courseDoc.Detail?.find(d => d._id?.toString() === detailId.toString());
            if (targetLesson && targetLesson.Day) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const lessonDay = new Date(targetLesson.Day);
                lessonDay.setHours(0, 0, 0, 0);
                if (lessonDay < today) {
                    return NextResponse.json({ status: 1, mes: 'Không thể báo nghỉ: Buổi học này đã diễn ra trong quá khứ.' }, { status: 400 });
                }
            }

            const Session = (await import('@/models/session')).default;
            await Session.findByIdAndUpdate(detailId, {
                $set: { type: type, note: data.Note || '' }
            }).catch(() => {});

            const updated = await PostCourse.findOneAndUpdate(
                { _id: courseId, 'Detail._id': detailId },
                { $set: { 'Detail.$.Type': type, 'Detail.$.Note': data.Note || '' } },
                { new: true, projection: { Detail: 1, ID: 1 } }
            );

            reloadCourse(courseId);
            return NextResponse.json({ status: 2, mes: 'Báo nghỉ buổi học thành công', data: updated || { _id: detailId } }, { status: 200 });
        }

        // --- Handle Cập nhật thông thường ---
        if (!detailId || !isValidObjectId(detailId)) return NextResponse.json({ status: 1, mes: 'Thiếu hoặc sai định dạng detailId để cập nhật' }, { status: 400 });

        const setObj = {};
        const sessionSetObj = {};
        const { Room, Teacher, TeachingAs = null, Students: updatedStudentIds = null } = data;

        if (Room !== undefined) {
            const roomId = await findRoomIdByName(Room);
            if (!roomId) return NextResponse.json({ status: 1, mes: `Phòng học '${Room}' không tồn tại.` }, { status: 404 });
            setObj['Detail.$.Room'] = roomId;
            sessionSetObj.room = roomId;
        }
        if (Teacher) {
            if (!isValidObjectId(Teacher)) return NextResponse.json({ status: 1, mes: 'ID giáo viên (Teacher) không hợp lệ' }, { status: 400 });
            setObj['Detail.$.Teacher'] = new Types.ObjectId(Teacher);
            sessionSetObj.teacher = new Types.ObjectId(Teacher);
        }
        if (TeachingAs !== undefined) {
            if (TeachingAs === null) {
                setObj['Detail.$.TeachingAs'] = null;
                sessionSetObj.teachingAs = null;
            } else if (isValidObjectId(TeachingAs)) {
                setObj['Detail.$.TeachingAs'] = new Types.ObjectId(TeachingAs);
                sessionSetObj.teachingAs = new Types.ObjectId(TeachingAs);
            } else {
                return NextResponse.json({ status: 1, mes: 'ID trợ giảng (TeachingAs) không hợp lệ' }, { status: 400 });
            }
        }
        if (data.Note !== undefined) {
            setObj['Detail.$.Note'] = data.Note;
            sessionSetObj.note = data.Note;
        }

        const Session = (await import('@/models/session')).default;
        const Attendance = (await import('@/models/attendance')).default;

        if (Object.keys(sessionSetObj).length > 0) {
            await Session.findByIdAndUpdate(detailId, { $set: sessionSetObj }).catch(() => {});
        }

        let courseAfterUpdate;
        if (Object.keys(setObj).length > 0) {
            courseAfterUpdate = await PostCourse.findOneAndUpdate(
                { _id: courseId, 'Detail._id': detailId },
                { $set: setObj },
                { new: true, projection: { Detail: 1, ID: 1, Student: 1 } }
            );
        } else {
            courseAfterUpdate = await PostCourse.findById(courseId, { Detail: 1, ID: 1, Student: 1 });
        }

        if (updatedStudentIds !== null) {
            const lessonObjectId = new Types.ObjectId(detailId);
            const courseCode = courseAfterUpdate?.ID || '';

            // Update Attendance collection
            const existingAttendances = await Attendance.find({ session: lessonObjectId }).lean();
            const existingStudentIds = new Set(existingAttendances.map(a => a.studentId));
            const newStudentIdsSet = new Set(updatedStudentIds);

            const toRemove = [...existingStudentIds].filter(sId => !newStudentIdsSet.has(sId));
            const toAdd = [...newStudentIdsSet].filter(sId => !existingStudentIds.has(sId));

            if (toRemove.length > 0) {
                await Attendance.deleteMany({ session: lessonObjectId, studentId: { $in: toRemove } }).catch(() => {});
            }
            if (toAdd.length > 0) {
                const newAttDocs = toAdd.map(sId => ({
                    session: lessonObjectId,
                    course: courseId,
                    courseCode: courseCode,
                    studentId: sId,
                    checkin: 0,
                    cmt: [],
                    cmtFn: '',
                    note: '',
                    images: [],
                    absenceReason: '',
                    makeupStatus: 'NOT_REQUIRED'
                }));
                await Attendance.insertMany(newAttDocs).catch(() => {});
            }
        }
        reloadCourse(courseId);
        return NextResponse.json({ status: 2, mes: 'Cập nhật buổi học thành công', data: courseAfterUpdate || { _id: detailId } }, { status: 200 });
    } catch (err) {
        console.error('[udetail] top-level error:', err);
        return NextResponse.json({ status: 1, mes: err.message || 'Server Error' }, { status: 500 });
    }
}