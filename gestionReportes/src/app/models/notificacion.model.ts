export type TipoNotificacion = 'bitacora' | 'asignacion';

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
