export enum EstadoReclamo {
  RECIBIDO = 'Recibido',
  EN_REVISION = 'En revisión',
  EN_PROCESO = 'En proceso',
  RESUELTO = 'Resuelto',
  RECHAZADO = 'Rechazado',
  CERRADO = 'Cerrado'
}

export enum PrioridadReclamo {
  BAJA = 'Baja',
  MEDIA = 'Media',
  ALTA = 'Alta',
  URGENTE = 'Urgente'
}

export enum RolUsuario {
  CIUDADANO = 'Ciudadano',
  ADMINISTRADOR = 'Administrador'
}