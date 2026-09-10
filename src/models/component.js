import mongoose, { Schema } from 'mongoose';
const { model, models } = mongoose;

const transactionSchema = new Schema(
    {
        type: {
            type: String,
            enum: ['import', 'export', 'adjust', 'damaged', 'lost'],
            required: true
        },
        quantityChange: { type: Number, required: true },
        quantityAfter: { type: Number, required: true },
        reason: { type: String, default: '' },
        className: { type: String, default: '' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
        creatorName: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now }
    },
    { _id: true }
);

const componentSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        code: { type: String, trim: true, default: '' },
        category: {
            type: String,
            enum: [
                'vi_dieu_khien',
                'cam_bien',
                'dong_co',
                'module',
                'nguon_pin',
                'khung_co_khi',
                'day_noi',
                'dung_cu',
                'khac'
            ],
            default: 'khac'
        },
        quantity: { type: Number, default: 0, min: 0 },
        minQuantity: { type: Number, default: 5, min: 0 },
        unit: { type: String, default: 'Cái', trim: true },
        location: { type: String, default: '', trim: true },
        unitPrice: { type: Number, default: 0, min: 0 },
        supplier: { type: String, default: '', trim: true },
        datasheetUrl: { type: String, default: '', trim: true },
        imageUrl: { type: String, default: '', trim: true },
        status: {
            type: String,
            enum: ['in_stock', 'low_stock', 'out_of_stock', 'discontinued'],
            default: 'in_stock'
        },
        description: { type: String, default: '' },
        tags: [{ type: String, trim: true }],
        history: [transactionSchema]
    },
    { timestamps: true }
);

// Auto compute status before saving if not discontinued
componentSchema.pre('save', function (next) {
    if (this.status !== 'discontinued') {
        if (this.quantity <= 0) {
            this.status = 'out_of_stock';
        } else if (this.quantity <= this.minQuantity) {
            this.status = 'low_stock';
        } else {
            this.status = 'in_stock';
        }
    }
    next();
});

const Component = models.component || model('component', componentSchema);
export default Component;
