import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Status } from './src/models/index.js';

dotenv.config();

const addSpecs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: 'Tailoring_Kanban' });
        console.log('Connected to DB');

        const newStatuses = [
            { title: 'Fittings', value: 'fittings', order: 3 },
            { title: 'Ready for Pickup', value: 'ready', order: 4 }
        ];

        for (const s of newStatuses) {
            const exists = await Status.findOne({ value: s.value });
            if (!exists) {
                await Status.create(s);
                console.log(`Created: ${s.title}`);
            } else {
                console.log(`Exists: ${s.title}`);
            }
        }

        // Also update 'Done' to 'Completed' title if it exists to match Figma
        await Status.updateOne({ value: 'done' }, { title: 'Completed' });

        console.log('Done');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

addSpecs();
