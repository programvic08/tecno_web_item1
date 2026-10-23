import { EstadoReclamo, PrioridadReclamo } from './reclamo.enums';

// Registro de una observación dejada por un agente al gestionar el reclamo
export interface EntradaBitacora {
  fecha: string;
  autor: string;
  estado: string;
  observacion: string;
}

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
  evidenciaTipo?: string;     // 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp'
  evidenciaDataUrl?: string;  // contenido del archivo en base64 (data URL)
  fecha: string;
  fechaResolucion?: string;
  prioridad: PrioridadReclamo;
  estado: EstadoReclamo;
  agenteAsignado: string;
  usuarioId?: number;
  bitacora?: EntradaBitacora[];
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
  tiempoPromedioResolucionDias: number | null;
  reclamosPorEstado: { estado: string; cantidad: number }[];
  reclamosPorCategoria: { categoria: string; cantidad: number }[];

  reclamosPorMes?: {
    mes: string;
    cantidad: number | null;
  }[];
}