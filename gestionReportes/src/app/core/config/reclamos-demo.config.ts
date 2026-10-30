import { EstadoReclamo, PrioridadReclamo } from '../../models/reclamo.enums';
import { EntradaBitacora, Reclamo } from '../../models/reclamo.model';

// ============================================================
// Reclamos de ejemplo que aparecen al iniciar la aplicación (mientras no hay backend).
// Las fechas son relativas a hoy ("diasAtras") para que el envejecimiento de la prioridad
// se vea siempre, sin importar cuándo se ejecute el proyecto.
// ============================================================

interface Responsable { id: number; nombre: string; }

// Ids y nombres de las cuentas de prueba (ver AuthService)
const CIUDADANO_1 = 1;
const CIUDADANO_2 = 1001;
const AGENTE_PEREZ: Responsable = { id: 3, nombre: 'Agente Pérez' };
const AGENTE_GOMEZ: Responsable = { id: 1002, nombre: 'Agente Gómez' };
const ADMIN: Responsable = { id: 2, nombre: 'Agente Municipal de Prueba' };

interface DatosDemo {
  id: number;
  categoria: string;
  subcategoria: string;
  descripcion: string;
  direccion: string;
  sectorZona: string;
  diasAtras: number;
  estado: EstadoReclamo;
  usuarioId: number;
  esRecurrente?: boolean;
  agente?: Responsable;
  // Solo para reclamos cerrados
  cierre?: 'Resuelto' | 'Rechazado';
  diasHastaCierre?: number;
}

function fechaHace(dias: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return fecha;
}

// AAAA-MM-DD en hora local
export function fechaIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function bitacoraDe(d: DatosDemo, ingreso: Date): EntradaBitacora[] {
  const entrada = (fecha: Date, autor: string, estado: string, observacion: string): EntradaBitacora =>
    ({ fecha: fecha.toISOString(), autor, estado, observacion });
  const dia = (n: number) => new Date(ingreso.getTime() + n * 86400000);

  const bitacora = [entrada(ingreso, 'Sistema', EstadoReclamo.RECIBIDO, 'El reclamo fue recibido y quedó pendiente de asignación.')];
  if (d.estado === EstadoReclamo.RECIBIDO || !d.agente) return bitacora;

  bitacora.push(entrada(dia(1), ADMIN.nombre, EstadoReclamo.EN_REVISION, 'Caso asignado a ' + d.agente.nombre + '.'));
  if (d.estado === EstadoReclamo.EN_REVISION) return bitacora;

  bitacora.push(entrada(dia(2), d.agente.nombre, EstadoReclamo.EN_PROCESO, 'Se programó la visita de una cuadrilla al lugar.'));
  if (d.estado === EstadoReclamo.EN_PROCESO) return bitacora;

  const cierre = dia(d.diasHastaCierre ?? 3);
  const resuelto = d.cierre === 'Resuelto';
  bitacora.push(
    entrada(cierre, d.agente.nombre, resuelto ? EstadoReclamo.RESUELTO : EstadoReclamo.RECHAZADO,
      resuelto ? 'El reclamo fue resuelto.' : 'El reclamo no corresponde a la municipalidad.'),
    entrada(cierre, d.agente.nombre, EstadoReclamo.CERRADO, 'Reclamo cerrado por ' + (resuelto ? 'resolución' : 'rechazo') + '.')
  );
  return bitacora;
}

function reclamoDemo(d: DatosDemo): Reclamo {
  const ingreso = fechaHace(d.diasAtras);
  const cerrado = d.estado === EstadoReclamo.CERRADO;
  return {
    id: d.id,
    folio: 'REC-2026-' + String(d.id).padStart(3, '0'),
    categoria: d.categoria,
    subcategoria: d.subcategoria,
    descripcion: d.descripcion,
    esRecurrente: d.esRecurrente ?? false,
    direccion: d.direccion,
    ubicacion: d.direccion,
    sectorZona: d.sectorZona,
    fecha: fechaIso(ingreso),
    fechaResolucion: cerrado && d.cierre === 'Resuelto'
      ? fechaIso(new Date(ingreso.getTime() + (d.diasHastaCierre ?? 3) * 86400000)) : undefined,
    resultadoCierre: cerrado ? d.cierre : undefined,
    // Valor provisional: ReclamoService calcula la prioridad real al cargarlos
    prioridad: PrioridadReclamo.MEDIA,
    estado: d.estado,
    agenteAsignado: d.agente?.nombre ?? 'Sin asignar',
    agenteId: d.agente?.id ?? null,
    usuarioId: d.usuarioId,
    bitacora: bitacoraDe(d, ingreso)
  };
}

export const RECLAMOS_DEMO: ReadonlyArray<Readonly<Reclamo>> = [
  // --- Pendientes de asignación (para probar la asignación desde la bandeja del administrador) ---
  reclamoDemo({ id: 103, categoria: 'Seguridad y Ruidos', subcategoria: 'Inseguridad', usuarioId: CIUDADANO_2,
    descripcion: 'Grupo de personas agrediendo a transeúntes en la esquina, de forma reiterada.',
    direccion: '5th Avenue 120', sectorZona: 'Manhattan', diasAtras: 0, esRecurrente: true, estado: EstadoReclamo.RECIBIDO }),
  reclamoDemo({ id: 104, categoria: 'Infraestructura Urbana', subcategoria: 'Bache / Evento', usuarioId: CIUDADANO_1,
    descripcion: 'Bache profundo en el carril derecho que obliga a los autos a frenar de golpe.',
    direccion: 'Atlantic Avenue 450', sectorZona: 'Brooklyn', diasAtras: 3, estado: EstadoReclamo.RECIBIDO }),
  reclamoDemo({ id: 105, categoria: 'Alumbrado Público', subcategoria: 'Poste Dañado', usuarioId: CIUDADANO_2,
    descripcion: 'Poste inclinado con cables a la vista tras un choque.',
    direccion: 'Queens Boulevard 80-10', sectorZona: 'Queens', diasAtras: 12, estado: EstadoReclamo.RECIBIDO }),
  reclamoDemo({ id: 106, categoria: 'Aseo y Ornato', subcategoria: 'Corte de césped', usuarioId: CIUDADANO_1,
    descripcion: 'El pasto de la plaza del barrio llega a la altura de las rodillas.',
    direccion: 'Hylan Street 55', sectorZona: 'Staten Island', diasAtras: 95, estado: EstadoReclamo.RECIBIDO }),
  reclamoDemo({ id: 107, categoria: 'Seguridad y Ruidos', subcategoria: 'Ruido Molesto', usuarioId: CIUDADANO_1,
    descripcion: 'Música a todo volumen hasta la madrugada, varias noches por semana.',
    direccion: 'E 161st Street 40', sectorZona: 'The Bronx', diasAtras: 20, esRecurrente: true, estado: EstadoReclamo.RECIBIDO }),
  reclamoDemo({ id: 108, categoria: 'Seguridad y Ruidos', subcategoria: 'Inseguridad', usuarioId: CIUDADANO_2,
    descripcion: 'Robos frecuentes a locales de la cuadra, sin presencia de vigilancia.',
    direccion: 'Flatbush Avenue 1200', sectorZona: 'Brooklyn', diasAtras: 45, esRecurrente: true, estado: EstadoReclamo.RECIBIDO }),
  reclamoDemo({ id: 109, categoria: 'Infraestructura Urbana', subcategoria: 'Vereda Rota', usuarioId: CIUDADANO_1,
    descripcion: 'Baldosas levantadas que ya provocaron una caída de un adulto mayor.',
    direccion: 'Lexington Avenue 300', sectorZona: 'Manhattan', diasAtras: 8, estado: EstadoReclamo.RECIBIDO }),

  // --- En revisión ---
  reclamoDemo({ id: 110, categoria: 'Infraestructura Urbana', subcategoria: 'Señalética Caída', usuarioId: CIUDADANO_2,
    descripcion: 'Señal de pare en el suelo desde la tormenta del fin de semana.',
    direccion: 'Broadway 1500', sectorZona: 'Manhattan', diasAtras: 6, estado: EstadoReclamo.EN_REVISION, agente: AGENTE_GOMEZ }),
  reclamoDemo({ id: 111, categoria: 'Alumbrado Público', subcategoria: 'Foco Parpadeando', usuarioId: CIUDADANO_1,
    descripcion: 'El foco de la esquina parpadea toda la noche.',
    direccion: 'Court Street 22', sectorZona: 'Brooklyn', diasAtras: 30, estado: EstadoReclamo.EN_REVISION, agente: AGENTE_PEREZ }),

  // --- En proceso ---
  reclamoDemo({ id: 112, categoria: 'Infraestructura Urbana', subcategoria: 'Vereda Rota', usuarioId: CIUDADANO_2,
    descripcion: 'Vereda hundida frente a la estación, difícil de cruzar con coche de bebé.',
    direccion: 'Roosevelt Avenue 74-01', sectorZona: 'Queens', diasAtras: 25, estado: EstadoReclamo.EN_PROCESO, agente: AGENTE_PEREZ }),
  reclamoDemo({ id: 113, categoria: 'Aseo y Ornato', subcategoria: 'Escombros', usuarioId: CIUDADANO_1,
    descripcion: 'Restos de una obra abandonados sobre la vereda.',
    direccion: 'Jerome Avenue 3200', sectorZona: 'The Bronx', diasAtras: 40, estado: EstadoReclamo.EN_PROCESO, agente: AGENTE_GOMEZ }),
  reclamoDemo({ id: 114, categoria: 'Seguridad y Ruidos', subcategoria: 'Vehículo Abandonado', usuarioId: CIUDADANO_2,
    descripcion: 'Auto sin patente ni ruedas estacionado hace meses.',
    direccion: 'Bay Street 310', sectorZona: 'Staten Island', diasAtras: 18, estado: EstadoReclamo.EN_PROCESO, agente: ADMIN }),

  // --- Cerrados ---
  reclamoDemo({ id: 115, categoria: 'Alumbrado Público', subcategoria: 'Luminaria Apagada', usuarioId: CIUDADANO_1,
    descripcion: 'Tres luminarias apagadas en el tramo de la avenida.',
    direccion: 'Madison Avenue 700', sectorZona: 'Manhattan', diasAtras: 40, estado: EstadoReclamo.CERRADO,
    agente: AGENTE_PEREZ, cierre: 'Resuelto', diasHastaCierre: 15 }),
  reclamoDemo({ id: 116, categoria: 'Aseo y Ornato', subcategoria: 'Microbasural', usuarioId: CIUDADANO_2,
    descripcion: 'Basura acumulada en un sitio eriazo privado.',
    direccion: 'Fulton Street 88', sectorZona: 'Brooklyn', diasAtras: 35, estado: EstadoReclamo.CERRADO,
    agente: AGENTE_GOMEZ, cierre: 'Rechazado', diasHastaCierre: 8 })
];
