import axios from 'axios';

// Use Vite env var `VITE_API_URL` for local dev, fallback to hosted URL
export const BASE_URL = import.meta.env.VITE_API_URL || 'https://tailor-backend-f52f.onrender.com';

const api = axios.create({
    baseURL: `${BASE_URL}/api`,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
