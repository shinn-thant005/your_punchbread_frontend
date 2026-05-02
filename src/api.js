import axios from 'axios';

// This is the bridge to your Spring Boot backend
const api = axios.create({
  baseURL: 'https://your-punchbread-backend.onrender.com/api/v1',
});

// --- Authentication Interceptor ---
api.interceptors.request.use((config) => {
  // Retrieve the Base64 encoded credentials from localStorage
  const token = localStorage.getItem('auth_token');
  
  if (token) {
    // Attach the Basic Auth header to every request
    config.headers.Authorization = `Basic ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;