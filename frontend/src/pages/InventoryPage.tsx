import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Building2, Printer, Plus, Trash2, Loader2 } from 'lucide-react';

const InventoryPage: React.FC = () => {
    const { 
        empresas, impresoras, loading, error, 
        addEmpresa, deleteEmpresa, 
        addImpresora, deleteImpresora, updateImpresora 
    } = useInventory();
    
    const [activeTab, setActiveTab] = useState<'impresoras' | 'empresas'>('impresoras');
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // Forms states
    const [empresaForm, setEmpresaForm] = useState({ rut: '', razon_social: '', giro: '' });
    const [impresoraForm, setImpresoraForm] = useState({ serial: '', modelo: '', valor_arriendo: 0 });

    const [formError, setFormError] = useState<string | null>(null);

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
        const res = await addImpresora(impresoraForm);
        if (res.success) setImpresoraForm({ serial: '', modelo: '', valor_arriendo: 0 });
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
        await updateImpresora(impresoraId, { 
            empresa_id: empIdNum, 
            estado: empIdNum ? 'Arrendada' : 'Disponible' 
        });
        setActionLoading(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* TABS MENU */}
            <div className="flex gap-4 border-b border-slate-800 pb-4">
                <button 
                    onClick={() => setActiveTab('impresoras')}
                    className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${activeTab === 'impresoras' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                    <Printer className="w-5 h-5" /> Impresoras
                </button>
                <button 
                    onClick={() => setActiveTab('empresas')}
                    className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${activeTab === 'empresas' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800'}`}
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
                    {/* Formulario Impresora */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-indigo-300">
                            <Plus className="w-5 h-5" /> Registrar Impresora
                        </h2>
                        <form onSubmit={handleAddImpresora} className="flex flex-col md:flex-row gap-4">
                            <input
                                placeholder="Serial (ej. S1234)"
                                value={impresoraForm.serial}
                                onChange={e => setImpresoraForm({...impresoraForm, serial: e.target.value})}
                                className="flex-1 bg-slate-950/50 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                            />
                            <input
                                placeholder="Modelo"
                                value={impresoraForm.modelo}
                                onChange={e => setImpresoraForm({...impresoraForm, modelo: e.target.value})}
                                className="flex-1 bg-slate-950/50 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                            />
                            <div className="flex-1 relative">
                                <label className="absolute -top-2.5 left-3 text-xs bg-slate-900 px-1 text-slate-400">Arriendo ($)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={impresoraForm.valor_arriendo}
                                    onChange={e => setImpresoraForm({...impresoraForm, valor_arriendo: parseInt(e.target.value) || 0})}
                                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                />
                            </div>
                            <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center">
                                {loading && !impresoras.length ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar'}
                            </button>
                        </form>
                    </div>

                    {/* Tabla Impresoras */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-300">
                                <thead className="bg-slate-950/50 border-b border-slate-800 text-slate-400 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Impresora</th>
                                        <th className="px-6 py-4 text-center">Estado</th>
                                        <th className="px-6 py-4">Asignación</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {impresoras.map(i => (
                                        <tr key={i.id} className="hover:bg-slate-800/30 group transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-200">
                                                {i.modelo}
                                                <div className="text-xs text-slate-500 mt-1">SN: {i.serial} | Arriendo: ${i.valor_arriendo}/mes</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${i.estado === 'Disponible' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                    {i.estado}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select 
                                                    value={i.empresa_id || ''} 
                                                    onChange={(e) => handleAssign(i.id!, e.target.value)}
                                                    className="bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors cursor-pointer w-full max-w-[200px]"
                                                    disabled={actionLoading === i.id}
                                                >
                                                    <option value="">-- Sin asignar --</option>
                                                    {empresas.map(emp => (
                                                        <option key={emp.id} value={emp.id}>{emp.razon_social}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleDeleteImpresora(i.id!)} disabled={actionLoading === i.id} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20">
                                                    {actionLoading === i.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {impresoras.length === 0 && (
                                        <tr><td colSpan={4} className="text-center py-12 text-slate-500">No hay impresoras registradas en el sistema.</td></tr>
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
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-indigo-300">
                            <Building2 className="w-5 h-5" /> Registrar Empresa
                        </h2>
                        <form onSubmit={handleAddEmpresa} className="flex flex-col md:flex-row gap-4">
                            <input
                                placeholder="RUT (ej. 12345678-9)"
                                value={empresaForm.rut}
                                onChange={e => setEmpresaForm({...empresaForm, rut: e.target.value})}
                                className="w-full md:w-1/4 bg-slate-950/50 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                            />
                            <input
                                placeholder="Razón Social"
                                value={empresaForm.razon_social}
                                onChange={e => setEmpresaForm({...empresaForm, razon_social: e.target.value})}
                                className="flex-1 bg-slate-950/50 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                            />
                            <input
                                placeholder="Giro (Opcional)"
                                value={empresaForm.giro}
                                onChange={e => setEmpresaForm({...empresaForm, giro: e.target.value})}
                                className="w-full md:w-1/4 bg-slate-950/50 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                            />
                            <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center">
                                {loading && !empresas.length ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar'}
                            </button>
                        </form>
                    </div>

                    {/* Tabla Empresas */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-300">
                                <thead className="bg-slate-950/50 border-b border-slate-800 text-slate-400 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Empresa</th>
                                        <th className="px-6 py-4 text-center">Giro</th>
                                        <th className="px-6 py-4 text-center">Equipos Asignados</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {empresas.map(e => (
                                        <tr key={e.id} className="hover:bg-slate-800/30 group transition-colors">
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
                                                <button onClick={() => handleDeleteEmpresa(e.id!)} disabled={actionLoading === e.id} title="Eliminar Empresa" className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20">
                                                    {actionLoading === e.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            </td>
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