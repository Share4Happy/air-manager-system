import { Schema, model, models } from 'mongoose';

const toolLabelSchema = new Schema(
    { name: { type: String, required: true, trim: true }, color: { type: String, default: '#6366f1' } },
    { timestamps: true }
);

const ToolLabel = models.toolLabel || model('toolLabel', toolLabelSchema);
export default ToolLabel;
