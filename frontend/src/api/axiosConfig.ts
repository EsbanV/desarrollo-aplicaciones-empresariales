// Agregamos la palabra "type" antes de AxiosInstance
import axios, { type AxiosInstance } from 'axios';

const api: AxiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;