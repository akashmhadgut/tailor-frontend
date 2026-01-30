import express from 'express';
import multer from 'multer';
import path from 'path';

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Verify Cloudinary Config
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

if (!isCloudinaryConfigured) {
    console.error('❌ Cloudinary environment variables are missing!');
} else {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

let upload;
try {
    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'tailor-uploads',
            allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'doc', 'docx', 'webp'],
        },
    });
    upload = multer({ storage: storage });
} catch (error) {
    console.error("Failed to initialize Cloudinary storage:", error);
}

router.post('/', (req, res) => {
    if (!isCloudinaryConfigured) {
        return res.status(500).json({
            message: 'Server Configuration Error',
            error: 'Cloudinary environment variables are not configured on the server.'
        });
    }

    if (!upload) {
        return res.status(500).json({
            message: 'Upload Service Error',
            error: 'Upload service failed to initialize.'
        });
    }

    upload.array('files', 5)(req, res, (err) => {
        if (err) {
            console.error('Upload Error Details:', err);
            // Handle Multer specific errors
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    message: 'Upload validation failed',
                    error: err.message
                });
            }
            // Handle Cloudinary or other errors
            return res.status(500).json({
                message: 'Image upload failed',
                error: err.message || 'Unknown error occurred during upload'
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded.' });
        }

        const filePaths = req.files.map(file => file.path);
        res.json(filePaths);
    });
});

export default router;
