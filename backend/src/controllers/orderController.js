import { Order } from '../models/index.js';

export const getOrders = async (req, res) => {
    const { search, status, date, customer, page, limit } = req.query;
    let query = { organization: req.user.organization };

    if (search) {
        // Optimized search:
        // 1. Order ID: strict prefix match (users usually type 'ORD-...')
        // 2. Phone: strict prefix match (users type '987...')
        // 3. Name: flexible regex (users might type part of name)

        const isNumeric = /^\d+$/.test(search);
        const isOrderId = search.toUpperCase().startsWith('ORD');

        if (isNumeric) {
            // Likely a phone number or order sequence number
            query.$or = [
                { customerPhone: { $regex: `^${search}`, $options: 'i' } }, // Index friendly prefix search
                { orderId: { $regex: search, $options: 'i' } } // Fallback for ID (e.g. searching '559' in 'ORD-559...')
            ];
        } else if (isOrderId) {
            // Definitely an Order ID
            query.orderId = { $regex: `^${search}`, $options: 'i' };
        } else {
            // Likely a name
            query.$or = [
                { customerName: { $regex: search, $options: 'i' } },
                { orderId: { $regex: search, $options: 'i' } } // Just in case
            ];
        }
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

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20; // Default to 20 to improve performance
    const skip = (pageNum - 1) * limitNum;

    try {
        const orders = await Order.find(query)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limitNum);

        // Optional: Send total count in header if needed for frontend pagination later
        // const total = await Order.countDocuments(query);
        // res.set('X-Total-Count', total);

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createOrder = async (req, res) => {
    try {
        const order = await Order.create({ ...req.body, organization: req.user.organization });
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
