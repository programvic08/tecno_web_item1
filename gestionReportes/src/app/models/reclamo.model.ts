import { EstadoReclamo, PrioridadReclamo } from './reclamo.enums';

export interface Reclamo {
  id: number;
  folio: string;
  categoria: string;
  subcategoria: string;
  descripcion: string;
  esRecurrente: boolean;
  direccion: string;
  fechaHoraObservada?: string;
  ubicacion: string; // Referencia o dirección
  sectorZona?: string;
  evidenciaNombre?: string;
  fecha: string;
  prioridad: PrioridadReclamo;
  estado: EstadoReclamo;
  agenteAsignado: string;
  usuarioId?: number;
}

export interface CategoriaReclamo {
  nombre: string;
  subcategorias: string[];
}

export interface FiltroBandeja {
  estado: string;
  categoria: string;
  prioridad: string;
  ubicacion: string;
}

export interface ReporteEstadistico {
  totalReclamos: number;
  tiempoPromedioResolucionDias: number;
  reclamosPorEstado: { estado: string; cantidad: number }[];
  reclamosPorCategoria: { categoria: string; cantidad: number }[];
}