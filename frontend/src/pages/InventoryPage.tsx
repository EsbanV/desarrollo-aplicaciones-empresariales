import React, { useState, useEffect } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Building2, Printer, Plus, Trash2, Loader2, Edit2, Check, X, BarChart3, Calendar, AlertCircle, Wrench } from 'lucide-react';
import type { Empresa, Impresora } from '../types/inventory';

const InventoryPage: React.FC = () => {
    const {
        empresas, impresoras, modelosDisponibles, stats, loading, error,
        addEmpresa, deleteEmpresa, updateEmpresa,
        addImpresora, deleteImpresora, updateImpresora,
        fetchImpresoras
    } = useInventory();

    const [activeTab, setActiveTab] = useState<'impresoras' | 'empresas'>('impresoras');
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // Forms states
    const [empresaForm, setEmpresaForm] = useState({ rut: '', razon_social: '', giro: '' });
    const [impresoraForm, setImpresoraForm] = useState({
        serial: '',
        modelo: '',
        valor_arriendo: '' as number | string,
        fecha_inicio: '',
        fecha_termino: ''
    });

    const [formError, setFormError] = useState<string | null>(null);

    // Edit states
    const [editImpresoraId, setEditImpresoraId] = useState<number | null>(null);
    const [editImpresoraForm, setEditImpresoraForm] = useState({ serial: '', modelo: '', valor_arriendo: 0, fecha_inicio: '', fecha_termino: '' });

    const [editEmpresaId, setEditEmpresaId] = useState<number | null>(null);
    const [editEmpresaForm, setEditEmpresaForm] = useState({ rut: '', razon_social: '', giro: '' });

    // Filter states
    const [filterSerial, setFilterSerial] = useState('');
    const [filterModelo, setFilterModelo] = useState('');
    const [filterEmpresa, setFilterEmpresa] = useState('');

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchImpresoras({
                serial: filterSerial || undefined,
                modelo: filterModelo || undefined,
                empresa_id: filterEmpresa || undefined
            });
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [filterSerial, filterModelo, filterEmpresa, fetchImpresoras]);

    const handleAddEmpresa = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        if (!empresaForm.rut || !empresaForm.razon_social) {
            setFormError('RUT y Razón Social son obligatorios');
            return;
        }
        const res = await addEmpresa(empresaForm);
        if (res.success) setEmpresaForm({ rut: '', razon_social: '', giro: '' });
        else setFormError(res.message!);
    };

    const handleAddImpresora = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        if (!impresoraForm.serial || !impresoraForm.modelo) {
            setFormError('Serial y Modelo son obligatorios');
            return;
        }
        const dataToSend = {
            ...impresoraForm,
            valor_arriendo: impresoraForm.valor_arriendo === '' ? 0 : Number(impresoraForm.valor_arriendo),
        };
        const res = await addImpresora(dataToSend);
        if (res.success) {
            setImpresoraForm({
                serial: '',
                modelo: '',
                valor_arriendo: '',
                fecha_inicio: '',
                fecha_termino: ''
            });
        }
        else setFormError(res.message!);
    };

    const handleDeleteEmpresa = async (id: number) => {
        setActionLoading(id);
        await deleteEmpresa(id);
        setActionLoading(null);
    };

    const handleDeleteImpresora = async (id: number) => {
        setActionLoading(id);
        await deleteImpresora(id);
        setActionLoading(null);
    };

    const handleAssign = async (impresoraId: number, empresaId: string) => {
        setActionLoading(impresoraId);
        const empIdNum = empresaId ? parseInt(empresaId) : null;
        const currentPrinter = impresoras.find((impresora) => impresora.id === impresoraId);

        const today = new Date();
        const fechaInicio = today.toISOString().slice(0, 10);
        const fechaTerminoDate = new Date(today);
        fechaTerminoDate.setMonth(fechaTerminoDate.getMonth() + 6);
        const fechaTermino = fechaTerminoDate.toISOString().slice(0, 10);

        await updateImpresora(impresoraId, {
            empresa_id: empIdNum,
            estado: empIdNum ? 'Arrendada' : 'Disponible',
            // Conserva fechas existentes para que al desasignar y reasignar
            // no se reinicie el contrato automáticamente.
            fecha_inicio: empIdNum
                ? (currentPrinter?.fecha_inicio || fechaInicio)
                : (currentPrinter?.fecha_inicio || null),
            fecha_termino: empIdNum
                ? (currentPrinter?.fecha_termino || fechaTermino)
                : (currentPrinter?.fecha_termino || null)
        });
        setActionLoading(null);
    };

    const startEditImpresora = (i: Impresora) => {
        if (!i.id) return;
        setEditImpresoraId(i.id);
        setEditImpresoraForm({ 
            serial: i.serial, 
            modelo: i.modelo, 
            valor_arriendo: i.valor_arriendo || 0,
            fecha_inicio: i.fecha_inicio || '',
            fecha_termino: i.fecha_termino || ''
        });
    };

    const saveEditImpresora = async (id: number) => {
        setActionLoading(id);
        const res = await updateImpresora(id, editImpresoraForm);
        if (res.success) setEditImpresoraId(null);
        else setFormError(res.message!);
        setActionLoading(null);
    };

    const startEditEmpresa = (e: Empresa) => {
        if (!e.id) return;
        setEditEmpresaId(e.id);
        setEditEmpresaForm({ rut: e.rut, razon_social: e.razon_social, giro: e.giro || '' });
    };

    const saveEditEmpresa = async (id: number) => {
        setActionLoading(id);
        const res = await updateEmpresa(id, editEmpresaForm);
        if (res.success) setEditEmpresaId(null);
        else setFormError(res.message!);
        setActionLoading(null);
    };

    const handleRenewContract = async (impresoraId: number) => {
        const currentPrinter = impresoras.find((impresora) => impresora.id === impresoraId);
        if (!currentPrinter) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const currentEndDate = currentPrinter.fecha_termino
            ? new Date(`${currentPrinter.fecha_termino}T00:00:00`)
            : null;

        let renewalBaseDate = today;
        if (currentEndDate && !Number.isNaN(currentEndDate.getTime()) && currentEndDate > today) {
            renewalBaseDate = currentEndDate;
        }

        const renewedEndDate = new Date(renewalBaseDate);
        renewedEndDate.setMonth(renewedEndDate.getMonth() + 6);

        setActionLoading(impresoraId);
        const result = await updateImpresora(impresoraId, {
            estado: 'Arrendada',
            fecha_inicio: currentPrinter.fecha_inicio || today.toISOString().slice(0, 10),
            fecha_termino: renewedEndDate.toISOString().slice(0, 10),
        });
        if (!result.success) {
            setFormError(result.message || 'No se pudo renovar el contrato');
        }
        setActionLoading(null);
    };

    const handleToggleService = async (impresoraId: number) => {
        const currentPrinter = impresoras.find((impresora) => impresora.id === impresoraId);
        if (!currentPrinter) return;

        setActionLoading(impresoraId);
        const isOutOfService = currentPrinter.estado === 'Fuera de Servicio' || currentPrinter.estado === 'En Servicio';

        const result = await updateImpresora(impresoraId, {
            estado: isOutOfService ? 'Disponible' : 'Fuera de Servicio',
        });

        if (!result.success) {
            setFormError(result.message || 'No se pudo cambiar el estado de servicio');
        }
        setActionLoading(null);
    };

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return 'Sin fecha';
        const date = new Date(`${dateString}T00:00:00`);
        if (Number.isNaN(date.getTime())) return 'Fecha inválida';
        return date.toLocaleDateString('es-CL');
    };

    const getContractBadge = (estado?: string, fechaTermino?: string | null) => {
        if (estado !== 'Arrendada' && estado !== 'Vencido') {
            return null;
        }

        if (!fechaTermino) {
            return {
                label: 'Sin término',
                className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
            };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = new Date(`${fechaTermino}T00:00:00`);

        if (Number.isNaN(end.getTime())) {
            return {
                label: 'Fecha inválida',
                className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
            };
        }

        const daysDiff = Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0) {
            return {
                label: 'Vencido',
                className: 'bg-red-500/10 text-red-400 border-red-500/20',
            };
        }

        if (daysDiff <= 15) {
            return {
                label: 'Por vencer',
                className: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            };
        }

        return {
            label: 'Vigente',
            className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
    };

    const contractAlerts = impresoras.reduce(
        (acc, impresora) => {
            if (!impresora.empresa_id || !impresora.fecha_termino) {
                return acc;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const end = new Date(`${impresora.fecha_termino}T00:00:00`);
            if (Number.isNaN(end.getTime())) {
                return acc;
            }

            const daysDiff = Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff < 0) {
                acc.vencidos += 1;
            } else if (daysDiff <= 15) {
                acc.porVencer += 1;
            }

            return acc;
        },
        { porVencer: 0, vencidos: 0 }
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="text-center space-y-3 mb-2">
                <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-br from-white via-purple-300 to-primary bg-clip-text text-transparent tracking-tight drop-shadow-lg">
                    {activeTab === 'impresoras' ? 'Inventario de Impresoras' : 'Directorio de Socios'}
                </h1>
            </header>

            {/* TABS MENU */}
            <div className="flex gap-4 border-b border-slate-800 pb-4">
                <button
                    onClick={() => setActiveTab('impresoras')}
                    className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${activeTab === 'impresoras' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'bg-black/30 text-slate-400 hover:text-foreground hover:bg-black/50'}`}
                >
                    <Printer className="w-5 h-5" /> Impresoras
                </button>
                <button
                    onClick={() => setActiveTab('empresas')}
                    className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${activeTab === 'empresas' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'bg-black/30 text-slate-400 hover:text-foreground hover:bg-black/50'}`}
                >
                    <Building2 className="w-5 h-5" /> Empresas
                </button>
            </div>

            {/* ERROR ALERT */}
            {(error || formError) && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center text-red-400 text-sm gap-3">
                    <p>{formError || error}</p>
                </div>
            )}

            {activeTab === 'impresoras' ? (
                // --- TAB: IMPRESORAS ---
                <div className="space-y-8">
                    {(contractAlerts.porVencer > 0 || contractAlerts.vencidos > 0) && (
                        <div className="glass-panel p-4 md:p-5 border border-white/10">
                            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                                <div className="inline-flex items-center gap-2 text-amber-400 text-sm font-medium">
                                    <AlertCircle className="w-4 h-4" />
                                    Por vencer: {contractAlerts.porVencer}
                                </div>
                                <div className="inline-flex items-center gap-2 text-red-400 text-sm font-medium">
                                    <AlertCircle className="w-4 h-4" />
                                    Vencidos: {contractAlerts.vencidos}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Panel de Estadísticas Globales */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                            <div className="glass p-6 flex flex-col items-center justify-center text-center">
                                <h3 className="text-muted-foreground font-medium mb-1 text-sm">Inventario Total</h3>
                                <div className="text-4xl font-extrabold text-foreground">{stats.total_equipos}</div>
                            </div>
                            <div className="glass p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                                <h3 className="text-muted-foreground font-medium mb-1 text-sm">Disponibles</h3>
                                <div className="text-4xl font-extrabold text-primary">{stats.total_disponibles}</div>
                            </div>
                            <div className="glass-panel p-6 col-span-1 md:col-span-2 lg:col-span-2">
                                <h3 className="text-sm font-semibold text-foreground tracking-wider mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-primary" />
                                    Resumen por Modelo
                                </h3>
                                <div className="overflow-y-auto max-h-40 pe-2 custom-scrollbar">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-muted-foreground uppercase border-b border-border/50 sticky top-0 bg-popover/80 backdrop-blur-md">
                                            <tr>
                                                <th className="px-3 py-2">Modelo</th>
                                                <th className="px-3 py-2 text-center">Total</th>
                                                <th className="px-3 py-2 text-center">Arrend.</th>
                                                <th className="px-3 py-2 text-center">Disp.</th>
                                                <th className="px-3 py-2 text-center">Serv.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            {stats.modelos.map((m: { nombre: string; total: number; arrendadas: number; disponibles: number; en_servicio?: number }, idx: number) => (
                                                <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                                    <td className="px-3 py-2 font-medium text-foreground">{m.nombre}</td>
                                                    <td className="px-3 py-2 text-center">{m.total}</td>
                                                    <td className="px-3 py-2 text-center text-accent font-semibold">{m.arrendadas}</td>
                                                    <td className="px-3 py-2 text-center text-primary font-semibold">{m.disponibles}</td>
                                                    <td className="px-3 py-2 text-center text-orange-400 font-semibold">{m.en_servicio || 0}</td>
                                                </tr>
                                            ))}
                                            {stats.modelos.length === 0 && (
                                                <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">No hay datos.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Formulario Impresora */}
                    <div className="glass-panel p-6 md:p-8 relative overflow-hidden animate-fade-in">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-indigo-300">
                            <Plus className="w-5 h-5" /> Registrar Impresora
                        </h2>
                        <form onSubmit={handleAddImpresora} className="flex flex-col md:flex-row gap-4">
                            <input
                                placeholder="Serial (ej. S1234)"
                                value={impresoraForm.serial}
                                onChange={e => setImpresoraForm({ ...impresoraForm, serial: e.target.value })}
                                className="flex-1 bg-black/30 border border-white/5 text-foreground hover:bg-black/40 transition-colors rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                            />
                            <input
                                placeholder="Modelo"
                                value={impresoraForm.modelo}
                                onChange={e => setImpresoraForm({ ...impresoraForm, modelo: e.target.value })}
                                className="flex-1 bg-black/30 border border-white/5 text-foreground hover:bg-black/40 transition-colors rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                            />
                            <div className="flex-1 relative">
                                <label className="absolute -top-2.5 left-3 text-xs bg-slate-900 px-1 text-slate-400">Arriendo ($)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={impresoraForm.valor_arriendo}
                                    onChange={e => setImpresoraForm({ ...impresoraForm, valor_arriendo: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                    className="w-full bg-black/30 border border-white/5 text-foreground hover:bg-black/40 transition-colors rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none"
                                />
                            </div>
                            <div className="flex-1 relative">
                                <label className="absolute -top-2.5 left-3 text-xs bg-slate-900 px-1 text-slate-400">Desde</label>
                                <input
                                    type="date"
                                    value={impresoraForm.fecha_inicio}
                                    onChange={e => setImpresoraForm({ ...impresoraForm, fecha_inicio: e.target.value })}
                                    className="w-full bg-black/30 border border-white/5 text-foreground hover:bg-black/40 transition-colors rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none"
                                />
                            </div>
                            <div className="flex-1 relative">
                                <label className="absolute -top-2.5 left-3 text-xs bg-slate-900 px-1 text-slate-400">Hasta</label>
                                <input
                                    type="date"
                                    value={impresoraForm.fecha_termino}
                                    onChange={e => setImpresoraForm({ ...impresoraForm, fecha_termino: e.target.value })}
                                    className="w-full bg-black/30 border border-white/5 text-foreground hover:bg-black/40 transition-colors rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none"
                                />
                            </div>
                            <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center">
                                {loading && !impresoras.length ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar'}
                            </button>
                        </form>
                    </div>

                    {/* Filtros Impresoras */}
                    <div className="glass-panel p-6 md:p-8 relative overflow-hidden animate-fade-in">
                        <h3 className="text-lg font-medium mb-4 text-indigo-300">Filtros de Búsqueda</h3>
                        <div className="flex flex-col md:flex-row gap-4">
                            <input
                                placeholder="Buscar por serial..."
                                value={filterSerial}
                                onChange={e => setFilterSerial(e.target.value)}
                                className="flex-1 bg-black/30 border border-white/5 text-foreground hover:bg-black/40 transition-colors rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                            />
                            <select
                                value={filterModelo}
                                onChange={e => setFilterModelo(e.target.value)}
                                className="flex-1 bg-black/30 border border-white/5 text-foreground hover:bg-black/40 transition-colors rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                            >
                                <option value="">Todos los Modelos</option>
                                {modelosDisponibles.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            <select
                                value={filterEmpresa}
                                onChange={e => setFilterEmpresa(e.target.value)}
                                className="flex-1 bg-black/30 border border-white/5 text-foreground hover:bg-black/40 transition-colors rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                            >
                                <option value="">Todas las Empresas</option>
                                <option value="unassigned">-- Sin Asignar --</option>
                                {empresas.map(emp => (
                                    <option key={emp.id} value={String(emp.id)}>{emp.razon_social}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Tabla Impresoras */}
                    <div className="glass-panel overflow-hidden relative animate-fade-in">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-300">
                                <thead className="bg-black/40 border-b border-white/5 text-slate-300 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Impresora</th>
                                        <th className="px-6 py-4 text-center">Estado</th>
                                        <th className="px-6 py-4">Contrato</th>
                                        <th className="px-6 py-4">Asignación</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {impresoras.map(i => {
                                        const isOutOfService = i.estado === 'Fuera de Servicio' || i.estado === 'En Servicio';
                                        const contractBadge = getContractBadge(i.estado, i.fecha_termino);
                                        return (
                                        <tr key={i.id} className={`hover:bg-white/5 group transition-all duration-300 relative ${isOutOfService ? 'opacity-65' : ''}`}>
                                            {editImpresoraId === i.id ? (
                                                <>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-2">
                                                            <input value={editImpresoraForm.modelo} onChange={e => setEditImpresoraForm({ ...editImpresoraForm, modelo: e.target.value })} className="bg-black/50 border border-white/10 text-foreground rounded-md px-2 py-1 text-sm outline-none w-full" placeholder="Modelo" />
                                                            <div className="flex gap-2">
                                                                <input value={editImpresoraForm.serial} onChange={e => setEditImpresoraForm({ ...editImpresoraForm, serial: e.target.value })} className="bg-black/50 border border-white/10 text-foreground rounded-md px-2 py-1 text-xs outline-none w-1/2" placeholder="Serial" />
                                                                <input type="number" value={editImpresoraForm.valor_arriendo} onChange={e => setEditImpresoraForm({ ...editImpresoraForm, valor_arriendo: parseInt(e.target.value) || 0 })} className="bg-black/50 border border-white/10 text-foreground rounded-md px-2 py-1 text-xs outline-none w-1/2" placeholder="$ Arriendo" />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-slate-500 text-xs">-</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {i.estado === 'Arrendada' ? (
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-slate-500 w-12 text-right">Inicio:</span>
                                                                    <input type="date" value={editImpresoraForm.fecha_inicio} onChange={e => setEditImpresoraForm({...editImpresoraForm, fecha_inicio: e.target.value})} className="bg-black/50 border border-white/10 text-foreground rounded-md px-2 py-1 text-xs outline-none w-full" />
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-slate-500 w-12 text-right">Término:</span>
                                                                    <input type="date" value={editImpresoraForm.fecha_termino} onChange={e => setEditImpresoraForm({...editImpresoraForm, fecha_termino: e.target.value})} className="bg-black/50 border border-white/10 text-foreground rounded-md px-2 py-1 text-xs outline-none w-full" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-500 text-xs block text-center">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-slate-500 text-xs block text-center">-</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end items-center gap-1">
                                                            <button onClick={() => saveEditImpresora(i.id!)} disabled={actionLoading === i.id} className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors">
                                                                {actionLoading === i.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                            </button>
                                                            <button onClick={() => setEditImpresoraId(null)} disabled={actionLoading === i.id} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4 font-medium text-slate-200">
                                                        {i.modelo}
                                                        <div className="text-xs text-slate-500 mt-1">SN: {i.serial} | Arriendo: ${i.valor_arriendo}/mes</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${i.estado === 'Disponible' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : i.estado === 'Vencido' ? 'bg-red-500/10 text-red-400 border-red-500/20' : isOutOfService ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                                            {isOutOfService ? 'Fuera de Servicio' : i.estado}
                                                        </span>
                                                        {contractBadge && (
                                                            <div className="mt-2 flex justify-center">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1 ${contractBadge.className}`}>
                                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                                    {contractBadge.label}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {i.estado === 'Arrendada' || i.estado === 'Vencido' ? (
                                                            <div className="space-y-1 text-xs text-slate-300">
                                                                <div className="inline-flex items-center gap-2">
                                                                    <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                                                                    <span>Inicio: {formatDate(i.fecha_inicio)}</span>
                                                                </div>
                                                                <div className="inline-flex items-center gap-2">
                                                                    <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                                                                    <span>Término: {formatDate(i.fecha_termino)}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-500">Sin contrato</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            value={i.empresa_id || ''}
                                                            onChange={(e) => handleAssign(i.id!, e.target.value)}
                                                            className="bg-black/50 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors cursor-pointer w-full max-w-[200px]"
                                                            disabled={actionLoading === i.id || isOutOfService}
                                                            title={isOutOfService ? 'No se puede asignar mientras esté fuera de servicio' : 'Asignar empresa'}
                                                        >
                                                            <option value="">-- Sin asignar --</option>
                                                            {empresas.map(emp => (
                                                                <option key={emp.id} value={emp.id}>{emp.razon_social}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleToggleService(i.id!)}
                                                            disabled={actionLoading === i.id}
                                                            className={`p-2 rounded-lg transition-colors border border-transparent ${isOutOfService ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 hover:border-orange-500/20' : 'text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/20'}`}
                                                            title={isOutOfService ? 'Marcar como Disponible' : 'Marcar como Fuera de Servicio'}
                                                        >
                                                            <Wrench className="w-4 h-4" />
                                                        </button>
                                                        {(i.estado === 'Arrendada' || i.estado === 'Vencido') && i.empresa_id && (
                                                            <button
                                                                onClick={() => handleRenewContract(i.id!)}
                                                                disabled={actionLoading === i.id}
                                                                className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors border border-transparent hover:border-emerald-500/20"
                                                                title="Renovar contrato 6 meses"
                                                            >
                                                                <Calendar className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button onClick={() => startEditImpresora(i)} disabled={actionLoading === i.id} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors border border-transparent hover:border-indigo-500/20">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteImpresora(i.id!)} disabled={actionLoading === i.id} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20">
                                                            {actionLoading === i.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                        );
                                    })}
                                    {impresoras.length === 0 && (
                                        <tr><td colSpan={5} className="text-center py-12 text-slate-500">No se encontraron impresoras.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                // --- TAB: EMPRESAS ---
                <div className="space-y-8">
                    {/* Formulario Empresa */}
                    <div className="glass-panel p-6 md:p-8 relative overflow-hidden animate-fade-in">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-indigo-300">
                            <Building2 className="w-5 h-5" /> Registrar Empresa
                        </h2>
                        <form onSubmit={handleAddEmpresa} className="flex flex-col md:flex-row gap-4">
                            <input
                                placeholder="RUT (ej. 12345678-9)"
                                value={empresaForm.rut}
                                onChange={e => setEmpresaForm({ ...empresaForm, rut: e.target.value })}
                                className="w-full md:w-1/4 bg-black/30 border border-white/5 text-foreground hover:bg-black/40 transition-colors rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                            />
                            <input
                                placeholder="Razón Social"
                                value={empresaForm.razon_social}
                                onChange={e => setEmpresaForm({ ...empresaForm, razon_social: e.target.value })}
                                className="flex-1 bg-black/30 border border-white/5 text-foreground hover:bg-black/40 transition-colors rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                            />
                            <input
                                placeholder="Giro (Opcional)"
                                value={empresaForm.giro}
                                onChange={e => setEmpresaForm({ ...empresaForm, giro: e.target.value })}
                                className="w-full md:w-1/4 bg-black/30 border border-white/5 text-foreground hover:bg-black/40 transition-colors rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                            />
                            <button type="submit" disabled={loading} className="bg-primary hover:bg-primary/80 text-primary-foreground px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center">
                                {loading && !empresas.length ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar'}
                            </button>
                        </form>
                    </div>

                    {/* Tabla Empresas */}
                    <div className="glass-panel overflow-hidden relative animate-fade-in">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-300">
                                <thead className="bg-black/40 border-b border-white/5 text-slate-300 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Empresa</th>
                                        <th className="px-6 py-4 text-center">Giro</th>
                                        <th className="px-6 py-4 text-center">Equipos Asignados</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {empresas.map(e => (
                                        <tr key={e.id} className="hover:bg-white/5 group transition-all duration-300 relative">
                                            {editEmpresaId === e.id ? (
                                                <>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-2">
                                                            <input value={editEmpresaForm.razon_social} onChange={ev => setEditEmpresaForm({ ...editEmpresaForm, razon_social: ev.target.value })} className="bg-black/50 border border-white/10 text-foreground rounded-md px-2 py-1 text-sm outline-none w-full" placeholder="Razón Social" />
                                                            <input value={editEmpresaForm.rut} onChange={ev => setEditEmpresaForm({ ...editEmpresaForm, rut: ev.target.value })} className="bg-black/50 border border-white/10 text-foreground rounded-md px-2 py-1 text-xs outline-none w-full" placeholder="RUT" />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <input value={editEmpresaForm.giro} onChange={ev => setEditEmpresaForm({ ...editEmpresaForm, giro: ev.target.value })} className="bg-black/50 border border-white/10 text-foreground rounded-md px-2 py-1 text-sm outline-none w-full text-center" placeholder="Giro" />
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-slate-500 text-xs">-</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end items-center gap-1">
                                                            <button onClick={() => saveEditEmpresa(e.id!)} disabled={actionLoading === e.id} className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors">
                                                                {actionLoading === e.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                            </button>
                                                            <button onClick={() => setEditEmpresaId(null)} disabled={actionLoading === e.id} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4 font-medium text-slate-200">
                                                        {e.razon_social}
                                                        <div className="text-xs text-slate-500 mt-1">RUT: {e.rut}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-slate-400">{e.giro || 'N/A'}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-full font-bold text-xs">
                                                            {e.cant_equipos || 0} Impresoras
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => startEditEmpresa(e)} disabled={actionLoading === e.id} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors border border-transparent hover:border-indigo-500/20">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteEmpresa(e.id!)} disabled={actionLoading === e.id} title="Eliminar Empresa" className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20">
                                                            {actionLoading === e.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {empresas.length === 0 && (
                                        <tr><td colSpan={4} className="text-center py-12 text-slate-500">No hay empresas registradas en el sistema.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryPage;