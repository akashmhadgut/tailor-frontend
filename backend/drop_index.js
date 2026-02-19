import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Status from './src/models/Status.js';
import Customer from './src/models/Customer.js';

dotenv.config();

const cleanStatuses = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Drop the problematic index
        console.log('Dropping existing status indexes...');
        await Status.collection.dropIndexes();

        console.log('Dropping existing customer phone index...');
        try {
            await Customer.collection.dropIndex('phone_1');
        } catch (e) {
            console.log("Customer phone index might not exist or already dropped:", e.message);
        }

        console.log('Indexes dropped successfully');

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

cleanStatuses();
