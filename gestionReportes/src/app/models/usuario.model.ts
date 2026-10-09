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

// Cuenta de demostración (solo para simular el backend)
export interface CuentaPrueba extends LoginDto {
  rol: RolUsuario;
}

// Contenido (payload) del token de sesión simulado
export interface TokenPayload {
  sub: string;   // id del usuario
  rol: RolUsuario;
  iat: number;   // emitido en (segundos desde epoch)
  exp: number;   // expira en (segundos desde epoch)
}
