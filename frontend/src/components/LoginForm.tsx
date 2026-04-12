import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, User, Loader2, AlertCircle } from 'lucide-react';
import api from '../api/axiosConfig';

export const LoginForm: React.FC = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const res = await api.post('/login', { username, password });
            if (res.data.access_token) {
                login(res.data.username, res.data.access_token);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Falló la conexión al servidor');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950/0 to-slate-950/0 pointer-events-none"></div>
            
            <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                    {/* Decoración */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

                    <div className="text-center mb-10 relative">
                        <div className="inline-flex items-center justify-center p-4 bg-indigo-500/10 rounded-2xl mb-6 border border-indigo-500/20 ring-1 ring-indigo-500/30">
                            <KeyRound className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Acceso Restringido</h1>
                        <p className="text-slate-400 text-sm">Plataforma Ágil de Gestión Empresarial</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center text-red-400 text-sm gap-3 animate-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                    <User className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="Nombre de usuario"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block pl-12 p-3.5 transition-all outline-none"
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                    <KeyRound className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block pl-12 p-3.5 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading || !username || !password}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-3.5 rounded-xl font-semibold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ingresar al Sistema'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
