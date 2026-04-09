import React from 'react';
import InventoryPage from './pages/InventoryPage';
import { PackageSearch } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950/0 to-slate-950/0 pointer-events-none"></div>

      <main className="w-full max-w-[1600px] mx-auto px-4 py-12 flex-1">
        <header className="mb-12 text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30 backdrop-blur-sm">
            <PackageSearch className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-br from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent tracking-tight">
            Control de Inventario
          </h1>
          <p className="text-slate-400 text-sm md:text-base font-medium tracking-wide">
            Plataforma Ágil de Gestión Empresarial
          </p>
        </header>

        <InventoryPage />
      </main>

      <footer className="mt-20 pb-8 text-center text-slate-600 text-sm">
        <p>© 2026 - Minimal Inventory Platform</p>
      </footer>
    </div>
  );
};

export default App;