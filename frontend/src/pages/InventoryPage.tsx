import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { AlertCircle, Plus, Trash2, Minus, Tag, Hash, Loader2, Pencil, Save, X } from 'lucide-react';

type EditFormState = {
    nombre: string;
    stock: number;
};

const InventoryPage: React.FC = () => {
    const { productos, loading, error, addProducto, updateProducto, deleteProducto } = useInventory();
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        nombre: '',
        stock: 0
    });
    const [formError, setFormError] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<EditFormState>({
        nombre: '',
        stock: 0
    });
    const [editError, setEditError] = useState<string | null>(null);

    const selectedProduct = productos.find((producto) => producto.id === editingProductId) ?? null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        
        if (!formData.nombre.trim()) {
            setFormError('El nombre es obligatorio.');
            return;
        }
        if (formData.stock < 0) {
            setFormError('El stock no puede ser negativo.');
            return;
        }

        const res = await addProducto(formData);
        if (res.success) {
            setFormData({ nombre: '', stock: 0 });
        } else {
            setFormError(res.message || 'Error desconocido al guardar.');
        }
    };

    const handleUpdateStock = async (id: number, currentStock: number, delta: number) => {
        const newStock = currentStock + delta;
        if (newStock < 0) return; // Prevent going below 0 visually and server side
        
        setActionLoading(id);
        await updateProducto(id, { stock: newStock });
        setActionLoading(null);
    };

    const handleDelete = async (id: number) => {
        setActionLoading(id);
        await deleteProducto(id);
        if (editingProductId === id) {
            setEditingProductId(null);
            setEditError(null);
        }
        setActionLoading(null);
    };

    const handleStartEdit = (producto: { id?: number; nombre: string; stock: number }) => {
        if (!producto.id) return;

        setEditingProductId(producto.id);
        setEditFormData({
            nombre: producto.nombre,
            stock: producto.stock,
        });
        setEditError(null);
    };

    const handleCancelEdit = () => {
        setEditingProductId(null);
        setEditError(null);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditError(null);

        if (!editingProductId) return;

        if (!editFormData.nombre.trim()) {
            setEditError('El nombre es obligatorio.');
            return;
        }

        if (editFormData.stock < 0) {
            setEditError('El stock no puede ser negativo.');
            return;
        }

        setActionLoading(editingProductId);

        const result = await updateProducto(editingProductId, {
            nombre: editFormData.nombre.trim(),
            stock: editFormData.stock,
        });

        setActionLoading(null);

        if (result.success) {
            setEditingProductId(null);
            setEditFormData({ nombre: '', stock: 0 });
        } else {
            setEditError(result.message || 'Error desconocido al actualizar.');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Form Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-indigo-300">
                    <Plus className="w-5 h-5" /> Registrar Nuevo
                </h2>
                
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                            <Tag className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Nombre del producto..."
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            className="w-full bg-slate-950/50 border border-slate-800 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block pl-10 p-3 transition-all placeholder-slate-600"
                        />
                    </div>
                    
                    <div className="w-full md:w-48 relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                            <Hash className="w-5 h-5" />
                        </div>
                        <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-950/50 border border-slate-800 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block pl-10 p-3 transition-all placeholder-slate-600"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading && !productos.length}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && !productos.length ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Añadir'}
                    </button>
                </form>

                {(error || formError) && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center text-red-400 text-sm gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{formError || error}</p>
                    </div>
                )}
            </div>

            {/* List Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-semibold">Producto</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-center w-32">Stock</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-right w-56">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {productos.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                                        No hay productos registrados en el inventario.
                                    </td>
                                </tr>
                            ) : (
                                productos.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-slate-200">
                                            {p.nombre}
                                            <div className="text-xs text-slate-600 mt-1">ID: #{p.id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center">
                                                <span className={`inline-flex items-center justify-center px-3 py-1 text-sm font-bold rounded-full border ${p.stock === 0 ? 'bg-red-500/10 text-red-500 border-red-500/20' : p.stock < 5 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                    {p.stock}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleStartEdit(p)}
                                                    disabled={actionLoading === p.id}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-30"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                    Editar
                                                </button>
                                                <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                                                    <button 
                                                        onClick={() => handleUpdateStock(p.id!, p.stock, -1)}
                                                        disabled={p.stock <= 0 || actionLoading === p.id}
                                                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateStock(p.id!, p.stock, 1)}
                                                        disabled={actionLoading === p.id}
                                                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors disabled:opacity-30"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <button 
                                                    onClick={() => handleDelete(p.id!)}
                                                    disabled={actionLoading === p.id}
                                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 disabled:opacity-30"
                                                    title="Eliminar"
                                                >
                                                    {actionLoading === p.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-semibold flex items-center gap-2 text-indigo-300">
                                    <Pencil className="w-5 h-5" /> Editar producto
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Modifica el nombre o el stock de este producto.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="rounded-xl border border-slate-800 bg-slate-950/50 p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                                aria-label="Cerrar edición"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4 px-6 py-6">
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/30 px-4 py-3 text-sm text-slate-400">
                                Editando: <span className="text-slate-200 font-medium">{selectedProduct.nombre}</span>
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                    <Tag className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    value={editFormData.nombre}
                                    onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
                                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block pl-10 p-3 transition-all placeholder-slate-600"
                                    placeholder="Editar nombre del producto"
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                    <Hash className="w-5 h-5" />
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    value={editFormData.stock}
                                    onChange={(e) => setEditFormData({ ...editFormData, stock: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block pl-10 p-3 transition-all placeholder-slate-600"
                                    placeholder="Stock"
                                />
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-5 py-3 text-sm text-slate-300 transition-colors hover:bg-slate-800/50 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={actionLoading === selectedProduct.id}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white transition-all hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading === selectedProduct.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Guardar cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryPage;