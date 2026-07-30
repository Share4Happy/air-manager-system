import { Schema, model, models } from 'mongoose';

const DriveFileSizeSchema = new Schema({
    fileId: { type: String, required: true, unique: true },
    size: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
});

const DriveFileSize = models.driveFileSize || model('driveFileSize', DriveFileSizeSchema);

export default DriveFileSize;
