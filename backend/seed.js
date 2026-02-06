import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Status, Order } from './src/models/index.js';

dotenv.config();

const run = async () => {
    console.log('Script started.');
    console.log('URI:', process.env.MONGO_URI);

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'Tailoring_Kanban',
            serverSelectionTimeoutMS: 5000 // 5s timeout
        });
        console.log('Connected to MongoDB.');

        // 1. Seed Admin
        const adminEmail = 'admin@example.com';
        const adminExists = await User.findOne({ email: adminEmail });

        if (!adminExists) {
            console.log('Admin not found. Creating...');
            const user = await User.create({
                name: 'Admin User',
                email: adminEmail,
                password: 'password123'
            });
            console.log('Admin User created:', user.email);
        } else {
            console.log('Admin User already exists.');
        }

        // 2. Seed Statuses
        const statusCount = await Status.countDocuments();
        if (statusCount === 0) {
            console.log('Creating statuses...');
            await Status.insertMany([
                { title: 'New', value: 'new', order: 0 },
                { title: 'Stitching In Progress', value: 'stitching_in_progress', order: 1 },
                { title: 'Completed', value: 'done', order: 2 },
                { title: 'Fittings', value: 'fittings', order: 3 },
                { title: 'Ready for Pickup', value: 'ready', order: 4 }
            ]);
            console.log('Statuses created.');
        } else {
            console.log('Statuses already exist.');
        }

        // 3. Seed Orders
        const orderCount = await Order.countDocuments();
        if (orderCount === 0) {
            console.log('Creating dummy orders...');
            await Order.insertMany([
                {
                    orderId: 'ORD-1001',
                    customerName: 'Akash Sharma',
                    type: 'Business Suit',
                    quantity: 1,
                    status: 'new',
                    deliveryDate: '2025-12-20',
                    paymentStatus: 'Paid',
                    notes: 'Navy blue, slim fit. Measurements on file.',
                    tags: ['Urgent', 'VIP Customer']
                },
                {
                    orderId: 'ORD-1002',
                    customerName: 'Priya Verma',
                    type: 'Silk Blouse',
                    quantity: 2,
                    status: 'stitching_in_progress',
                    deliveryDate: '2025-12-22',
                    paymentStatus: 'Pending',
                    notes: 'Golden embroidery required on sleeves.',
                    tags: ['Delicate']
                },
                {
                    orderId: 'ORD-1003',
                    customerName: 'Rahul Khanna',
                    type: 'Kurta Pajama',
                    quantity: 3,
                    status: 'done',
                    deliveryDate: '2025-12-18',
                    paymentStatus: 'Paid',
                    notes: 'Urgent delivery requested.',
                    tags: ['Urgent', 'Repair']
                },
                {
                    orderId: 'ORD-1004',
                    customerName: 'Sneha Gupta',
                    type: 'Lehenga Choli',
                    quantity: 1,
                    status: 'new',
                    deliveryDate: '2026-01-05',
                    paymentStatus: 'Pending',
                    notes: 'Bridal wear - extra care needed.',
                    tags: ['Extra Attention', 'Delicate']
                },
                {
                    orderId: 'ORD-1005',
                    customerName: 'Vikram Singh',
                    type: 'Sherwani',
                    quantity: 1,
                    status: 'stitching_in_progress',
                    deliveryDate: '2025-12-25',
                    paymentStatus: 'Paid',
                    notes: 'Gold buttons to be attached.',
                    tags: ['VIP Customer']
                }
            ]);
            console.log('Dummy orders created.');
        } else {
            console.log('Orders already exist. Skipping seed.');
        }

        console.log('Seeding complete.');
        process.exit(0);

    } catch (error) {
        console.error('CRITICAL ERROR:', error.message);
        process.exit(1);
    }
};

run();
