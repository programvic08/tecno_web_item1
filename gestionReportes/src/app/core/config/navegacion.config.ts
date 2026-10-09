import { RolUsuario } from '../../models/reclamo.enums';
import { ApartadoPortal, PestanaSubnav, TareaRapida } from '../../models/navegacion.model';

// Marca del navbar. La guía pide cambiarla por la del portal al integrar los 5 sistemas.
export const MARCA_PORTAL = 'NYC · Atención Ciudadana';

// Única fuente de rutas: si se renombran (p. ej. a /reclamos/nuevo), solo cambia este objeto.
export const RUTAS = {
  login: '/login',
  inicioCiudadano: '/userHome',
  inicioAdmin: '/adminHome',
  crear: '/crear-reclamo',
  historial: '/historial',
  estado: '/estado-reclamo',
  bandeja: '/bandeja-reclamos',
  modificar: '/modificar-reclamo',
  reportes: '/reporteReclamo',
  perfil: '/perfil'
} as const;

export const PESTANAS_CIUDADANO: PestanaSubnav[] = [
  { etiqueta: 'Nuevo reclamo', ruta: RUTAS.crear },
  { etiqueta: 'Historial', ruta: RUTAS.historial },
  { etiqueta: 'Estado', ruta: RUTAS.estado }
];

export const PESTANAS_ADMIN: PestanaSubnav[] = [
  { etiqueta: 'Bandeja', ruta: RUTAS.bandeja },
  { etiqueta: 'Modificar', ruta: RUTAS.modificar },
  { etiqueta: 'Reportes', ruta: RUTAS.reportes }
];

export const TAREAS_CIUDADANO: TareaRapida[] = [
  { etiqueta: 'Reportar un problema en mi calle', ruta: RUTAS.crear },
  { etiqueta: 'Ver el historial de mis reclamos', ruta: RUTAS.historial },
  { etiqueta: 'Consultar el estado de un reclamo', ruta: RUTAS.estado },
  { etiqueta: 'Actualizar mis datos de contacto', ruta: RUTAS.perfil }
];

export const TAREAS_ADMIN: TareaRapida[] = [
  { etiqueta: 'Revisar los reclamos que llegaron', ruta: RUTAS.bandeja },
  { etiqueta: 'Cambiar el estado o la prioridad de un reclamo', ruta: RUTAS.modificar },
  { etiqueta: 'Ver las estadísticas y reportes', ruta: RUTAS.reportes },
  { etiqueta: 'Actualizar mis datos de perfil', ruta: RUTAS.perfil }
];

// Apartados del portal (guía, sección 5). Los de otros grupos van en gris hasta que
// cada grupo reemplace su enlace por su ruta real.
export function apartadosPortal(rol: RolUsuario | null): ApartadoPortal[] {
  const esAdmin = rol === RolUsuario.ADMINISTRADOR;
  const inicio = esAdmin ? RUTAS.inicioAdmin : RUTAS.inicioCiudadano;

  const apartados: ApartadoPortal[] = [
    { etiqueta: 'Inicio', ruta: inicio, prefijos: [inicio] },
  ];

  if (rol === RolUsuario.CIUDADANO) {
    apartados.push(
      { etiqueta: 'Crear reclamo', ruta: RUTAS.crear, prefijos: [RUTAS.crear] },
      { etiqueta: 'Historial', ruta: RUTAS.historial, prefijos: [RUTAS.historial] },
      { etiqueta: 'Estado', ruta: RUTAS.estado, prefijos: [RUTAS.estado] }
    );
  }


  if (esAdmin) {
    apartados.push(
      { etiqueta: 'Bandeja', ruta: RUTAS.bandeja, prefijos: [RUTAS.bandeja] },
      { etiqueta: 'Modificar', ruta: RUTAS.modificar, prefijos: [RUTAS.modificar] },
      { etiqueta: 'Reportes', ruta: RUTAS.reportes, prefijos: [RUTAS.reportes] }
    );
  }

  return apartados;
}
