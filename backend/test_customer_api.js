import axios from 'axios';

// Usage: node test_customer_api.js
// Ensure the backend is running locally on PORT (default 5000)

const BASE = process.env.BASE_URL || 'http://localhost:5000';
const ADMIN = { email: 'admin@example.com', password: 'password123' };

async function run() {
  try {
    console.log('Logging in...');
    const login = await axios.post(`${BASE}/api/auth/login`, ADMIN);
    const token = login.data.token;
    console.log('Got token:', !!token);

    const client = axios.create({ baseURL: `${BASE}/api`, headers: { Authorization: `Bearer ${token}` } });

    console.log('Fetching /customers (should be empty or list)...');
    const res1 = await client.get('/customers');
    console.log('GET /customers status', res1.status, 'count =', Array.isArray(res1.data) ? res1.data.length : typeof res1.data);

    console.log('Creating test customer...');
    const newCust = { name: 'TEST_USER', phone: '9990001112', address: 'Test Address' };
    const created = await client.post('/customers', newCust);
    console.log('Created customer id:', created.data._id);

    console.log('Fetching /customers again...');
    const res2 = await client.get('/customers');
    console.log('GET /customers status', res2.status, 'count =', res2.data.length);

    console.log('Done.');
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
