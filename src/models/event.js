import mongoose, { Schema } from 'mongoose';
const { model, models } = mongoose;

const AttachmentSchema = new Schema({
    fileId: { type: String, required: true },
    name: { type: String, default: '' },
    size: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const RoadmapNodeSchema = new Schema({
    id: { type: String, required: true },
    parentId: { type: String, default: null }, // null if root phase
    name: { type: String, required: true },
    description: { type: String, default: '' },
    assignee: { type: Schema.Types.Mixed, default: null }, // User ObjectId or Member ID or object
    assigneeName: { type: String, default: '' },
    assigneeType: { type: String, default: 'user' }, // 'user' or 'member'
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'overdue', 'blocked'],
        default: 'pending',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
    },
    order: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    attachments: [AttachmentSchema],
}, { _id: false });

const BudgetItemSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    category: {
        type: String,
        enum: ['venue', 'equipment', 'prizes', 'marketing', 'catering', 'logistics', 'other'],
        default: 'other',
    },
    estimatedCost: { type: Number, default: 0 },
    actualCost: { type: Number, default: 0 },
    note: { type: String, default: '' },
    isPaid: { type: Boolean, default: false },
    paidBy: { type: Schema.Types.Mixed, default: null }, // User ID, Member ID, or name
    payerName: { type: String, default: '' },
    receiptFileId: { type: String, default: null },
}, { _id: false });

const PhotoSchema = new Schema({
    fileId: { type: String, required: true },
    caption: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'user', default: null },
}, { _id: false });

const EventMemberSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, default: 'Thành viên' }, // e.g. Ban tổ chức, Trọng tài, Tình nguyện viên, Thí sinh, Khách mời, Cố vấn, Hậu cần, Phụ huynh...
    organization: { type: String, default: '' }, // Trường, Đơn vị, Lớp, Công ty
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    notes: { type: String, default: '' },
    isExternal: { type: Boolean, default: true },
    userId: { type: Schema.Types.ObjectId, ref: 'user', default: null },
    checkInStatus: { type: Boolean, default: false },
    checkInTime: { type: Date, default: null },
}, { _id: false });

const StationPhotoSchema = new Schema({
    fileId: { type: String, default: '' },
    url: { type: String, default: '' },
    caption: { type: String, default: '' },
}, { _id: false });

const StationSchema = new Schema({
    id: { type: String, required: true },
    order: { type: Number, default: 0 },
    name: { type: String, required: true }, // e.g. Khu vực 1: Trải nghiệm lắp ráp
    category: {
        type: String,
        enum: ['assembly', 'coding', 'control', 'competition', 'reward', 'showcase', 'custom'],
        default: 'assembly',
    },
    tagColor: { type: String, default: 'blue' }, // 'blue', 'purple', 'emerald', 'amber', 'rose', 'indigo'
    location: { type: String, default: '' }, // Sân trường, Phòng máy, Sảnh A
    lead: { type: Schema.Types.Mixed, default: null }, // User ObjectId or Member ID
    leadName: { type: String, default: '' },
    staffList: [{ type: Schema.Types.Mixed }], // Array of User IDs or Member IDs
    equipmentList: [{ type: String }], // Mô hình & Thiết bị

    // Content details for AI Robotic side
    centerContent: {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        models: [{ type: String }], // Mô hình: Robot cú mèo, Robot chó...
    },

    // Coordination with School / Partner side
    partnerContent: {
        partnerName: { type: String, default: '' }, // Trường TH Hoà Bình
        description: { type: String, default: '' }, // Điều phối học sinh, bàn ghế...
        studentGroupInfo: { type: String, default: '' }, // Nhóm 10-15 em
    },

    photos: [StationPhotoSchema],
    notes: { type: String, default: '' },
}, { _id: false });

const StationRoundMappingSchema = new Schema({
    groupName: { type: String, default: '' }, // Lớp 3A1, Khối 4...
    stationId: { type: String, default: '' },
}, { _id: false });

const StationRoundSchema = new Schema({
    id: { type: String, required: true },
    roundName: { type: String, default: '' }, // Ca 1, Ca 2...
    timeSlot: { type: String, default: '' }, // 08:00 - 08:45
    mappings: [StationRoundMappingSchema],
    notes: { type: String, default: '' },
}, { _id: false });

const PassportRulesSchema = new Schema({
    enabled: { type: Boolean, default: true },
    requiredStamps: { type: Number, default: 3 },
    rewardDescription: { type: String, default: 'Phiếu giảm giá khóa học AI Robotic, bánh kẹo, quà lưu niệm, sticker...' },
    notes: { type: String, default: 'Các bạn học sinh tham gia các khu vực để lấy con dấu, đủ 3 dấu sẽ nhận quà.' },
}, { _id: false });

const RelatedMediaLinkSchema = new Schema({
    id: { type: String, required: true },
    title: { type: String, required: true }, // e.g. "Bài viết tổng kết trên Fanpage Trường"
    platform: { type: String, default: 'facebook' }, // 'facebook', 'zalo', 'website', 'tiktok', 'youtube', 'news', 'other'
    url: { type: String, required: true },
    note: { type: String, default: '' },
    postedAt: { type: Date, default: null },
}, { _id: false });

const MediaDriveLinkSchema = new Schema({
    id: { type: String, required: true },
    title: { type: String, required: true }, // e.g. "Ảnh máy cơ", "Flycam & Video sự kiện"
    url: { type: String, required: true },
    description: { type: String, default: '' },
}, { _id: false });

const EquipmentItemSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    category: {
        type: String,
        enum: ['robot_model', 'kit', 'electronics', 'laptop_screen', 'tools', 'banner_props', 'other'],
        default: 'robot_model',
    },
    quantity: { type: Number, default: 1 },
    unit: { type: String, default: 'Bộ' },
    assignedStation: { type: String, default: '' }, // Tên Trạm hoặc Khu vực sử dụng
    assignee: { type: Schema.Types.Mixed, default: null }, // User ID hoặc Member ID
    assigneeName: { type: String, default: '' },
    isPacked: { type: Boolean, default: false }, // Đã chuẩn bị / Đóng gói
    packedAt: { type: Date, default: null },
    isReturned: { type: Boolean, default: false }, // Đã thu hồi sau sự kiện
    returnedAt: { type: Date, default: null },
    condition: { type: String, default: 'Tốt' }, // 'Tốt', 'Cần sạc', 'Thiếu phụ kiện', 'Hỏng'
    notes: { type: String, default: '' },
}, { _id: false });

const ShareConfigSchema = new Schema({
    isPublic: { type: Boolean, default: false },
    shareToken: { type: String, default: null },
    pinCode: { type: String, default: '' },
    allowedTabs: {
        roadmap: { type: Boolean, default: true },
        stations: { type: Boolean, default: true },
        equipment: { type: Boolean, default: true },
        staff: { type: Boolean, default: true },
        media: { type: Boolean, default: true },
        budget: { type: Boolean, default: false },
        retro: { type: Boolean, default: false },
    },
    expiresAt: { type: Date, default: null },
}, { _id: false });

const EventSchema = new Schema({
    title: { type: String, required: true },
    code: { type: String, default: '' }, // e.g. EVT-2026-ROBOTIC
    type: {
        type: String,
        enum: ['competition', 'workshop', 'showcase', 'internal', 'other'],
        default: 'competition',
    },
    status: {
        type: String,
        enum: ['planning', 'upcoming', 'happening', 'completed', 'cancelled'],
        default: 'planning',
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    location: { type: String, default: '' },
    description: { type: String, default: '' },
    coverImage: { type: String, default: null }, // Drive fileId

    lead: { type: Schema.Types.ObjectId, ref: 'user', default: null },
    organizers: [{ type: Schema.Types.ObjectId, ref: 'user' }],
    members: [EventMemberSchema],

    driveFolderId: { type: String, default: null },

    roadmap: [RoadmapNodeSchema],
    stations: [StationSchema],
    stationPhaseId: { type: String, default: null }, // Phase ID where station branches are attached in roadmap tree
    stationSchedule: {
        rounds: [StationRoundSchema],
        notes: { type: String, default: '3 khu vực sẽ được diễn ra cùng 1 thời điểm xoay tua giữa các hoạt động.' },
    },
    passportRules: {
        type: PassportRulesSchema,
        default: () => ({}),
    },

    equipmentChecklist: [EquipmentItemSchema],

    budget: {
        totalAllocated: { type: Number, default: 0 },
        items: [BudgetItemSchema],
        notes: { type: String, default: '' },
    },

    media: {
        photos: [PhotoSchema],
        driveFolderUrl: { type: String, default: '' },
        additionalDriveLinks: [MediaDriveLinkSchema],
        relatedPosts: [RelatedMediaLinkSchema],
        notes: { type: String, default: '' },
    },

    participantsCount: { type: Number, default: 0 },
    targetAudience: { type: String, default: '' },

    summaryReport: {
        overview: { type: String, default: '' },
        achievements: { type: String, default: '' },
        challenges: { type: String, default: '' },
        lessonsLearned: { type: String, default: '' },
        finalAttendeeCount: { type: Number, default: 0 },
        completedAt: { type: Date, default: null },
    },

    shareConfig: {
        type: ShareConfigSchema,
        default: () => ({}),
    },

    createdBy: { type: Schema.Types.ObjectId, ref: 'user', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'user', default: null },
}, { timestamps: true });

EventSchema.index({ status: 1 });
EventSchema.index({ startDate: 1 });
EventSchema.index({ lead: 1 });
EventSchema.index({ 'shareConfig.shareToken': 1 });

if (models.Event) {
    delete models.Event;
}
const Event = models.Event || model('Event', EventSchema);

export default Event;
