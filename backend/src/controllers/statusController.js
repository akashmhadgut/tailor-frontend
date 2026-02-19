import { Status } from '../models/index.js';

export const getStatuses = async (req, res) => {
    try {
        const statuses = await Status.find({ organization: req.user.organization }).sort({ order: 1 });
        res.json(statuses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createStatus = async (req, res) => {
    const { title, value } = req.body;
    try {
        const count = await Status.countDocuments({ organization: req.user.organization });
        const status = await Status.create({
            title,
            value,
            order: count,
            organization: req.user.organization
        });
        res.status(201).json(status);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
