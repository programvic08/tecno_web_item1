import { DiapositivaHome } from '../../models/diapositiva-home.model';
import { RUTAS } from './navegacion.config';

export const DIAPOSITIVAS_HOME: DiapositivaHome[] = [
  { id: 'crear-reclamo', etiqueta: 'Atención ciudadana', titulo: '¿Necesitas reportar un problema?',
    descripcion: 'Informa problemas relacionados con aseo, alumbrado, infraestructura urbana, ruidos u otras situaciones de tu sector.',
    boton: 'Crear reclamo', ruta: RUTAS.crear, tema: 1 },
  { id: 'consultar-estado', etiqueta: 'Seguimiento', titulo: '¿Ya realizaste un reclamo?',
    descripcion: 'Consulta el estado actual de tus solicitudes y revisa cómo avanza su gestión.',
    boton: 'Consultar estado', ruta: RUTAS.estado, tema: 2 },
  { id: 'historial', etiqueta: 'Tus solicitudes', titulo: 'Revisa tus reclamos anteriores',
    descripcion: 'Consulta el historial de reclamos que has registrado y accede a su información.',
    boton: 'Ver historial', ruta: RUTAS.historial, tema: 3 },
  { id: 'reportes-frecuentes', etiqueta: 'Reportes predefinidos', titulo: 'Reporta problemas frecuentes más rápido',
    descripcion: 'Utiliza los modelos predefinidos para problemas habituales y completa solo los datos específicos del lugar, fecha y evidencia.',
    boton: 'Ver reportes frecuentes', seccionDestino: 'reportes-frecuentes', tema: 4 }
];
