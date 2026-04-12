import { useState, useCallback, useEffect } from 'react';
import api from '../api/axiosConfig';
import type { Empresa, Impresora } from '../types/inventory';

export const useInventory = () => {
    // State
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [impresoras, setImpresoras] = useState<Impresora[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch All
    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [resEmpresas, resImpresoras] = await Promise.all([
                api.get<Empresa[]>('/empresas'),
                api.get<Impresora[]>('/impresoras')
            ]);
            setEmpresas(resEmpresas.data);
            setImpresoras(resImpresoras.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    }, []);

    // EMPRESAS CRUD
    const addEmpresa = async (data: Omit<Empresa, 'id' | 'cant_equipos'>) => {
        try {
            const res = await api.post<Empresa>('/empresas', data);
            setEmpresas(prev => [...prev, res.data]);
            return { success: true };
        } catch (err: any) {
            return { success: false, message: err.response?.data?.error || 'Error al añadir empresa' };
        }
    };

    const deleteEmpresa = async (id: number) => {
        try {
            await api.delete(`/empresas/${id}`);
            setEmpresas(prev => prev.filter(e => e.id !== id));
            fetchAll(); // Actualizar impresoras por si perdieron el arrendatario
            return { success: true };
        } catch (err: any) {
            return { success: false, message: err.response?.data?.error || 'Error al eliminar empresa' };
        }
    };

    // IMPRESORAS CRUD
    const addImpresora = async (data: Omit<Impresora, 'id' | 'cliente_actual'>) => {
        try {
            const res = await api.post<Impresora>('/impresoras', data);
            setImpresoras(prev => [...prev, res.data]);
            return { success: true };
        } catch (err: any) {
            return { success: false, message: err.response?.data?.error || 'Error al añadir impresora' };
        }
    };

    const updateImpresora = async (id: number, data: Partial<Impresora>) => {
        try {
            const res = await api.put<Impresora>(`/impresoras/${id}`, data);
            setImpresoras(prev => prev.map(i => i.id === id ? res.data : i));
            fetchAll(); // Refrescar empresas para actualizar cantidad de equipos
            return { success: true };
        } catch (err: any) {
            return { success: false, message: err.response?.data?.error || 'Error al actualizar impresora' };
        }
    };

    const deleteImpresora = async (id: number) => {
        try {
            await api.delete(`/impresoras/${id}`);
            setImpresoras(prev => prev.filter(i => i.id !== id));
            fetchAll();
            return { success: true };
        } catch (err: any) {
            return { success: false, message: err.response?.data?.error || 'Error al eliminar impresora' };
        }
    };

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    return {
        empresas,
        impresoras,
        loading,
        error,
        addEmpresa,
        deleteEmpresa,
        addImpresora,
        updateImpresora,
        deleteImpresora,
        refresh: fetchAll
    };
};