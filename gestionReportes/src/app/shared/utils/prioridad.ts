import {
  PALABRAS_VIA_PRINCIPAL, PUNTOS_CATEGORIA, PUNTOS_CATEGORIA_DEFECTO, PUNTOS_ENVEJECIMIENTO_POR_DIA,
  PUNTOS_RECURRENTE, PUNTOS_SECTOR, PUNTOS_SECTOR_DEFECTO, PUNTOS_SUBCATEGORIA,
  PUNTOS_SUBCATEGORIA_DEFECTO, PUNTOS_VIA_PRINCIPAL, RANGOS_PRIORIDAD, TOPE_ENVEJECIMIENTO
} from '../../core/config/prioridad.config';
import { EstadoReclamo, PrioridadReclamo } from '../../models/reclamo.enums';
import { PuntajePrioridad, Reclamo } from '../../models/reclamo.model';

// Datos del reclamo que intervienen en el cálculo
export type DatosPrioridad = Pick<Reclamo,
  'categoria' | 'subcategoria' | 'direccion' | 'esRecurrente' | 'sectorZona' | 'fecha'>;

export interface EvaluacionPrioridad {
  prioridad: PrioridadReclamo;
  puntaje: PuntajePrioridad;
}

const MS_POR_DIA = 86400000;
const ESTADOS_FINALES: EstadoReclamo[] = [EstadoReclamo.CERRADO, EstadoReclamo.RESUELTO, EstadoReclamo.RECHAZADO];

function normalizar(texto: string | undefined): string {
  return (texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

// Las tablas se comparan sin tildes ni mayúsculas, para que "Alumbrado Publico" también coincida.
function indexar(tabla: Readonly<Record<string, number>>): Map<string, number> {
  return new Map<string, number>(
    Object.entries(tabla).map(([clave, puntos]) => [normalizar(clave), puntos] as [string, number])
  );
}

const CATEGORIAS = indexar(PUNTOS_CATEGORIA);
const SUBCATEGORIAS = indexar(PUNTOS_SUBCATEGORIA);
const SECTORES = indexar(PUNTOS_SECTOR);
const VIA_PRINCIPAL = new RegExp('\\b(' + PALABRAS_VIA_PRINCIPAL.join('|') + ')\\b');

export function esReclamoAbierto(reclamo: Pick<Reclamo, 'estado'>): boolean {
  return !ESTADOS_FINALES.includes(reclamo.estado);
}

// ---------- Puntaje base ----------

export function puntosVia(direccion: string | undefined): number {
  return VIA_PRINCIPAL.test(normalizar(direccion)) ? PUNTOS_VIA_PRINCIPAL : 0;
}

export function calcularPuntajeBase(datos: DatosPrioridad): Omit<PuntajePrioridad, 'envejecimiento' | 'total'> {
  const categoria = CATEGORIAS.get(normalizar(datos.categoria)) ?? PUNTOS_CATEGORIA_DEFECTO;
  const subcategoria = SUBCATEGORIAS.get(normalizar(datos.subcategoria)) ?? PUNTOS_SUBCATEGORIA_DEFECTO;
  const sector = SECTORES.get(normalizar(datos.sectorZona)) ?? PUNTOS_SECTOR_DEFECTO;
  const via = puntosVia(datos.direccion);
  const recurrencia = datos.esRecurrente ? PUNTOS_RECURRENTE : 0;
  return { categoria, subcategoria, sector, via, recurrencia, base: categoria + subcategoria + sector + via + recurrencia };
}

// Puntaje base más alto que alguna combinación puede alcanzar (sirve para validar el tope de envejecimiento)
export function puntajeBaseMaximo(): number {
  return Math.max(...CATEGORIAS.values()) + Math.max(...SUBCATEGORIAS.values()) +
    Math.max(...SECTORES.values(), PUNTOS_SECTOR_DEFECTO) + PUNTOS_VIA_PRINCIPAL + PUNTOS_RECURRENTE;
}

// ---------- Envejecimiento ----------

// Días completos entre la fecha de ingreso (AAAA-MM-DD) y hoy. Una fecha inválida o futura cuenta como 0.
export function diasDeEspera(fechaIngreso: string | undefined, ahora: Date = new Date()): number {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(fechaIngreso ?? '');
  if (!partes) return 0;
  const ingreso = Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
  const hoy = Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const dias = Math.round((hoy - ingreso) / MS_POR_DIA);
  return Number.isFinite(dias) && dias > 0 ? dias : 0;
}

export function puntosEnvejecimiento(dias: number): number {
  return Math.min(TOPE_ENVEJECIMIENTO, Math.floor(Math.max(0, dias) * PUNTOS_ENVEJECIMIENTO_POR_DIA));
}

// ---------- Prioridad final ----------

export function prioridadPorPuntaje(total: number): PrioridadReclamo {
  const rango = [...RANGOS_PRIORIDAD].reverse().find(r => total >= r.desde);
  return rango ? rango.prioridad : RANGOS_PRIORIDAD[0].prioridad;
}

export function evaluarPrioridad(datos: DatosPrioridad, ahora: Date = new Date()): EvaluacionPrioridad {
  const base = calcularPuntajeBase(datos);
  const envejecimiento = puntosEnvejecimiento(diasDeEspera(datos.fecha, ahora));
  const total = base.base + envejecimiento;
  return { prioridad: prioridadPorPuntaje(total), puntaje: { ...base, envejecimiento, total } };
}

// Orden de la bandeja: primero los abiertos, de mayor a menor puntaje; a igualdad de puntaje, el más antiguo.
export function compararPorUrgencia(a: Reclamo, b: Reclamo): number {
  const abiertoA = esReclamoAbierto(a);
  const abiertoB = esReclamoAbierto(b);
  if (abiertoA !== abiertoB) return abiertoA ? -1 : 1;
  const diferencia = (b.puntaje?.total ?? 0) - (a.puntaje?.total ?? 0);
  if (diferencia !== 0) return diferencia;
  return a.fecha.localeCompare(b.fecha) || a.id - b.id;
}
