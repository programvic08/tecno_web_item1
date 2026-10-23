import { RolUsuario } from '../models/reclamo.enums';
import { Usuario } from '../models/usuario.model';

// Usuarios fijos para los tests. Los ids coinciden con los de las cuentas de demostración de AuthService.
export const USUARIO_ADMIN_PRUEBA: Usuario = {
  id: 2, nombre: 'Admin de Prueba', email: 'admin@gmail.com',
  rol: RolUsuario.ADMINISTRADOR, telefono: '', direccion: ''
};

export const USUARIO_AGENTE_PRUEBA: Usuario = {
  id: 3, nombre: 'Agente Pérez', email: 'agente@gmail.com',
  rol: RolUsuario.AGENTE, telefono: '', direccion: ''
};

export const USUARIO_CIUDADANO_PRUEBA: Usuario = {
  id: 1, nombre: 'Ciudadano de Prueba', email: 'ciudadano@gmail.com',
  rol: RolUsuario.CIUDADANO, telefono: '', direccion: ''
};
