import mongoose, { Schema } from 'mongoose';
const { model, models } = mongoose;

const EventTagSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Tên thẻ không được để trống'],
            trim: true,
            unique: true,
        },
        color: {
            type: String,
            default: '#059669', // Emerald
        },
        bg: {
            type: String,
            default: '#ecfdf5',
        },
        textColor: {
            type: String,
            default: '#047857',
        },
        borderColor: {
            type: String,
            default: '#a7f3d0',
        },
        description: {
            type: String,
            default: '',
            trim: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'users',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const EventTag = models.eventTag || model('eventTag', EventTagSchema);
export default EventTag;
