import mongoose, { Schema } from 'mongoose';
const { model, models } = mongoose;

const TemplateNodeSchema = new Schema({
    id: { type: String, required: true },
    parentId: { type: String, default: null },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
    },
    relativeDaysStart: { type: Number, default: -30 }, // Days relative to D-Day
    relativeDaysDue: { type: Number, default: -7 },
    order: { type: Number, default: 0 },
}, { _id: false });

const TemplateBudgetItemSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    category: {
        type: String,
        enum: ['venue', 'equipment', 'prizes', 'marketing', 'catering', 'logistics', 'other'],
        default: 'other',
    },
    defaultEstimatedCost: { type: Number, default: 0 },
    note: { type: String, default: '' },
}, { _id: false });

const EventTemplateSchema = new Schema({
    name: { type: String, required: true },
    code: { type: String, default: '' },
    type: {
        type: String,
        enum: ['competition', 'workshop', 'showcase', 'internal', 'other'],
        default: 'competition',
    },
    description: { type: String, default: '' },
    icon: { type: String, default: 'trophy' },
    isDefault: { type: Boolean, default: false },

    roadmapNodes: [TemplateNodeSchema],
    budgetItems: [TemplateBudgetItemSchema],

    createdBy: { type: Schema.Types.ObjectId, ref: 'user', default: null },
}, { timestamps: true });

const EventTemplate = models.EventTemplate || model('EventTemplate', EventTemplateSchema);

export default EventTemplate;
