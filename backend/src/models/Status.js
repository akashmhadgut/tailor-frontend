import mongoose from 'mongoose';

const statusSchema = mongoose.Schema({
    title: { type: String, required: true },
    value: { type: String, required: true, unique: true }, // Slug
    order: { type: Number, default: 0 }
});

const Status = mongoose.model('Status', statusSchema);
export default Status;
