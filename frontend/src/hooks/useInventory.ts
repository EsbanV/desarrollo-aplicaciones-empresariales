import { useState, useCallback, useEffect } from 'react';
import api from '../api/axiosConfig';
import type { Producto } from '../types/inventory';

export const useInventory = () => {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProductos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<Producto[]>('/productos');
            setProductos(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al cargar productos');
        } finally {
            setLoading(false);
        }
    }, []);

    const addProducto = async (producto: Omit<Producto, 'id'>) => {
        try {
            const response = await api.post<Producto>('/productos', producto);
            setProductos((prev) => [...prev, response.data]);
            return { success: true };
        } catch (err: any) {
            return { success: false, message: err.response?.data?.error || 'Error al conectar con la API' };
        }
    };

    const updateProducto = async (id: number, data: Partial<Producto>) => {
        try {
            const response = await api.put<Producto>(`/productos/${id}`, data);
            setProductos((prev) => prev.map(p => p.id === id ? response.data : p));
            return { success: true };
        } catch (err: any) {
            return { success: false, message: err.response?.data?.error || 'Error al actualizar el producto' };
        }
    };

    const deleteProducto = async (id: number) => {
        try {
            await api.delete(`/productos/${id}`);
            setProductos((prev) => prev.filter(p => p.id !== id));
            return { success: true };
        } catch (err: any) {
            return { success: false, message: err.response?.data?.error || 'Error al eliminar el producto' };
        }
    };

    useEffect(() => {
        fetchProductos();
    }, [fetchProductos]);

    return { 
        productos, 
        loading, 
        error, 
        addProducto, 
        updateProducto, 
        deleteProducto, 
        refresh: fetchProductos 
    };
};