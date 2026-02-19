import mongoose from 'mongoose';

const statusSchema = mongoose.Schema({
    title: { type: String, required: true },
    value: { type: String, required: true }, // Not unique globally anymore
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    order: { type: Number, default: 0 }
});

const Status = mongoose.model('Status', statusSchema);
export default Status;
