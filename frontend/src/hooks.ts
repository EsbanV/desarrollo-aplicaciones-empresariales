import { useState, useEffect } from 'react';
import type { AxiosRequestConfig, AxiosError } from 'axios';
import api from './api';

// Definimos un tipo genérico <T> para que sirva con cualquier modelo de datos
export const useFetch = <T>(url: string, config?: AxiosRequestConfig) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Usamos la instancia 'api' que ya tiene el baseURL configurado
                const response = await api.get<T>(url, config);
                setData(response.data);
                setError(null);
            } catch (err) {
                const axiosError = err as AxiosError;
                setError(axiosError.message || "Ocurrió un error inesperado");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [url]); // Se vuelve a ejecutar si la URL cambia

    return { data, loading, error };
};