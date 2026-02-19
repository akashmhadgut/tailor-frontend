import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Organization, Status, Order, Customer, Tag } from './src/models/index.js';

console.log("Beginning seed script execution...");

dotenv.config();

console.log("Environment loaded. Mongo URI exists?", !!process.env.MONGO_URI);

const connectDB = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(`Error connecting to DB: ${error.message}`);
        process.exit(1);
    }
};

const seedPilot = async () => {
    await connectDB();

    try {
        // Clear existing data (optional, but good for clean slate)
        console.log('Cleaning database...');
        await User.deleteMany({});
        await Organization.deleteMany({});
        await Status.deleteMany({});
        await Order.deleteMany({});
        await Customer.deleteMany({});
        await Tag.deleteMany({});

        const shops = [];

        // Create 5 Pilot Shops
        const indianShops = [
            ['Royal Tailors', 'Connaught Place, Delhi'],
            ['Fashion Hub', 'Bandra West, Mumbai'],
            ['Sarees & Suits', 'T. Nagar, Chennai'],
            ['Elegance Boutique', 'Koramangala, Bangalore'],
            ['Modern Stitch', 'Banjara Hills, Hyderabad']
        ];

        for (let i = 0; i < 5; i++) {
            const [shopName, shopAddress] = indianShops[i];


            // 1. Create Organization
            const org = await Organization.create({
                name: shopName,
                type: 'tailor',
                address: shopAddress,
                phone: `987654320${i + 1}`
            });

            // 2. Create Owner User
            const user = await User.create({
                name: `Owner of ${shopName}`,
                email: `owner${i + 1}@tailor.com`,
                password: 'password123', // Will be hashed by pre-save hook
                organization: org._id,
                role: 'owner'
            });

            // Link user back to org owner (optional but good practice)
            org.owner = user._id;
            await org.save();

            // 3. Create Statuses for this specific Organization
            const defaultStatuses = [
                { title: 'New', value: 'new', order: 0 },
                { title: 'Stitching In Progress', value: 'stitching_in_progress', order: 1 },
                { title: 'Completed', value: 'completed', order: 2 },
                { title: 'Fittings', value: 'fittings', order: 3 },
                { title: 'Ready for Pickup', value: 'ready_for_pickup', order: 4 }
            ];

            const statusDocs = defaultStatuses.map(s => ({
                ...s,
                organization: org._id
            }));

            await Status.insertMany(statusDocs);

            // 4. Create Tags for this Organization
            const defaultTags = [
                { name: 'Delicate', color: '#a855f7' },       // Purple
                { name: 'Urgent', color: '#ef4444' },         // Red
                { name: 'Extra Attention', color: '#f97316' },// Orange
                { name: 'Alteration', color: '#3b82f6' }      // Blue
            ];

            const tagDocs = defaultTags.map(t => ({
                ...t,
                organization: org._id
            }));

            await Tag.insertMany(tagDocs);

            // 5. Create Dummy Customers for this Organization
            // 5. Create Dummy Customers for this Organization
            // 5. Create Dummy Customers for this Organization
            const indianNames = [
                ['Aarav Patel', 'Mumbai, Maharashtra'],
                ['Vivaan Singh', 'Delhi, Delhi'],
                ['Aditya Sharma', 'Bangalore, Karnataka'],
                ['Vihaan Gupta', 'Hyderabad, Telangana'],
                ['Arjun Kumar', 'Chennai, Tamil Nadu'],
                ['Sai Reddy', 'Pune, Maharashtra'],
                ['Reyansh Joshi', 'Jaipur, Rajasthan'],
                ['Muhammad Khan', 'Lucknow, Uttar Pradesh'],
                ['Ishaan Verma', 'Ahmedabad, Gujarat'],
                ['Shaurya Malhotra', 'Chandigarh, Punjab'],
                ['Rohan Das', 'Kolkata, West Bengal'],
                ['Kabir Shah', 'Surat, Gujarat'],
                ['Ananya Iyer', 'Chennai, Tamil Nadu'],
                ['Diya Menon', 'Kochi, Kerala'],
                ['Saanvi Rao', 'Hyderabad, Telangana'],
                ['Aadhya Nair', 'Thiruvananthapuram, Kerala'],
                ['Kiara Kaur', 'Amritsar, Punjab'],
                ['Myra Singh', 'Jaipur, Rajasthan'],
                ['Pari Agarwal', 'Indore, Madhya Pradesh'],
                ['Fatima Sheikh', 'Mumbai, Maharashtra']
            ];

            const defaultCustomers = [];
            // Pick 5 random customers for this shop
            for (let k = 0; k < 5; k++) {
                const randomIdx = Math.floor(Math.random() * indianNames.length);
                const [name, city] = indianNames[randomIdx];
                defaultCustomers.push({
                    name: name,
                    // Generate realistic Indian mobile numbers (starting with 6-9)
                    phone: `${Math.floor(6 + Math.random() * 4)}${Math.floor(100000000 + Math.random() * 900000000)}`,
                    address: `Flat ${Math.floor(Math.random() * 100) + 1}, ${city}`
                });
            }

            // Insert customers and get their IDs
            const createdCustomers = await Customer.insertMany(defaultCustomers.map(c => ({
                ...c,
                organization: org._id
            })));

            // 6. Create Dummy Orders for this Organization
            const orderStatuses = ['new', 'stitching_in_progress', 'completed', 'fittings', 'ready_for_pickup'];
            const paymentStatuses = ['Pending', 'Paid'];
            const dressTypes = ['Suit', 'Sherwani', 'Kurta', 'Trouser', 'Shirt'];

            const orders = [];

            // Create 3 orders per customer
            for (const customer of createdCustomers) {
                for (let j = 0; j < 3; j++) {
                    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
                    const payment = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
                    const dress = dressTypes[Math.floor(Math.random() * dressTypes.length)];

                    // Random date within last 30 days
                    const date = new Date();
                    date.setDate(date.getDate() - Math.floor(Math.random() * 30));

                    orders.push({
                        orderId: `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
                        customer: customer._id,
                        customerName: customer.name,
                        customerPhone: customer.phone,
                        customerAddress: customer.address,
                        type: dress,
                        quantity: 1,
                        status: status,
                        paymentStatus: payment,
                        deliveryDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(), // 7 days from now
                        notes: `Sample note for ${dress}`,
                        tags: [], // Could add tags here if needed, but keeping simple for now
                        organization: org._id,
                        createdAt: date,
                        updatedAt: date
                    });
                }
            }

            await Order.insertMany(orders);

            shops.push({
                shopName: org.name,
                email: user.email,
                password: 'password123',
                customerCount: createdCustomers.length,
                orderCount: orders.length
            });

            console.log(`Created: ${org.name} with Owner: ${user.email}`);
        }

        console.log('\n--- PILOT DATA SEEDED SUCCESSFULLY ---');
        console.table(shops);

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedPilot();
