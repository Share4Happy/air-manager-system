import { Schema, model, models } from 'mongoose';

const DriveStorageConfigSchema = new Schema({
    isActive: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
    scanTime: { type: String, default: '03:00' },
    weekday: { type: Number, default: 1 }, // 1 = Thứ 2 ... 7 = Chủ nhật
    monthDay: { type: Number, default: 1 }, // 1 - 31
    areas: { type: [{ type: Schema.Types.ObjectId, ref: 'area' }], default: [] }, // Mảng ID khu vực, rỗng = tất cả khu vực
    nextRunAt: { type: Date, default: null },
    lastRunAt: { type: Date, default: null },
    lastRunStats: {
        totalFiles: { type: Number, default: 0 },
        updatedFiles: { type: Number, default: 0 },
        durationMs: { type: Number, default: 0 },
        status: { type: String, default: 'idle' },
        error: { type: String, default: '' },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'user' },
}, { timestamps: true });

const DriveStorageConfig = models.driveStorageConfig || model('driveStorageConfig', DriveStorageConfigSchema);

export default DriveStorageConfig;
