import { RolUsuario } from './reclamo.enums';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  telefono: string;
  direccion: string;
}

// DTO: solo los campos que el usuario puede modificar desde su perfil
// (el correo y el rol no se editan).
export interface ActualizarPerfilDto {
  nombre: string;
  telefono: string;
  direccion: string;
}

// DTO de inicio de sesión: lo que envía el formulario de login
export interface LoginDto {
  email: string;
  password: string;
}

// DTO de registro: lo que envía el formulario de "Crear cuenta".
// No incluye el rol a propósito: las cuentas nuevas son siempre de ciudadano.
export interface RegistroDto {
  nombre: string;
  email: string;
  password: string;
}

// Cuenta creada desde el registro, tal como se guarda en localStorage
// (simula la tabla de usuarios de un backend). No guarda el rol: al leerla,
// el servicio siempre la trata como ciudadano.
export interface UsuarioRegistrado extends Omit<Usuario, 'rol'> {
  password: string;
}

// Cuenta de demostración (solo para simular el backend)
export interface CuentaPrueba extends LoginDto {
  rol: RolUsuario;
}

// Agente al que se le puede asignar un reclamo (lo que lista el selector del administrador)
export type AgenteAsignable = Pick<Usuario, 'id' | 'nombre'>;

// Contenido (payload) del token de sesión simulado
export interface TokenPayload {
  sub: string;   // id del usuario
  rol: RolUsuario;
  iat: number;   // emitido en (segundos desde epoch)
  exp: number;   // expira en (segundos desde epoch)
}
