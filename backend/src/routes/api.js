import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    loginUser,
    getStatuses,
    createStatus,
    getOrders,
    createOrder,
    updateOrder,
    deleteOrder
} from '../controllers/index.js';

const router = express.Router();

// Auth
router.post('/auth/login', loginUser);

// Statuses
router.get('/statuses', protect, getStatuses);
router.post('/statuses', protect, createStatus);

// Orders
router.route('/orders')
    .get(protect, getOrders)
    .post(protect, createOrder);

router.route('/orders/:id')
    .patch(protect, updateOrder)
    .delete(protect, deleteOrder);

export default router;
