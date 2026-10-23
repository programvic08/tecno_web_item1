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
  AGENTE = 'Agente',
  ADMINISTRADOR = 'Administrador'
}

// Roles del personal municipal que gestionan reclamos. El administrador es un agente con
// permisos extra: ve y modifica todos los reclamos y es el único que los asigna.
export const ROLES_PERSONAL: RolUsuario[] = [RolUsuario.AGENTE, RolUsuario.ADMINISTRADOR];