import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' })
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};
