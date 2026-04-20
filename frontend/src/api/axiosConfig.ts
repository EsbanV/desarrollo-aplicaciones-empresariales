import axios, { type AxiosInstance } from 'axios';

const api: AxiosInstance = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('username');
            // Desencadenar un evento custom que el App escuche si es necesario, 
            // o simplemente dejar que el estado de react se dispare
            window.dispatchEvent(new Event('auth_unauthorized'));
        }
        return Promise.reject(error);
    }
);

export default api;