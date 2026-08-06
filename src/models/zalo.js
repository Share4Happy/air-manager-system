import { Schema, model, models } from "mongoose";

const ZaloAccountSchema = new Schema(
    {
        botId: { type: String, trim: true },
        uid: { type: String, trim: true },
        name: { type: String, required: true, trim: true },
        phone: { type: String },
        avt: { type: String },
        rateLimitPerHour: { type: Number, required: true, default: 30 },
        is_active: { type: Boolean, default: true },
        action: { type: [{ type: Schema.Types.ObjectId, ref: 'scheduledjob' }], default: [] },
        roles: {
            type: [{ type: Schema.Types.ObjectId, ref: 'user' }],
            default: []
        },
        proxy: { type: String, default: '' },
    },
    { timestamps: true },
);

const ZaloAccount =
    models.zaloaccount || model("zaloaccount", ZaloAccountSchema);

export default ZaloAccount;
