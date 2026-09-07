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

// Helper: Tìm Course Document bằng _id, ID (mã lớp), hoặc sessionId
async function findCourseDoc(courseId, detailId = null) {
    let course = null;
    if (courseId && isValidObjectId(courseId)) {
        course = await PostCourse.findById(courseId);
    }
    if (!course && courseId && typeof courseId === 'string') {
        course = await PostCourse.findOne({ ID: courseId.trim() });
    }
    if (!course && detailId && isValidObjectId(detailId)) {
        const Session = (await import('@/models/session')).default;
        const sDoc = await Session.findById(detailId).lean();
        if (sDoc?.course) {
            course = await PostCourse.findById(sDoc.course);
        }
        if (!course && sDoc?.courseCode) {
            course = await PostCourse.findOne({ ID: sDoc.courseCode });
        }
        if (!course) {
            course = await PostCourse.findOne({ 'Detail._id': new Types.ObjectId(detailId) });
        }
    }
    return course;
}

export async function POST(request) {
    try {
        const { courseId, detailId, data, student = [], type } = await request.json();
        
        if ((!courseId && !detailId) || !data || typeof data !== 'object') {
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

            const courseTarget = await findCourseDoc(courseId);
            if (!courseTarget) return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học' }, { status: 404 });

            let imageURL = '';
            try {
                const drive = getDriveClient();
                let courseFolderId = '';
                if (courseTarget?.ID && PARENT_FOLDER_ID) {
                    const list = await drive.files.list({
                        q: `name='${courseTarget.ID}' and '${PARENT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                        fields: 'files(id)',
                        supportsAllDrives: true,
                        includeItemsFromAllDrives: true,
                    });
                    if (list.data.files?.length) {
                        courseFolderId = list.data.files[0].id;
                    } else {
                        courseFolderId = await createDriveFolder(drive, courseTarget.ID, PARENT_FOLDER_ID);
                    }
                }
                if (courseFolderId) {
                    imageURL = await createDriveFolder(drive, lessonFolderName(courseTarget.ID, data.Day), courseFolderId);
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
                courseTarget._id,
                { $push: { Detail: newDetailEntry } },
                { new: true, projection: { Detail: 1, ID: 1, Student: 1 } }
            );

            if (!updatedCourse) return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học để thêm buổi học' }, { status: 404 });

            await Session.create({
                _id: newLessonObjectId,
                course: courseTarget._id,
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
                    { _id: courseTarget._id },
                    { $push: { "Student.$[studentElem].Learn": { Lesson: newLessonObjectId, Checkin: 0, makeupStatus: 'MAKEUP_SCHEDULED' } } },
                    { arrayFilters: [{ "studentElem.ID": { $in: studentList } }] }
                ).catch(err => console.error('[udetail] PostCourse Learn error:', err));

                const attDocs = studentList.map(stId => ({
                    session: newLessonObjectId,
                    course: courseTarget._id,
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

            await reloadCourse(courseTarget._id);
            if (updatedCourse?.ID) {
                await reloadCourse(updatedCourse.ID);
            }
            return NextResponse.json({ status: 2, mes: 'Tạo buổi học bù thành công', data: updatedCourse }, { status: 201 });
        }

// Getters hỗ trợ truy xuất linh hoạt giữa Session (chữ thường) và Detail (chữ hoa)
function getLessonDay(d) { return d?.day || d?.Day || null; }
function getLessonTime(d) { return d?.time || d?.Time || '08:00'; }
function getLessonRoom(d) { return d?.room || d?.Room || null; }
function getLessonTeacher(d) { return d?.teacher || d?.Teacher || null; }
function getLessonTeachingAs(d) { return d?.teachingAs || d?.TeachingAs || null; }
function getLessonTopic(d) { return d?.topic || d?.Topic || null; }
function getLessonType(d) { return d?.type || d?.Type || ''; }

// Helper: Tính toán thời gian và thông tin buổi bù kế tiếp theo chu kỳ lớp
function calculateNextLessonSlot(lessons, fallbackTeacher = null) {
    if (!lessons || lessons.length === 0) {
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 7);
        return { day: nextDay, time: '08:00', room: null, teacher: fallbackTeacher, teachingAs: null };
    }

    const validLessons = lessons.filter(d => getLessonDay(d) && !isNaN(new Date(getLessonDay(d)).getTime()));
    if (validLessons.length === 0) {
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 7);
        return { day: nextDay, time: '08:00', room: null, teacher: fallbackTeacher, teachingAs: null };
    }

    const sorted = [...validLessons].sort((a, b) => new Date(getLessonDay(a)) - new Date(getLessonDay(b)));
    const lastLesson = sorted[sorted.length - 1];
    const lastDate = new Date(getLessonDay(lastLesson));

    // Thu thập cấu hình các thứ trong tuần mà lớp học
    const dayOfWeekConfigs = new Map();
    for (const d of sorted) {
        const dObj = new Date(getLessonDay(d));
        const dow = dObj.getDay();
        dayOfWeekConfigs.set(dow, {
            time: getLessonTime(d) || getLessonTime(lastLesson) || '08:00',
            room: getLessonRoom(d) || getLessonRoom(lastLesson) || null,
            teacher: getLessonTeacher(d) || getLessonTeacher(lastLesson) || fallbackTeacher || null,
            teachingAs: getLessonTeachingAs(d) || getLessonTeachingAs(lastLesson) || null
        });
    }

    const candidate = new Date(lastDate);
    candidate.setDate(candidate.getDate() + 1);

    for (let i = 0; i < 7; i++) {
        const dow = candidate.getDay();
        if (dayOfWeekConfigs.has(dow)) {
            const config = dayOfWeekConfigs.get(dow);
            return {
                day: new Date(candidate),
                time: config.time,
                room: config.room,
                teacher: config.teacher,
                teachingAs: config.teachingAs
            };
        }
        candidate.setDate(candidate.getDate() + 1);
    }

    const fallbackDate = new Date(lastDate);
    fallbackDate.setDate(fallbackDate.getDate() + 7);
    return {
        day: fallbackDate,
        time: getLessonTime(lastLesson) || '08:00',
        room: getLessonRoom(lastLesson) || null,
        teacher: getLessonTeacher(lastLesson) || fallbackTeacher || null,
        teachingAs: getLessonTeachingAs(lastLesson) || null
    };
}

        // --- Handle 'Báo nghỉ' ---
        if (type === 'Báo nghỉ') {
            const Session = (await import('@/models/session')).default;
            const Attendance = (await import('@/models/attendance')).default;

            const courseDoc = await findCourseDoc(courseId, detailId);
            if (!courseDoc) return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học' }, { status: 404 });

            // 1. Lấy toàn bộ danh sách buổi học từ Session collection (hoặc từ courseDoc.Detail)
            let allSessions = await Session.find({
                $or: [{ course: courseDoc._id }, { courseCode: courseDoc.ID }]
            }).sort({ day: 1, buoi: 1 }).lean();

            if (!allSessions || allSessions.length === 0) {
                if (courseDoc.Detail && courseDoc.Detail.length > 0) {
                    allSessions = courseDoc.Detail.map((d, i) => ({
                        _id: d._id,
                        day: d.Day,
                        time: d.Time,
                        room: d.Room,
                        teacher: d.Teacher,
                        teachingAs: d.TeachingAs,
                        topic: d.Topic,
                        type: d.Type || 'Chính khóa',
                        note: d.Note || '',
                        buoi: i + 1
                    }));
                }
            }

            // 2. Xác định buổi học mục tiêu cần báo nghỉ
            let targetSession = (allSessions || []).find(s => String(s._id) === String(detailId));
            if (!targetSession && detailId) {
                const targetDetail = (courseDoc.Detail || []).find(d => String(d._id) === String(detailId));
                if (targetDetail) {
                    targetSession = {
                        _id: targetDetail._id,
                        day: targetDetail.Day,
                        time: targetDetail.Time,
                        room: targetDetail.Room,
                        teacher: targetDetail.Teacher,
                        teachingAs: targetDetail.TeachingAs,
                        topic: targetDetail.Topic,
                        type: targetDetail.Type || 'Chính khóa',
                        note: targetDetail.Note || ''
                    };
                }
            }

            if (!targetSession) {
                return NextResponse.json({ status: 1, mes: 'Không tìm thấy buổi học cần báo nghỉ' }, { status: 404 });
            }

            if (targetSession.type === 'Báo nghỉ' || targetSession.Type === 'Báo nghỉ') {
                return NextResponse.json({ status: 1, mes: 'Buổi học này đã được báo nghỉ trước đó.' }, { status: 400 });
            }

            // Kiểm tra nếu buổi học đã diễn ra trong quá khứ
            const targetDay = getLessonDay(targetSession);
            if (targetDay) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const lessonDay = new Date(targetDay);
                lessonDay.setHours(0, 0, 0, 0);
                if (lessonDay < today) {
                    return NextResponse.json({ status: 1, mes: 'Không thể báo nghỉ: Buổi học này đã diễn ra trong quá khứ.' }, { status: 400 });
                }
            }

            // 3. Lấy danh sách toàn bộ chủ đề chuẩn từ sách (Book)
            let curriculumTopics = [];
            if (courseDoc.Book) {
                const BookModel = (await import('@/models/book')).default;
                const bookDoc = await BookModel.findById(courseDoc.Book).select('Topics').lean();
                if (bookDoc?.Topics?.length) {
                    curriculumTopics = bookDoc.Topics.map(t => t._id);
                }
            }
            if (curriculumTopics.length === 0) {
                curriculumTopics = (allSessions || []).map(s => getLessonTopic(s)).filter(Boolean);
            }

            // 4. Sắp xếp toàn bộ các buổi học theo thứ tự ngày học tăng dần
            const sortedSessions = [...allSessions].sort((a, b) => new Date(getLessonDay(a)) - new Date(getLessonDay(b)));

            let activeIndex = 0;
            const sessionUpdates = [];

            // Cập nhật lại topic cho từng buổi học trong Session và Course.Detail
            for (const item of sortedSessions) {
                const isTarget = String(item._id) === String(targetSession._id);

                if (isTarget) {
                    // Cập nhật buổi báo nghỉ trong Session collection
                    sessionUpdates.push(
                        Session.findByIdAndUpdate(item._id, {
                            $set: { type: 'Báo nghỉ', note: data.Note || '' }
                        }).catch(err => console.error('Session update target error:', err.message))
                    );
                    // Cập nhật trong Course.Detail nếu có
                    const dItem = (courseDoc.Detail || []).find(d => String(d._id) === String(item._id));
                    if (dItem) {
                        dItem.Type = 'Báo nghỉ';
                        dItem.Note = data.Note || '';
                    }
                    continue;
                }

                if (item.type === 'Báo nghỉ' || item.Type === 'Báo nghỉ') {
                    continue;
                }

                // Buổi học còn hiệu lực: nhận topic tịnh tiến từ giáo trình
                const assignedTopic = curriculumTopics[activeIndex] || curriculumTopics[curriculumTopics.length - 1] || getLessonTopic(item);
                if (assignedTopic) {
                    sessionUpdates.push(
                        Session.findByIdAndUpdate(item._id, {
                            $set: { topic: new Types.ObjectId(assignedTopic) }
                        }).catch(err => console.error('Session update topic error:', err.message))
                    );
                    const dItem = (courseDoc.Detail || []).find(d => String(d._id) === String(item._id));
                    if (dItem) {
                        dItem.Topic = new Types.ObjectId(assignedTopic);
                    }
                }
                activeIndex++;
            }

            // 5. Tính toán thời gian và slot cho buổi học bù tự động tạo ở cuối khóa
            const nextSlot = calculateNextLessonSlot(sortedSessions, courseDoc.TeacherHR);
            const newLessonObjectId = new Types.ObjectId();
            const newLessonTopic = curriculumTopics[activeIndex] || curriculumTopics[curriculumTopics.length - 1] || getLessonTopic(targetSession);

            // 6. Tạo thư mục Google Drive cho buổi bù
            let imageURL = '';
            try {
                const drive = getDriveClient();
                let courseFolderId = '';
                if (courseDoc.ID && PARENT_FOLDER_ID) {
                    const list = await drive.files.list({
                        q: `name='${courseDoc.ID}' and '${PARENT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                        fields: 'files(id)',
                        supportsAllDrives: true,
                        includeItemsFromAllDrives: true,
                    });
                    if (list.data.files?.length) {
                        courseFolderId = list.data.files[0].id;
                    } else {
                        courseFolderId = await createDriveFolder(drive, courseDoc.ID, PARENT_FOLDER_ID);
                    }
                }
                if (courseFolderId) {
                    imageURL = await createDriveFolder(drive, lessonFolderName(courseDoc.ID, nextSlot.day), courseFolderId);
                }
            } catch (driveErr) {
                console.error('[ucalendarcourse] Auto-makeup DRIVE_FOLDER_ERROR:', driveErr.message);
            }

            const targetDateStr = targetDay ? new Date(targetDay).toLocaleDateString('vi-VN') : '';

            // 7. Tạo mục Detail mới cho buổi học bù
            const newDetailEntry = {
                _id: newLessonObjectId,
                Topic: new Types.ObjectId(newLessonTopic),
                Day: nextSlot.day,
                Room: nextSlot.room || null,
                Time: nextSlot.time || '08:00',
                Teacher: nextSlot.teacher || courseDoc.TeacherHR || null,
                TeachingAs: nextSlot.teachingAs || null,
                Image: imageURL,
                DetailImage: [],
                Type: 'Chính khóa',
                Note: `[Tự động bù cho buổi ${targetDateStr} báo nghỉ]`
            };

            if (!courseDoc.Detail) courseDoc.Detail = [];
            courseDoc.Detail.push(newDetailEntry);

            // 8. Cập nhật Student.Learn cho tất cả học sinh đang học
            if (courseDoc.Student && courseDoc.Student.length > 0) {
                courseDoc.Student.forEach(st => {
                    if (!st.Learn) st.Learn = [];
                    st.Learn.push({
                        Lesson: newLessonObjectId,
                        Checkin: 0,
                        Cmt: [],
                        CmtFn: '',
                        Note: '',
                        Image: [],
                        absenceReason: '',
                        makeupStatus: 'NOT_REQUIRED'
                    });
                });
            }

            // Lưu Course document
            await courseDoc.save();

            // 9. Tạo Session document cho buổi học bù mới
            const newSessionDoc = {
                _id: newLessonObjectId,
                course: courseDoc._id,
                courseCode: courseDoc.ID,
                courseName: courseDoc.ID,
                courseType: courseDoc.Type || 'AI Robotic',
                buoi: sortedSessions.length + 1,
                day: nextSlot.day,
                time: nextSlot.time,
                room: nextSlot.room,
                teacher: nextSlot.teacher || courseDoc.TeacherHR,
                teachingAs: nextSlot.teachingAs,
                topic: new Types.ObjectId(newLessonTopic),
                book: courseDoc.Book || null,
                image: imageURL,
                detailImage: [],
                type: 'official',
                status: true,
                note: `[Tự động bù cho buổi ${targetDateStr} báo nghỉ]`
            };

            sessionUpdates.push(
                Session.create(newSessionDoc).catch(err => console.error('Session.create auto-makeup error:', err.message))
            );

            // 10. Tạo bản ghi Attendance cho toàn bộ học sinh lớp
            if (courseDoc.Student && courseDoc.Student.length > 0) {
                const attDocs = courseDoc.Student.map(s => ({
                    session: newLessonObjectId,
                    course: courseDoc._id,
                    courseCode: courseDoc.ID,
                    studentId: s.ID,
                    checkin: 0,
                    cmt: [],
                    cmtFn: '',
                    note: '',
                    images: [],
                    absenceReason: '',
                    makeupStatus: 'NOT_REQUIRED'
                }));
                sessionUpdates.push(
                    Attendance.insertMany(attDocs).catch(err => console.error('Attendance.insertMany auto-makeup error:', err.message))
                );
            }

            await Promise.all(sessionUpdates);

            await reloadCourse(courseDoc._id);
            if (courseDoc.ID) {
                await reloadCourse(courseDoc.ID);
            }

            const formattedNextDate = nextSlot.day ? new Date(nextSlot.day).toLocaleDateString('vi-VN') : '';
            return NextResponse.json({
                status: 2,
                mes: `Báo nghỉ thành công! Nội dung các buổi sau đã được dời tịnh tiến và tự động tạo buổi bù vào ngày ${formattedNextDate}.`,
                data: courseDoc
            }, { status: 200 });
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
            await Session.findByIdAndUpdate(detailId, { $set: sessionSetObj }).catch(err => console.error('Session.findByIdAndUpdate sessionSetObj error:', err.message));
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
                await Attendance.deleteMany({ session: lessonObjectId, studentId: { $in: toRemove } }).catch(err => console.error('Attendance.deleteMany error in ucalendarcourse:', err.message));
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
                await Attendance.insertMany(newAttDocs).catch(err => console.error('Attendance.insertMany error in ucalendarcourse:', err.message));
            }
        }
        reloadCourse(courseId);
        return NextResponse.json({ status: 2, mes: 'Cập nhật buổi học thành công', data: courseAfterUpdate || { _id: detailId } }, { status: 200 });
    } catch (err) {
        console.error('[udetail] top-level error:', err);
        return NextResponse.json({ status: 1, mes: err.message || 'Server Error' }, { status: 500 });
    }
}