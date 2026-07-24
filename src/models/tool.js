import { Schema, model, models } from 'mongoose';

const toolSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        desc: { type: String, default: '' },
        link: { type: String, default: '' },
        labels: [{ type: Schema.Types.ObjectId, ref: 'toolLabel' }]
    },
    { timestamps: true }
);

const Tool = models.tool || model('tool', toolSchema);
export default Tool;
