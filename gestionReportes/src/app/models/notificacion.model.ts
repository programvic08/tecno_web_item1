export type TipoNotificacion = 'bitacora' | 'asignacion' | 'nuevo-reclamo' | 'rechazo' | 'resolucion';

export interface Notificacion {
  id: string;
  usuarioId: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  folio: string;
  fecha: string;
  leida: boolean;
}
