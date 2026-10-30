import { PrioridadReclamo } from '../../models/reclamo.enums';

// ============================================================
// Configuración del algoritmo de prioridad automática.
//
// Puntaje total = puntaje base + puntos de envejecimiento
//   base = categoría + subcategoría + sector + vía + recurrencia
//
// Todo está en tablas simples: para ajustar el criterio basta con cambiar
// un número de este archivo; el algoritmo (shared/utils/prioridad.ts) no se toca.
// ============================================================

export interface RangoPrioridad {
  prioridad: PrioridadReclamo;
  desde: number;
  hasta: number; // ambos extremos incluidos
}

// Cada nivel de prioridad corresponde a un rango de puntos.
export const RANGOS_PRIORIDAD: ReadonlyArray<Readonly<RangoPrioridad>> = [
  { prioridad: PrioridadReclamo.BAJA, desde: 0, hasta: 29 },
  { prioridad: PrioridadReclamo.MEDIA, desde: 30, hasta: 54 },
  { prioridad: PrioridadReclamo.ALTA, desde: 55, hasta: 79 },
  { prioridad: PrioridadReclamo.URGENTE, desde: 80, hasta: Infinity }
];

// --- Categoría (0 a 20): qué tan ligado está el rubro a la seguridad de las personas ---
export const PUNTOS_CATEGORIA: Readonly<Record<string, number>> = {
  'Seguridad y Ruidos': 20,
  'Infraestructura Urbana': 15,
  'Alumbrado Público': 10,
  'Aseo y Ornato': 5
};
export const PUNTOS_CATEGORIA_DEFECTO = 5;

// --- Subcategoría (0 a 40): gravedad del problema concreto. Es el criterio de mayor peso ---
export const PUNTOS_SUBCATEGORIA: Readonly<Record<string, number>> = {
  'Inseguridad': 40,
  'Poste Dañado': 34,
  'Bache / Evento': 28,
  'Señalética Caída': 22,
  'Vereda Rota': 18,
  'Vehículo Abandonado': 14,
  'Luminaria Apagada': 14,
  'Escombros': 12,
  'Ruido Molesto': 8,
  'Microbasural': 8,
  'Foco Parpadeando': 6,
  'Corte de césped': 2
};
// Subcategoría que todavía no está en la tabla (por ejemplo, una nueva): puntaje intermedio.
export const PUNTOS_SUBCATEGORIA_DEFECTO = 10;

// --- Sector (0 a 12): población y densidad del sector (borough) donde ocurre el problema ---
// Orden de magnitud según el censo 2020: más gente expuesta, más puntos.
export const PUNTOS_SECTOR: Readonly<Record<string, number>> = {
  'Manhattan': 12,
  'Brooklyn': 11,
  'Queens': 8,
  'The Bronx': 8,
  'Staten Island': 3
};
// Reclamo sin sector identificado: no se premia ni se castiga.
export const PUNTOS_SECTOR_DEFECTO = 6;

// --- Vía (0 u 8): una avenida o vía principal expone a más personas y vehículos ---
// Se detecta en la dirección del reclamo (ya sin tildes y en minúsculas).
export const PUNTOS_VIA_PRINCIPAL = 8;
export const PALABRAS_VIA_PRINCIPAL: readonly string[] = [
  'av', 'ave', 'avenida', 'avenue', 'blvd', 'boulevard', 'broadway',
  'expressway', 'expy', 'highway', 'hwy', 'parkway', 'pkwy', 'freeway',
  'autopista', 'turnpike', 'bridge', 'puente', 'tunnel', 'tunel'
];

// --- Recurrencia (0 o 4): un problema que se repite merece más atención ---
export const PUNTOS_RECURRENTE = 4;

// ============================================================
// Envejecimiento (evita que un reclamo de baja prioridad espere para siempre)
//
// puntos = min(TOPE, floor(díasEnEspera × PUNTOS_POR_DIA))
//
// Con 0,5 puntos por día, un reclamo gana 15 puntos por mes de espera.
// El tope es mayor que el puntaje base máximo posible (ver prioridad.spec.ts): así,
// con el tiempo, cualquier reclamo termina superando a uno recién ingresado,
// sin importar lo grave que este sea.
// ============================================================
export const PUNTOS_ENVEJECIMIENTO_POR_DIA = 0.5;
export const TOPE_ENVEJECIMIENTO = 90;
