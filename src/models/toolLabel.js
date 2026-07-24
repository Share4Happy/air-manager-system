import { Schema, model, models } from 'mongoose';

const toolLabelSchema = new Schema(
    { name: { type: String, required: true, trim: true } },
    { timestamps: true }
);

const ToolLabel = models.toolLabel || model('toolLabel', toolLabelSchema);
export default ToolLabel;
