export interface Producto {
  id?: number;
  nombre: string;
  stock: number;
}

export interface InventoryResponse {
  success: boolean;
  message?: string;
}