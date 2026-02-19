import { Tag } from '../models/index.js';

export const getTags = async (req, res) => {
    try {
        const tags = await Tag.find({ organization: req.user.organization }).sort({ name: 1 });
        res.json(tags);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
