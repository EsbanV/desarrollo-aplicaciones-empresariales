import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import api from '../api/axiosConfig';
import type { Empresa, Impresora } from '../types/inventory';

type InventoryStats = {
    total_equipos: number;
    total_disponibles: number;
    total_en_servicio: number;
    modelos: Array<{
        nombre: string;
        total: number;
        arrendadas: number;
        disponibles: number;
        en_servicio?: number;
    }>;
};

const getErrorMessage = (err: unknown, fallback: string) => {
    if (axios.isAxiosError(err)) {
        return err.response?.data?.error || fallback;
    }

    return fallback;
};

export const useInventory = () => {
    // State
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [impresoras, setImpresoras] = useState<Impresora[]>([]);
    const [modelosDisponibles, setModelosDisponibles] = useState<string[]>([]);
    const [stats, setStats] = useState<InventoryStats | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch All (Data Inicial)
    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [resEmpresas, resModelos, resStats] = await Promise.all([
                api.get<Empresa[]>('/empresas'),
                api.get<string[]>('/impresoras/modelos'),
                api.get<InventoryStats>('/impresoras/stats')
            ]);
            setEmpresas(resEmpresas.data);
            setModelosDisponibles(resModelos.data);
            setStats(resStats.data);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Error al cargar los datos iniciales'));
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get<InventoryStats>('/impresoras/stats');
            setStats(res.data);
        } catch (err: unknown) {
            console.error("Error fetching stats", err);
        }
    }, []);

    // Fetch Impresoras con Filtros
    const fetchImpresoras = useCallback(async (filters?: {serial?: string, modelo?: string, empresa_id?: string}) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get<Impresora[]>('/impresoras', { params: filters });
            setImpresoras(res.data);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Error al cargar impresoras'));
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
        } catch (err: unknown) {
            return { success: false, message: getErrorMessage(err, 'Error al añadir empresa') };
        }
    };

    const deleteEmpresa = async (id: number) => {
        try {
            await api.delete(`/empresas/${id}`);
            setEmpresas(prev => prev.filter(e => e.id !== id));
            // No podemos hacer fetchAll() aquí, mejor recargar la página o manejar el estado localmente.
            // Para mantener simpleza, podríamos asumir que "fetchImpresoras" se llamará por separado si es necesario.
            return { success: true };
        } catch (err: unknown) {
            return { success: false, message: getErrorMessage(err, 'Error al eliminar empresa') };
        }
    };

    const detachEmpresaActivos = async (id: number) => {
        try {
            const res = await api.post(`/empresas/${id}/desligar_activos`);
            await Promise.all([fetchAll(), fetchImpresoras()]);
            return { success: true, data: res.data };
        } catch (err: unknown) {
            return { success: false, message: getErrorMessage(err, 'Error al desligar activos de la empresa') };
        }
    };

    const updateEmpresa = async (id: number, data: Partial<Empresa>) => {
        try {
            const res = await api.put<Empresa>(`/empresas/${id}`, data);
            setEmpresas(prev => prev.map(e => e.id === id ? res.data : e));
            return { success: true };
        } catch (err: unknown) {
            return { success: false, message: getErrorMessage(err, 'Error al actualizar empresa') };
        }
    };

    // IMPRESORAS CRUD
    const addImpresora = async (data: Omit<Impresora, 'id' | 'cliente_actual'>) => {
        try {
            const res = await api.post<Impresora>('/impresoras', data);
            setImpresoras(prev => [...prev, res.data]);
            return { success: true };
        } catch (err: unknown) {
            return { success: false, message: getErrorMessage(err, 'Error al añadir impresora') };
        }
    };

    const updateImpresora = async (id: number, data: Partial<Impresora>) => {
        try {
            const res = await api.put<Impresora>(`/impresoras/${id}`, data);
            setImpresoras(prev => prev.map(i => i.id === id ? res.data : i));
            fetchAll(); // Refrescar empresas y stats
            return { success: true };
        } catch (err: unknown) {
            return { success: false, message: getErrorMessage(err, 'Error al actualizar impresora') };
        }
    };

    const deleteImpresora = async (id: number) => {
        try {
            await api.delete(`/impresoras/${id}`);
            setImpresoras(prev => prev.filter(i => i.id !== id));
            fetchAll();
            return { success: true };
        } catch (err: unknown) {
            return { success: false, message: getErrorMessage(err, 'Error al eliminar impresora') };
        }
    };

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    return {
        empresas,
        impresoras,
        modelosDisponibles,
        stats,
        loading,
        error,
        addEmpresa,
        updateEmpresa,
        deleteEmpresa,
        detachEmpresaActivos,
        addImpresora,
        updateImpresora,
        deleteImpresora,
        refresh: fetchAll,
        fetchImpresoras,
        fetchStats
    };
};