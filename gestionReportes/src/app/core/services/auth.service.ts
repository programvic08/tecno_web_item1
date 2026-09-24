import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { BehaviorSubject, Observable, map, tap, timer } from 'rxjs';
import { RolUsuario } from '../../models/reclamo.enums';
import { ActualizarPerfilDto, CuentaPrueba, LoginDto, TokenPayload, Usuario } from '../../models/usuario.model';

// Valor del query param con el que se avisa en el login que la sesión venció
export const MOTIVO_SESION_EXPIRADA = 'sesion-expirada';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Perfiles base de las cuentas de prueba (se simulan hasta tener backend).
  // Debe declararse antes de los BehaviorSubject, que la usan al inicializarse.
  private readonly usuariosMock: Record<RolUsuario, Usuario> = {
    [RolUsuario.CIUDADANO]: {
      id: 1,
      nombre: 'Ciudadano de Prueba',
      email: 'ciudadano@gmail.com',
      rol: RolUsuario.CIUDADANO,
      telefono: '',
      direccion: ''
    },
    [RolUsuario.ADMINISTRADOR]: {
      id: 2,
      nombre: 'Agente Municipal de Prueba',
      email: 'admin@gmail.com',
      rol: RolUsuario.ADMINISTRADOR,
      telefono: '',
      direccion: ''
    }
  };

  // Credenciales simuladas: viven aquí (y no en el componente) para que el día
  // que exista un backend solo cambie este servicio.
  private readonly credencialesMock: CuentaPrueba[] = [
    { email: 'ciudadano@gmail.com', password: '123456', rol: RolUsuario.CIUDADANO },
    { email: 'admin@gmail.com', password: '123456', rol: RolUsuario.ADMINISTRADOR }
  ];

  // Duración de la sesión: 30 minutos. Para probar la expiración rápido,
  // bájala temporalmente (por ejemplo a 20 segundos).
  private readonly duracionSesionSeg = 20 * 60;

  // El token se guarda en sessionStorage: se borra al cerrar la pestaña.
  private readonly claveToken = 'auth_token';
  private temporizadorExpiracion: ReturnType<typeof setTimeout> | null = null;

  private loggedInSubject = new BehaviorSubject<boolean>(this.estaAutenticado());
  private currentUserRoleSubject = new BehaviorSubject<RolUsuario | null>(this.obtenerRolActual());
  private usuarioSubject = new BehaviorSubject<Usuario | null>(this.getStoredUser());

  public isLoggedIn$: Observable<boolean> = this.loggedInSubject.asObservable();
  public rol$: Observable<RolUsuario | null> = this.currentUserRoleSubject.asObservable();
  public usuario$: Observable<Usuario | null> = this.usuarioSubject.asObservable();

  constructor(private router: Router) {
    // Limpieza: versiones anteriores guardaban la sesión en localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');

    // Si se recargó la pestaña con una sesión vigente, se reprograma el vencimiento
    const sesion = this.obtenerSesionValida();
    if (sesion) {
      this.programarExpiracion(sesion.exp);
    }
  }

  // Valida las credenciales. Simula una llamada al servidor (pequeña espera) y
  // emite el usuario si son correctas o un error si no lo son.
  iniciarSesion(credenciales: LoginDto): Observable<Usuario> {
    return timer(400).pipe(
      map(() => {
        const email = credenciales.email.trim().toLowerCase();
        const cuenta = this.credencialesMock.find(
          c => c.email === email && c.password === credenciales.password
        );

        if (!cuenta) {
          throw new Error('Correo o contraseña incorrectos.');
        }
        return cuenta.rol;
      }),
      tap(rol => this.abrirSesion(rol)),
      map(rol => this.leerPerfil(rol))
    );
  }

  // Cuentas de demostración que se muestran en el login
  obtenerCuentasPrueba(): CuentaPrueba[] {
    return this.credencialesMock;
  }

  // Ruta de inicio según el rol (un único lugar para redirecciones)
  obtenerRutaInicio(rol: RolUsuario | null): string {
    switch (rol) {
      case RolUsuario.CIUDADANO:
        return '/userHome';
      case RolUsuario.ADMINISTRADOR:
        return '/adminHome';
      default:
        return '/login';
    }
  }

  // Al abrir sesión, generamos un token JWT simulado (con fecha de expiración)
  // y lo guardamos en sessionStorage.
  private abrirSesion(rol: RolUsuario): void {
    const usuario = this.leerPerfil(rol);
    const iat = this.ahoraEnSegundos();
    const exp = iat + this.duracionSesionSeg;

    // El payload no incluye el nombre: es editable y btoa falla con
    // caracteres fuera de Latin-1 (por ejemplo, emojis).
    const payload: TokenPayload = { sub: String(usuario.id), rol, iat, exp };

    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const signature = "signature_simulada_sprint1";
    const mockJwtToken = `${header}.${btoa(JSON.stringify(payload))}.${signature}`;

    sessionStorage.setItem(this.claveToken, mockJwtToken);

    // Actualizamos los BehaviorSubjects en memoria
    this.loggedInSubject.next(true);
    this.currentUserRoleSubject.next(rol);
    this.usuarioSubject.next(usuario);

    this.programarExpiracion(exp);
  }

  // Al cerrar sesión borramos el token. El perfil editado (user_profile_<rol>,
  // en localStorage) se conserva para el próximo inicio de sesión.
  logout(): void {
    sessionStorage.removeItem(this.claveToken);
    this.cancelarTemporizador();

    this.loggedInSubject.next(false);
    this.currentUserRoleSubject.next(null);
    this.usuarioSubject.next(null);
  }

  // Hay sesión solo si el token existe, es legible, tiene un rol válido
  // y todavía no venció.
  estaAutenticado(): boolean {
    return this.obtenerSesionValida() !== null;
  }

  obtenerRolActual(): RolUsuario | null {
    return this.obtenerSesionValida()?.rol ?? null;
  }

  obtenerUsuarioActual(): Usuario | null {
    return this.usuarioSubject.value;
  }

  // True si había un token pero ya venció (sirve para avisarle al usuario)
  haExpiradoLaSesion(): boolean {
    const payload = this.leerPayload();
    return payload !== null && payload.exp <= this.ahoraEnSegundos();
  }

  // Ruta de login para los guards. Si la sesión había vencido, limpia el token
  // viejo y agrega un aviso para mostrarlo en la pantalla de login.
  crearUrlLogin(): UrlTree {
    const expirada = this.haExpiradoLaSesion();
    if (expirada) {
      this.logout();
    }
    return this.router.createUrlTree(
      ['/login'],
      expirada ? { queryParams: { motivo: MOTIVO_SESION_EXPIRADA } } : {}
    );
  }

  actualizarPerfil(cambios: ActualizarPerfilDto): void {
    const actual = this.usuarioSubject.value;
    if (!actual) {
      return;
    }

    const actualizado: Usuario = { ...actual, ...cambios };
    localStorage.setItem(this.clavePerfil(actual.rol), JSON.stringify(actualizado));
    this.usuarioSubject.next(actualizado);
  }

  // --- Vencimiento de la sesión ---

  private programarExpiracion(exp: number): void {
    this.cancelarTemporizador();
    const msRestantes = Math.max(exp * 1000 - Date.now(), 0);
    this.temporizadorExpiracion = setTimeout(() => this.cerrarPorExpiracion(), msRestantes);
  }

  private cancelarTemporizador(): void {
    if (this.temporizadorExpiracion !== null) {
      clearTimeout(this.temporizadorExpiracion);
      this.temporizadorExpiracion = null;
    }
  }

  private cerrarPorExpiracion(): void {
    this.logout();
    this.router.navigate(['/login'], { queryParams: { motivo: MOTIVO_SESION_EXPIRADA } });
  }

  // --- Lectura del token ---

  private ahoraEnSegundos(): number {
    return Math.floor(Date.now() / 1000);
  }

  // Decodifica el payload del token. Devuelve null si no hay token o si está
  // mal formado (por ejemplo, si alguien lo manipuló).
  private leerPayload(): TokenPayload | null {
    const token = sessionStorage.getItem(this.claveToken);
    if (!token) {
      return null;
    }

    try {
      const partes = token.split('.');
      if (partes.length !== 3) {
        return null;
      }

      const payload = JSON.parse(atob(partes[1])) as Partial<TokenPayload> | null;
      if (!payload || typeof payload.rol !== 'string' || typeof payload.exp !== 'number') {
        return null;
      }
      return payload as TokenPayload;
    } catch {
      // Base64 o JSON inválido
      return null;
    }
  }

  // Payload solo si el token es legible, no venció y su rol existe
  private obtenerSesionValida(): TokenPayload | null {
    const payload = this.leerPayload();
    if (!payload || payload.exp <= this.ahoraEnSegundos() || !this.usuariosMock[payload.rol]) {
      return null;
    }
    return payload;
  }

  // --- Perfil ---

  private getStoredUser(): Usuario | null {
    const sesion = this.obtenerSesionValida();
    return sesion ? this.leerPerfil(sesion.rol) : null;
  }

  private clavePerfil(rol: RolUsuario): string {
    return `user_profile_${rol}`;
  }

  private leerPerfil(rol: RolUsuario): Usuario {
    const base = this.usuariosMock[rol];
    const guardado = localStorage.getItem(this.clavePerfil(rol));

    if (!guardado) {
      return base;
    }

    try {
      return { ...base, ...(JSON.parse(guardado) as Partial<Usuario>), rol };
    } catch {
      // JSON corrupto en localStorage: se ignora y se usa el perfil base
      return base;
    }
  }
}
