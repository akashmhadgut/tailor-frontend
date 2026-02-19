import mongoose from 'mongoose';

const organizationSchema = mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['tailor', 'garage', 'institute'], default: 'tailor' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional initially, linked after user creation
    address: { type: String },
    phone: { type: String }
}, { timestamps: true });

const Organization = mongoose.model('Organization', organizationSchema);
export default Organization;
