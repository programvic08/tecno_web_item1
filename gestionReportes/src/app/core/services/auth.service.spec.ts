import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
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
