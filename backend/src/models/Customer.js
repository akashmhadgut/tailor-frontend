import mongoose from 'mongoose';

const customerSchema = mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    address: { type: String },
    notes: { type: String }
}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
