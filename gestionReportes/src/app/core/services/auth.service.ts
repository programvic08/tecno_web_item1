import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { BehaviorSubject, Observable, map, tap, timer } from 'rxjs';
import { RolUsuario } from '../../models/reclamo.enums';
import { RUTAS } from '../config/navegacion.config';
import {
  ActualizarPerfilDto,
  CuentaPrueba,
  LoginDto,
  RegistroDto,
  TokenPayload,
  Usuario,
  UsuarioRegistrado
} from '../../models/usuario.model';

// Valor del query param con el que se avisa en el login que la sesión venció
export const MOTIVO_SESION_EXPIRADA = 'sesion-expirada';

// Valor del query param con el que se avisa en el login que la cuenta se creó
export const MOTIVO_CUENTA_CREADA = 'cuenta-creada';

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

  // Duración de la sesión: 20 minutos. Para probar la expiración rápido, bajar este valor.
  private readonly duracionSesionSeg = 20 * 60;

  // El token se guarda en sessionStorage: se borra al cerrar la pestaña.
  private readonly claveToken = 'auth_token';

  // Cuentas creadas desde la pantalla de registro (localStorage: persisten
  // entre sesiones). Debe declararse antes de los BehaviorSubject.
  private readonly claveUsuarios = 'usuarios_registrados';
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

  // Valida las credenciales (cuentas de prueba o cuentas registradas). Simula
  // una llamada al servidor (pequeña espera) y emite el usuario si son
  // correctas o un error si no lo son.
  iniciarSesion(credenciales: LoginDto): Observable<Usuario> {
    return timer(400).pipe(
      map(() => {
        const email = credenciales.email.trim().toLowerCase();
        const id = this.buscarIdPorCredenciales(email, credenciales.password);
        const usuario = id !== null ? this.leerPerfil(id) : null;

        if (!usuario) {
          throw new Error('Correo o contraseña incorrectos.');
        }
        return usuario;
      }),
      tap(usuario => this.abrirSesion(usuario))
    );
  }

  // Crea una cuenta nueva. El rol NO viene del formulario: el registro público
  // solo crea ciudadanos. Las cuentas de administrador existen únicamente
  // como cuentas de prueba (o, con backend, las crearía otro administrador).
  registrarCiudadano(datos: RegistroDto): Observable<void> {
    return timer(400).pipe(
      map(() => {
        const email = datos.email.trim().toLowerCase();

        if (this.correoYaRegistrado(email)) {
          throw new Error('Ya existe una cuenta con ese correo.');
        }

        const registrados = this.leerRegistrados();
        const nueva: UsuarioRegistrado = {
          id: this.siguienteId(registrados),
          nombre: datos.nombre.trim(),
          email,
          password: datos.password,
          telefono: '',
          direccion: ''
        };

        localStorage.setItem(this.claveUsuarios, JSON.stringify([...registrados, nueva]));
      })
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
        return RUTAS.inicioCiudadano;
      case RolUsuario.ADMINISTRADOR:
        return RUTAS.inicioAdmin;
      default:
        return '/login';
    }
  }

  // Al abrir sesión, generamos un token JWT simulado (con fecha de expiración)
  // y lo guardamos en sessionStorage.
  private abrirSesion(usuario: Usuario): void {
    const iat = this.ahoraEnSegundos();
    const exp = iat + this.duracionSesionSeg;

    // El payload no incluye el nombre: es editable y btoa falla con
    // caracteres fuera de Latin-1 (por ejemplo, emojis).
    const payload: TokenPayload = { sub: String(usuario.id), rol: usuario.rol, iat, exp };

    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const signature = "signature_simulada_sprint1";
    const mockJwtToken = `${header}.${btoa(JSON.stringify(payload))}.${signature}`;

    sessionStorage.setItem(this.claveToken, mockJwtToken);

    // Actualizamos los BehaviorSubjects en memoria
    this.loggedInSubject.next(true);
    this.currentUserRoleSubject.next(usuario.rol);
    this.usuarioSubject.next(usuario);

    this.programarExpiracion(exp);
  }

  // Al cerrar sesión borramos el token. El perfil editado (user_profile_<id>,
  // en localStorage) se conserva para el próximo inicio de sesión.
  logout(): void {
    sessionStorage.removeItem(this.claveToken);
    this.cancelarTemporizador();

    this.loggedInSubject.next(false);
    this.currentUserRoleSubject.next(null);
    this.usuarioSubject.next(null);
  }

  // Hay sesión solo si el token existe, es legible, pertenece a una cuenta
  // que existe y todavía no venció.
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
    localStorage.setItem(this.clavePerfil(actual.id), JSON.stringify(actualizado));
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

  // Payload solo si el token es legible, no venció, la cuenta existe y el rol
  // del token coincide con el de la cuenta.
  private obtenerSesionValida(): TokenPayload | null {
    const payload = this.leerPayload();
    if (!payload || payload.exp <= this.ahoraEnSegundos()) {
      return null;
    }

    const base = this.obtenerUsuarioBase(Number(payload.sub));
    if (!base || base.rol !== payload.rol) {
      return null;
    }
    return payload;
  }

  // --- Cuentas ---

  // Busca el id de la cuenta cuyo correo y contraseña coinciden (null si ninguna)
  private buscarIdPorCredenciales(email: string, password: string): number | null {
    const prueba = this.credencialesMock.find(c => c.email === email && c.password === password);
    if (prueba) {
      return this.usuariosMock[prueba.rol].id;
    }

    const registrada = this.leerRegistrados().find(u => u.email === email && u.password === password);
    return registrada ? registrada.id : null;
  }

  private correoYaRegistrado(email: string): boolean {
    return this.credencialesMock.some(c => c.email === email)
      || this.leerRegistrados().some(u => u.email === email);
  }

  private siguienteId(registrados: UsuarioRegistrado[]): number {
    const ids = [
      ...Object.values(this.usuariosMock).map(u => u.id),
      ...registrados.map(u => u.id)
    ];
    return Math.max(...ids) + 1;
  }

  private leerRegistrados(): UsuarioRegistrado[] {
    try {
      const datos = JSON.parse(localStorage.getItem(this.claveUsuarios) ?? '[]');
      return Array.isArray(datos) ? datos : [];
    } catch {
      // JSON corrupto en localStorage: se ignora
      return [];
    }
  }

  // Cuenta sin contraseña. Las cuentas registradas son SIEMPRE ciudadanos,
  // aunque alguien edite el localStorage a mano.
  private aUsuario(registrada: UsuarioRegistrado): Usuario {
    return {
      id: registrada.id,
      nombre: registrada.nombre,
      email: registrada.email,
      rol: RolUsuario.CIUDADANO,
      telefono: registrada.telefono ?? '',
      direccion: registrada.direccion ?? ''
    };
  }

  // Datos base de una cuenta (de prueba o registrada), sin los cambios de perfil
  private obtenerUsuarioBase(id: number): Usuario | null {
    const prueba = Object.values(this.usuariosMock).find(u => u.id === id);
    if (prueba) {
      return prueba;
    }

    const registrada = this.leerRegistrados().find(u => u.id === id);
    return registrada ? this.aUsuario(registrada) : null;
  }

  // --- Perfil ---

  private getStoredUser(): Usuario | null {
    const sesion = this.obtenerSesionValida();
    return sesion ? this.leerPerfil(Number(sesion.sub)) : null;
  }

  private clavePerfil(id: number): string {
    return `user_profile_${id}`;
  }

  // Cuenta con los cambios de perfil guardados (nombre, teléfono, dirección)
  private leerPerfil(id: number): Usuario | null {
    const base = this.obtenerUsuarioBase(id);
    if (!base) {
      return null;
    }

    const guardado = localStorage.getItem(this.clavePerfil(id));
    if (!guardado) {
      return base;
    }

    try {
      // id, correo y rol no se editan: siempre mandan los de la cuenta
      return {
        ...base,
        ...(JSON.parse(guardado) as Partial<Usuario>),
        id: base.id,
        email: base.email,
        rol: base.rol
      };
    } catch {
      // JSON corrupto en localStorage: se ignora y se usa el perfil base
      return base;
    }
  }
}
