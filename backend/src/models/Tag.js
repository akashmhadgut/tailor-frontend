import mongoose from 'mongoose';

const tagSchema = mongoose.Schema({
    name: { type: String, required: true },
    color: { type: String, default: '#808080' }, // Hex color for UI
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }
}, { timestamps: true });

const Tag = mongoose.model('Tag', tagSchema);
export default Tag;
