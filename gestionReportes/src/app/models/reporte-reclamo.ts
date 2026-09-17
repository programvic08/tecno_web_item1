export interface EstadoConteo {
  estado: string;
  cantidad: number;
}

export interface CategoriaConteo {
  categoria: string;
  cantidad: number;
}

export interface ReporteReclamo {
  totalReclamos: number;
  tiempoPromedioResolucionDias: number;
  reclamosPorEstado: EstadoConteo[];
  reclamosPorCategoria: CategoriaConteo[];
}