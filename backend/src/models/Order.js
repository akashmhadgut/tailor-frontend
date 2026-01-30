import mongoose from 'mongoose';

const orderSchema = mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
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

const Order = mongoose.model('Order', orderSchema);
export default Order;
