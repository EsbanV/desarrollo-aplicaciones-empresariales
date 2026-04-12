export interface Empresa {
  id?: number;
  rut: string;
  razon_social: string;
  direccion_casa_matriz?: string;
  giro?: string;
  cant_equipos?: number;
}

export interface Impresora {
  id?: number;
  serial: string;
  modelo: string;
  estado?: string;
  valor_arriendo?: number;
  empresa_id?: number | null;
  cliente_actual?: string;
}

export interface InventoryResponse {
  success: boolean;
  message?: string;
}