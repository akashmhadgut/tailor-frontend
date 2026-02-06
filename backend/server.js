import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './src/db.js';
import apiRoutes from './src/routes/api.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import { User, Status } from './src/models/index.js';

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/upload', uploadRoutes);
app.use('/api', apiRoutes);

// Log registered routes (helps debug missing endpoints)
setTimeout(() => {
    try {
        const getRoutes = (stack) => {
            const routes = [];
            stack.forEach((layer) => {
                if (layer.route && layer.route.path) {
                    const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
                    routes.push(`${methods} ${layer.route.path}`);
                } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
                    layer.handle.stack.forEach((l) => {
                        if (l.route && l.route.path) {
                            const methods = Object.keys(l.route.methods).join(',').toUpperCase();
                            routes.push(`${methods} ${layer.regexp && layer.regexp.source ? layer.regexp.source.replace('^\\','').replace('\\/?(?=\\/|$)','') : ''}${l.route.path}`);
                        }
                    });
                }
            });
            return routes;
        };

        const routes = getRoutes(app._router.stack || []);
        console.log('Registered routes:');
        routes.forEach(r => console.log('  ' + r));
    } catch (err) {
        console.error('Failed to list routes', err);
    }
}, 500);

const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Seeder Route (for dev only)
app.post('/api/seed', async (req, res) => {
    try {
        // Check if admin exists
        const adminExists = await User.findOne({ email: 'admin@example.com' });
        if (!adminExists) {
            await User.create({
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'password123'
            });
        }

        // Check if statuses exist
        const statusCount = await Status.countDocuments();
        if (statusCount === 0) {
            await Status.insertMany([
                { title: 'New', value: 'new', order: 0 },
                { title: 'Stitching In Progress', value: 'stitching_in_progress', order: 1 },
                { title: 'Done', value: 'done', order: 2 }
            ]);
        }

        res.json({ message: 'Database seeded' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
