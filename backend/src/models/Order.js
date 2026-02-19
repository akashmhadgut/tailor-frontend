import mongoose from 'mongoose';

const orderSchema = mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    type: { type: String }, // Suit, Blouse etc
    quantity: { type: Number, default: 1 },
    status: { type: String, required: true }, // Store slug directly for simplicity or ObjectId ref
    deliveryDate: { type: String },
    paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
    notes: { type: String },
    tags: [{ type: String }], // Urgent, Delicate, etc.
    attachments: [{ type: String }] // File metadata/names
}, { timestamps: true });

orderSchema.index({ organization: 1, updatedAt: -1 }); // Default dashboard sort
orderSchema.index({ organization: 1, status: 1 });     // Status filtering
orderSchema.index({ orderId: 1, organization: 1 });    // Search by ID within org
orderSchema.index({ customerPhone: 1, organization: 1 }); // Search by Phone within org

const Order = mongoose.model('Order', orderSchema);
export default Order;
