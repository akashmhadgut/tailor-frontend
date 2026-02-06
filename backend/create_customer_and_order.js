import axios from 'axios';

const BASE = process.env.BASE_URL || 'http://localhost:5000';
const ADMIN = { email: 'admin@example.com', password: 'password123' };

async function run() {
  try {
    console.log('Logging in...');
    const login = await axios.post(`${BASE}/api/auth/login`, ADMIN);
    const token = login.data.token;
    if (!token) throw new Error('No token');
    console.log('Got token');
    const client = axios.create({ baseURL: `${BASE}/api`, headers: { Authorization: `Bearer ${token}` } });

    // Create customer
    const cust = { name: 'AUTO_TEST_USER', phone: '999000' + Math.floor(Math.random()*9000+1000), address: 'Auto Address' };
    console.log('Creating customer...', cust.phone);
    const createdCust = await client.post('/customers', cust);
    console.log('Created customer id:', createdCust.data._id);

    // Create order linked to customer
    const orderPayload = {
      orderId: 'AUTO-' + Date.now(),
      customer: createdCust.data._id,
      customerName: createdCust.data.name,
      type: 'Test Item',
      quantity: 1,
      status: 'new',
      deliveryDate: new Date().toISOString().slice(0,10),
      paymentStatus: 'Pending',
      notes: 'Created by automated script',
      tags: ['AutoTest']
    };

    console.log('Creating order', orderPayload.orderId);
    const createdOrder = await client.post('/orders', orderPayload);
    console.log('Created order id:', createdOrder.data._id);

    // Fetch orders for customer
    console.log('Fetching orders for customer...');
    const res = await client.get(`/orders`, { params: { customer: createdCust.data._id } });
    console.log('Orders count for customer =', res.data.length);
    res.data.forEach(o => console.log(' -', o.orderId, o._id));

    process.exit(0);
  } catch (err) {
    if (err.response) {
      console.error('Error status', err.response.status, err.response.data);
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

run();
