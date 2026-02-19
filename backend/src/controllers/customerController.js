import { Customer } from '../models/index.js';

export const getCustomers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const customers = await Customer.find({ organization: req.user.organization })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createCustomer = async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ message: 'Name and phone are required' });
        }

        const existing = await Customer.findOne({
            phone,
            organization: req.user.organization
        });
        if (existing) {
            return res.status(400).json({ message: 'Phone number already exists' });
        }

        const customer = await Customer.create({
            name,
            phone,
            address,
            organization: req.user.organization
        });
        res.status(201).json(customer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findOne({
            _id: req.params.id,
            organization: req.user.organization
        });
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        Object.assign(customer, req.body);
        const updated = await customer.save();
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findOne({
            _id: req.params.id,
            organization: req.user.organization
        });
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        await customer.deleteOne();
        res.json({ message: 'Customer removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCustomerByPhone = async (req, res) => {
    try {
        const { phone } = req.params;
        const customer = await Customer.findOne({
            phone,
            organization: req.user.organization
        });
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
