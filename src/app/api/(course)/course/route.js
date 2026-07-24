import connectDB from '@/config/connectDB';
import mongoose from 'mongoose';
import PostCourse from '@/models/course';
import '@/models/book';
import '@/models/users';
import PostArea from '@/models/area';
import { NextResponse } from 'next/server';
import authenticate from '@/utils/authenticate';
import { reloadCourse } from '@/data/actions/reload';
import { getDriveClient, createDriveFolder } from '@/function/drive/folder';

const PARENT_FOLDER_ID = process.env.DRIVE_COURSE_FOLDER_ID || '1Ri-Cl-R7Exl7vP6Qy8tDHtoiSqMXVmhf';

export async function POST(request) {
    try { 
        const { user, body } = await authenticate(request);
        if (!user) {
            return NextResponse.json({ status: 0, mes: 'Xác thực không thành công.' }, { status: 401 });
        }
        const isAdminOrAcademic = user.role.includes('Admin') || user.role.includes('Academic');
        if (!isAdminOrAcademic) {
            return NextResponse.json({ status: 0, mes: 'Bạn không có quyền thực hiện chức năng này.' }, { status: 403 });
        }
        const { code, Book, Area, TeacherHR, Status = false, Type = 'AI Robotic', Detail } = body;
        if (!code || !Book || !Area || !TeacherHR || !Detail || !Array.isArray(Detail)) {
            return NextResponse.json({ status: 1, mes: 'Thiếu thông tin khóa học' }, { status: 400 });
        }
        await connectDB();
        const roomNames = [...new Set(Detail.map(d => d.Room).filter(name => typeof name === 'string' && name.trim() !== ''))];
        const roomNameToIdMap = new Map();
        if (roomNames.length > 0) {
            const pipeline = [{ $unwind: '$rooms' }, { $match: { 'rooms.name': { $in: roomNames } } }, { $project: { _id: 0, name: '$rooms.name', roomId: '$rooms._id' } }];
            const foundRooms = await PostArea.aggregate(pipeline);
            
            foundRooms.forEach(room => roomNameToIdMap.set(room.name, room.roomId));
        }
        
        const yearPrefix = new Date().getFullYear().toString().slice(-2);
        const coursePrefix = `${yearPrefix}${code.trim().toUpperCase()}`;
        const lastCourse = await PostCourse.findOne({ ID: { $regex: `^${coursePrefix}` } }).sort({ ID: -1 }).select('ID').lean();
        let newSequence = 1;
        if (lastCourse) {
            const lastSeq = parseInt(lastCourse.ID.slice(coursePrefix.length), 10);
            newSequence = isNaN(lastSeq) ? 1 : lastSeq + 1;
        }
        const newCourseID = `${coursePrefix}${newSequence.toString().padStart(3, '0')}`;
        let imageUrls = [];
        try {
            const drive = getDriveClient();
            imageUrls = await Promise.all(
                Detail.map(d => createDriveFolder(drive, d.Day || `Buổi ${d.Topic}`, PARENT_FOLDER_ID))
            );
        } catch (driveError) {
            console.error('[DRIVE_FOLDER_ERROR]', driveError.message);
        }
        const normalizedDetail = Detail.map((d, i) => {
            if (!d.Topic || !mongoose.Types.ObjectId.isValid(d.Topic) || !d.Day) {
                throw new Error(`Buổi học thứ ${i + 1} thiếu Topic hoặc Day, hoặc ID không hợp lệ.`);
            }
            const roomId = d.Room ? roomNameToIdMap.get(d.Room.trim()) : null;
            
            return { Topic: d.Topic, Day: new Date(d.Day), Room: roomId || null, Time: d.Time || '', Teacher: mongoose.Types.ObjectId.isValid(d.Teacher) ? d.Teacher : null, TeachingAs: mongoose.Types.ObjectId.isValid(d.TeachingAs) ? d.TeachingAs : null, Image: imageUrls[i] || '' };
        });
        const newCourseData = { ID: newCourseID, Detail: normalizedDetail, Student: [], Version: 1 };
        if (Book && mongoose.Types.ObjectId.isValid(Book)) newCourseData.Book = Book;
        if (Area && mongoose.Types.ObjectId.isValid(Area)) newCourseData.Area = Area;
        if (TeacherHR && mongoose.Types.ObjectId.isValid(TeacherHR)) newCourseData.TeacherHR = TeacherHR;
        if (Type) newCourseData.Type = Type;
        if (typeof Status === 'boolean') newCourseData.Status = Status;
        const createdCourse = await PostCourse.create(newCourseData);
        reloadCourse()
        return NextResponse.json({ status: 2, mes: `Tạo khóa học ${newCourseID} thành công!`, data: createdCourse }, { status: 201 });
    } catch (error) {
        console.error('[COURSE_CREATE_ERROR]', error);
        return NextResponse.json({ status: 1, mes: error.message || 'Lỗi từ máy chủ.' }, { status: 500 });
    }
}