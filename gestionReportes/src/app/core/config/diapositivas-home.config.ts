import { DiapositivaHome } from '../../models/diapositiva-home.model';
import { RUTAS } from './navegacion.config';

export const DIAPOSITIVAS_HOME: DiapositivaHome[] = [
  {
    id: 'crear-reclamo',
    etiqueta: 'Atención ciudadana',
    titulo: '¿Necesitas reportar un problema?',
    descripcion:
      'Informa problemas relacionados con aseo, alumbrado, infraestructura urbana, ruidos u otras situaciones de tu sector.',
    boton: 'Crear reclamo',
    ruta: RUTAS.crear,
    tema: 1
  },
  {
    id: 'consultar-estado',
    etiqueta: 'Seguimiento',
    titulo: '¿Ya realizaste un reclamo?',
    descripcion:
      'Consulta el estado actual de tus solicitudes y revisa cómo avanza su gestión.',
    boton: 'Consultar estado',
    ruta: RUTAS.estado,
    tema: 2
  },
  {
    id: 'historial',
    etiqueta: 'Tus solicitudes',
    titulo: 'Revisa tus reclamos anteriores',
    descripcion:
      'Consulta el historial de reclamos que has registrado y accede a su información.',
    boton: 'Ver historial',
    ruta: RUTAS.historial,
    tema: 3
  },
  {
    id: 'reportes-frecuentes',
    etiqueta: 'Guía de reclamos',
    titulo: '¿Quieres conocer los tipos de reclamos?',
    descripcion:
      'Consulta qué significa cada tipo de reclamo y qué información necesitas para reportarlo.',
    boton: 'Conocer los reclamos',
    urlPdf: 'assets/docs/guia-tipos-reclamos.pdf',
    tema: 4
  }
];