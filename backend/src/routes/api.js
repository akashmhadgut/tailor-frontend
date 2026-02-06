import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    loginUser,
    getStatuses,
    createStatus,
    getOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    getCustomers,
    createCustomer,
    updateCustomer,
    getCustomerByPhone
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

// Customers
router.route('/customers')
    .get(protect, getCustomers)
    .post(protect, createCustomer);

router.patch('/customers/:id', protect, updateCustomer);
router.get('/customers/phone/:phone', protect, getCustomerByPhone);

export default router;
