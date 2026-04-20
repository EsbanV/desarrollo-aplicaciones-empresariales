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
        <div className="min-h-screen flex items-center justify-center p-4">
            
            <div className="w-full max-w-md animate-fade-in">
                <div className="glass-panel p-8 relative overflow-hidden">
                    {/* Decoración */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

                    <div className="text-center mb-10 relative">
                        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-2xl mb-6 border border-primary/20 ring-1 ring-primary/30">
                            <KeyRound className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-foreground mb-2 tracking-tight">Acceso Restringido</h1>
                        <p className="text-muted-foreground text-sm">Plataforma Ágil de Gestión Empresarial</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative">
                        {error && (
                            <div className="mx-auto w-full max-w-sm rounded-2xl border border-red-500/20 bg-slate-950/90 p-4 text-sm text-red-300 shadow-lg shadow-black/30">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-full bg-red-500/10 p-2 text-red-400">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-slate-100">Confirmación</h3>
                                        <p className="mt-1 leading-5 text-slate-300">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                                    <User className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="Nombre de usuario"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-black/30 border border-white/5 text-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary block pl-12 p-3.5 transition-all outline-none"
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                                    <KeyRound className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/30 border border-white/5 text-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary block pl-12 p-3.5 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading || !username || !password}
                            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground p-3.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-primary/50 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ingresar al Sistema'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
