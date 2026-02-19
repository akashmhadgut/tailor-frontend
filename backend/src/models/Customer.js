import mongoose from 'mongoose';

const customerSchema = mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true }, // Not unique globally anymore
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    address: { type: String },
    notes: { type: String }
}, { timestamps: true });

customerSchema.index({ organization: 1, phone: 1 }, { unique: true }); // Prevent duplicates per org
customerSchema.index({ organization: 1, name: 1 });                    // Search by name

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
