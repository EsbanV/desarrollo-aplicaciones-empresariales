import { useState, useMemo } from 'react';
import { useFetch } from './hooks';
import { Search, Users, ShieldCheck, Mail } from 'lucide-react'; // Iconos para un look más pro

// Importación de componentes shadcn/ui
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol?: string;
}

function App() {
  const [terminoBusqueda, setTerminoBusqueda] = useState<string>('');

  const { data: usuarios, loading, error } = useFetch<Usuario[]>('/api/v1/usuarios/');

  const usuariosFiltrados = useMemo(() => {
    if (!usuarios) return [];
    return usuarios.filter(usuario =>
      usuario.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase())
    );
  }, [usuarios, terminoBusqueda]);

  // Función para obtener iniciales del Avatar
  const getInitials = (nombre: string) => {
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // Función para el color del Badge según el rol
  const getBadgeVariant = (rol?: string) => {
    switch (rol?.toLowerCase()) {
      case 'admin': return 'destructive'; // Rojo
      case 'editor': return 'default';     // Negro/Azul
      default: return 'secondary';         // Gris
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center animate-pulse text-muted-foreground">
      <Users className="mr-2 h-6 w-6" /> Cargando base de datos de usuarios...
    </div>
  );

  if (error) return (
    <div className="flex h-screen items-center justify-center p-4">
      <Card className="border-destructive bg-destructive/10 max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">Error de Conexión</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">

        {/* Header con Shadcn */}
        <header className="mb-8 space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl text-slate-900">
              Gestión de Usuarios
            </h1>
            <Badge variant="outline" className="text-sm font-medium px-3 py-1">
              v1.0 - API Management
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Filtrando en tiempo real entre {usuariosFiltrados.length} usuarios registrados.
          </p>
          <Separator className="my-4" />
        </header>

        {/* Buscador Estilizado */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            className="pl-10 h-12 text-lg shadow-sm bg-white"
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
          />
        </div>

        {/* Grid de Usuarios */}
        <main>
          {usuariosFiltrados.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg border border-dashed">
              <p className="text-muted-foreground italic">No se encontraron usuarios que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {usuariosFiltrados.map(usuario => (
                <Card key={usuario.id} className="overflow-hidden hover:shadow-md transition-all border-slate-200">
                  <CardHeader className="flex flex-row items-center space-y-0 gap-4 pb-2">
                    <Avatar className="h-12 w-12 border">
                      <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold">
                        {getInitials(usuario.nombre)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col truncate">
                      <CardTitle className="text-lg truncate">{usuario.nombre}</CardTitle>
                      <Badge variant={getBadgeVariant(usuario.rol)} className="w-fit mt-1 text-[10px] uppercase tracking-wider">
                        {usuario.rol || 'Sin Rol'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="mr-2 h-3 w-3" />
                      <span className="truncate">{usuario.email}</span>
                    </div>
                    <div className="flex items-center text-xs text-slate-400">
                      <ShieldCheck className="mr-2 h-3 w-3" />
                      ID: {usuario.id}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;