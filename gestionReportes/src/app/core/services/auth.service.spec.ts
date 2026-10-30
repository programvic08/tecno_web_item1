import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { RolUsuario } from '../../models/reclamo.enums';
import { AgenteRegistrado } from '../../models/usuario.model';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule]
    });
    localStorage.removeItem('agentes_registrados');
    localStorage.removeItem('agentes_base_eliminados');
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    service.logout();
    localStorage.removeItem('agentes_registrados');
    localStorage.removeItem('agentes_base_eliminados');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('cuentas de agente', () => {
    it('crea una cuenta de agente que puede iniciar sesión y asignarse reclamos', async () => {
      await firstValueFrom(service.registrarAgente({
        nombre: 'Agente Nuevo',
        email: 'Nuevo@NYC.gov',
        password: '123456'
      }));

      const nueva = service.obtenerAgentesGestion().find(cuenta => cuenta.email === 'nuevo@nyc.gov');
      expect(nueva).toBeDefined();
      expect(nueva?.nombre).toBe('Agente Nuevo');
      expect(nueva?.activo).toBeTrue();
      expect(nueva?.esCuentaBase).toBeFalse();

      const usuario = await firstValueFrom(service.iniciarSesion({
        email: 'nuevo@nyc.gov',
        password: '123456'
      }));

      expect(usuario.rol).toBe(RolUsuario.AGENTE);
      expect(service.obtenerAgentes().some(agente => agente.nombre === 'Agente Nuevo')).toBeTrue();
    });

    it('no permite crear dos cuentas con el mismo correo', async () => {
      await expectAsync(firstValueFrom(service.registrarAgente({
        nombre: 'Otro Agente',
        email: 'agente@gmail.com',
        password: '123456'
      }))).toBeRejectedWithError('Ya existe una cuenta con ese correo.');
    });

    it('no permite iniciar sesión con una cuenta desactivada', async () => {
      const inactivo: AgenteRegistrado = {
        id: 99,
        nombre: 'Agente Inactivo',
        email: 'inactivo@nyc.gov',
        password: '123456',
        activo: false
      };
      localStorage.setItem('agentes_registrados', JSON.stringify([inactivo]));

      await expectAsync(firstValueFrom(service.iniciarSesion({
        email: 'inactivo@nyc.gov',
        password: '123456'
      }))).toBeRejectedWithError('Tu cuenta está desactivada. Contacta al administrador.');
    });

    it('elimina las cuentas creadas y nunca la propia', async () => {
      await firstValueFrom(service.registrarAgente({
        nombre: 'Agente Temporal',
        email: 'temporal@nyc.gov',
        password: '123456'
      }));

      const nueva = service.obtenerAgentesGestion().find(cuenta => cuenta.email === 'temporal@nyc.gov');
      expect(nueva).toBeDefined();

      service.eliminarAgente(nueva!.id);
      expect(service.obtenerAgentesGestion().some(cuenta => cuenta.id === nueva!.id)).toBeFalse();

      await firstValueFrom(service.iniciarSesion({ email: 'admin@gmail.com', password: '123456' }));
      expect(() => service.eliminarAgente(2)).toThrowError('No puedes eliminar tu propia cuenta.');
    });

    it('permite eliminar la cuenta base del agente y libera su correo', async () => {
      const base = service.obtenerAgentesGestion().find(cuenta => cuenta.email === 'agente@gmail.com');
      expect(base?.esCuentaBase).toBeTrue();
      expect(base?.esAdministrador).toBeFalse();

      service.eliminarAgente(base!.id);

      expect(service.obtenerAgentesGestion().some(cuenta => cuenta.email === 'agente@gmail.com')).toBeFalse();
      expect(service.obtenerAgentes().some(agente => agente.id === base!.id)).toBeFalse();
      expect(service.obtenerCuentasPrueba().some(cuenta => cuenta.email === 'agente@gmail.com')).toBeFalse();

      await expectAsync(firstValueFrom(service.iniciarSesion({
        email: 'agente@gmail.com',
        password: '123456'
      }))).toBeRejectedWithError('Correo o contraseña incorrectos.');

      // El correo de la cuenta eliminada queda disponible para crear otra.
      await expectAsync(firstValueFrom(service.registrarAgente({
        nombre: 'Agente Nuevo',
        email: 'agente@gmail.com',
        password: '123456'
      }))).toBeResolved();
    });

    it('no permite eliminar una cuenta de administrador', async () => {
      await firstValueFrom(service.iniciarSesion({ email: 'agente@gmail.com', password: '123456' }));
      expect(() => service.eliminarAgente(2)).toThrowError('Las cuentas de administrador no se pueden eliminar.');
    });
  });

  it('obtiene ciudadanos registrados por ID y aplica su perfil vigente', () => {
    const clave = 'usuarios_registrados';
    const perfil = 'user_profile_9001';
    const anterior = localStorage.getItem(clave);
    const anteriorPerfil = localStorage.getItem(perfil);
    try {
      localStorage.setItem(clave, JSON.stringify([{ id: 9001, nombre: 'Ana Soto', email: 'ana@example.com', password: 'secreto' }]));
      expect(service.obtenerUsuarioPorId(9001)?.nombre).toBe('Ana Soto');
      localStorage.setItem(perfil, JSON.stringify({ nombre: 'Ana Perez' }));
      expect(service.obtenerUsuarioPorId(9001)?.nombre).toBe('Ana Perez');
      expect((service.obtenerUsuarioPorId(9001) as any).password).toBeUndefined();
      expect(service.obtenerUsuarioPorId(-1)).toBeNull();
    } finally {
      if (anterior === null) localStorage.removeItem(clave); else localStorage.setItem(clave, anterior);
      if (anteriorPerfil === null) localStorage.removeItem(perfil); else localStorage.setItem(perfil, anteriorPerfil);
    }
  });

  it('obtiene los administradores disponibles', () => {
    expect(service.obtenerAdministradores().map(u => u.id)).toEqual([2]);
  });
});
