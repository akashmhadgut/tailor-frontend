import { Order } from '../models/index.js';

export const getOrders = async (req, res) => {
    const { search, status, date, customer } = req.query;
    let query = {};

    if (search) {
        query.$or = [
            { orderId: { $regex: search, $options: 'i' } },
            { customerName: { $regex: search, $options: 'i' } },
            { customerPhone: { $regex: search, $options: 'i' } }
        ];
    }

    if (status && status !== 'all') {
        query.status = status;
    }

    // Filter by customer id if provided
    if (customer) {
        query.customer = customer;
    }

    if (date) {
        query.deliveryDate = date;
    }

    try {
        const orders = await Order.find(query).sort({ updatedAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createOrder = async (req, res) => {
    try {
        const order = await Order.create(req.body);
        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update fields
        Object.assign(order, req.body);
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        await order.deleteOne();
        res.json({ message: 'Order removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
