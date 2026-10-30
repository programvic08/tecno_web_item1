import { EstadoReclamo, PrioridadReclamo } from './reclamo.enums';

// Texto que se muestra mientras ningún agente tiene el reclamo
export const SIN_ASIGNAR = 'Sin asignar';

// Registro de una observación dejada por un agente al gestionar el reclamo
export interface EntradaBitacora {
  fecha: string;
  autor: string;
  estado: string;
  observacion: string;
}

// Desglose del puntaje de prioridad (lo calcula shared/utils/prioridad.ts)
export interface PuntajePrioridad {
  categoria: number;
  subcategoria: number;
  sector: number;
  via: number;
  recurrencia: number;
  base: number;           // suma de los cinco criterios anteriores
  envejecimiento: number; // puntos ganados por el tiempo de espera
  total: number;          // base + envejecimiento
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
  evidenciaTipo?: string;     // siempre una imagen: 'image/png', 'image/jpeg', 'image/webp', etc.
  evidenciaDataUrl?: string;  // contenido del archivo en base64 (data URL)
  fecha: string;
  fechaResolucion?: string;
  resultadoCierre?: 'Resuelto' | 'Rechazado';
  prioridad: PrioridadReclamo;    // la asigna el sistema según el puntaje; no se edita a mano
  puntaje?: PuntajePrioridad;
  estado: EstadoReclamo;
  agenteAsignado: string;          // nombre para mostrar
  agenteId?: number | null;        // id del agente responsable (la autorización usa este dato, no el nombre)
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