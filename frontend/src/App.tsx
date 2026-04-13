import React from 'react';
import InventoryPage from './pages/InventoryPage';
import { LoginForm } from './components/LoginForm';
import { PackageSearch, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

const MainApp: React.FC = () => {
  const { token, username, logout } = useAuth();

  // Si no hay token, renderizamos la pantalla de Login (protegiendo el acceso a la DB)
  if (!token) {
    return <LoginForm />;
  }

  // Si hay token, renderizamos la plataforma
  return (
    <div className="min-h-screen bg-transparent text-foreground font-sans selection:bg-primary/30">

      {/* Navbar Minimalista Superior para el Log Out */}
      <nav className="w-full px-6 py-4 flex items-center justify-between border-b border-border/50 backdrop-blur-md sticky top-0 z-50 glass">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-500/20 rounded-lg">
            <PackageSearch className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="font-semibold text-slate-200 tracking-wide text-sm hidden sm:block">Control de Inventario</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-400">
            Hola, <span className="text-indigo-300">{username}</span>
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </nav>

      <main className="w-full max-w-[1600px] mx-auto px-4 py-8 flex-1">

        <InventoryPage />
      </main>

      <footer className="mt-20 pb-8 text-center text-slate-600 text-sm">
        <p>© 2026 - Control de Inventario - Desarrollo de Aplicaciones Empresariales</p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;