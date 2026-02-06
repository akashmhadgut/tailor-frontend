import { Customer } from '../models/index.js';

export const getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find({}).sort({ createdAt: -1 });
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

        const existing = await Customer.findOne({ phone });
        if (existing) {
            return res.status(400).json({ message: 'Phone number already exists' });
        }

        const customer = await Customer.create({ name, phone, address });
        res.status(201).json(customer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
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
        const customer = await Customer.findById(req.params.id);
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
        const customer = await Customer.findOne({ phone });
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
