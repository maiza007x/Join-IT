// src/services/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_REACT_APP_API, // ดึงค่าจาก .env
});

// ใส่ Interceptor เพื่อดึง Token มาแนบอัตโนมัติ (ลดการ Hardcode ในหน้า Tasks)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Helper สำหรับดึง URL ของรูปภาพ
export const getImageUrl = (path) => {
    if (!path) return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    const baseUrl = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';
    const serverUrl = baseUrl.replace('/api', '');
    return `${serverUrl}${path}`;
};

export default api;