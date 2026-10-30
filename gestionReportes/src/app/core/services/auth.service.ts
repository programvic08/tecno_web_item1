import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { BehaviorSubject, Observable, map, tap, timer } from 'rxjs';
import { RolUsuario } from '../../models/reclamo.enums';
import { RUTAS } from '../config/navegacion.config';
import { ActualizarPerfilDto, AgenteAsignable, AgenteGestion, AgenteRegistrado, CuentaPrueba, LoginDto, RegistroDto, TokenPayload, Usuario, UsuarioRegistrado } from '../../models/usuario.model';

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
    [RolUsuario.AGENTE]: {
      id: 3,
      nombre: 'Agente Pérez',
      email: 'agente@gmail.com',
      rol: RolUsuario.AGENTE,
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
    { email: 'agente@gmail.com', password: '123456', rol: RolUsuario.AGENTE },
    { email: 'admin@gmail.com', password: '123456', rol: RolUsuario.ADMINISTRADOR }
  ];

  // Duración de la sesión: 20 minutos. Para probar la expiración rápido, bajar este valor.
  private readonly duracionSesionSeg = 20 * 60;

  // El token se guarda en sessionStorage: se borra al cerrar la pestaña.
  private readonly claveToken = 'auth_token';

  // Cuentas creadas desde la pantalla de registro (localStorage: persisten
  // entre sesiones). Debe declararse antes de los BehaviorSubject.
  private readonly claveUsuarios = 'usuarios_registrados';

  // Cuentas de agente creadas por el administrador (localStorage: persisten
  // entre sesiones, igual que las cuentas registradas).
  private readonly claveAgentes = 'agentes_registrados';

  // Cuentas base de agente que el administrador eliminó. Se guardan aparte
  // porque los perfiles base viven en el código: así la cuenta desaparece de
  // la lista, no puede iniciar sesión y su correo queda disponible otra vez.
  private readonly claveAgentesBaseEliminados = 'agentes_base_eliminados';
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
        const cuenta = this.buscarCuentaPorCredenciales(email, credenciales.password);

        if (!cuenta) {
          throw new Error('Correo o contraseña incorrectos.');
        }

        if (!cuenta.activo) {
          throw new Error('Tu cuenta está desactivada. Contacta al administrador.');
        }

        const usuario = this.leerPerfil(cuenta.id);
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
          id: this.siguienteId(),
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

  // Crea una cuenta de agente desde la pantalla del administrador. Las
  // validaciones de correo y contraseña son las mismas del registro público.
  registrarAgente(datos: RegistroDto): Observable<void> {
    return timer(400).pipe(
      map(() => {
        const email = datos.email.trim().toLowerCase();

        if (this.correoYaRegistrado(email)) {
          throw new Error('Ya existe una cuenta con ese correo.');
        }

        if (datos.password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }

        const agentes = this.leerAgentes();
        const nuevo: AgenteRegistrado = {
          id: this.siguienteId(),
          nombre: datos.nombre.trim(),
          email,
          password: datos.password,
          activo: true
        };

        localStorage.setItem(this.claveAgentes, JSON.stringify([...agentes, nuevo]));
      })
    );
  }

  // Cuentas de demostración que se muestran en el login. Si el administrador
  // eliminó la cuenta base del agente, su acceso rápido deja de aparecer.
  obtenerCuentasPrueba(): CuentaPrueba[] {
    const eliminados = this.leerAgentesBaseEliminados();
    return this.credencialesMock.filter(cuenta => !eliminados.includes(this.usuariosMock[cuenta.rol].id));
  }

  obtenerUsuarioPorId(id: number): Usuario | null {
    return this.leerPerfil(id);
  }

  obtenerAdministradores(): Usuario[] {
    return Object.values(this.usuariosMock)
      .filter(usuario => usuario.rol === RolUsuario.ADMINISTRADOR)
      .map(usuario => this.leerPerfil(usuario.id) ?? usuario);
  }

  // Personal al que el administrador puede asignarle reclamos. Incluye las
  // cuentas base (el administrador también es agente) y los agentes creados
  // desde la pantalla de gestión que siguen activos.
  obtenerAgentes(): AgenteAsignable[] {
    const eliminados = this.leerAgentesBaseEliminados();
    const base = [RolUsuario.AGENTE, RolUsuario.ADMINISTRADOR]
      .map(rol => this.usuariosMock[rol])
      .filter(cuenta => !eliminados.includes(cuenta.id))
      .map(cuenta => {
        const perfil = this.leerPerfil(cuenta.id) ?? cuenta;
        return { id: perfil.id, nombre: perfil.nombre };
      });

    const creados = this.leerAgentes()
      .filter(agente => agente.activo)
      .map(agente => {
        const perfil = this.leerPerfil(agente.id);
        return { id: agente.id, nombre: perfil?.nombre ?? agente.nombre };
      });

    return [...base, ...creados];
  }

  // Cuentas que se muestran en la pantalla de gestión del administrador.
  obtenerAgentesGestion(): AgenteGestion[] {
    const eliminados = this.leerAgentesBaseEliminados();
    const base = [RolUsuario.ADMINISTRADOR, RolUsuario.AGENTE]
      .map(rol => this.usuariosMock[rol])
      .filter(cuenta => !eliminados.includes(cuenta.id))
      .map(cuenta => {
        const perfil = this.leerPerfil(cuenta.id) ?? cuenta;
        return {
          id: cuenta.id,
          nombre: perfil.nombre,
          email: cuenta.email,
          activo: true,
          esCuentaBase: true,
          esAdministrador: cuenta.rol === RolUsuario.ADMINISTRADOR
        };
      });

    const creados = this.leerAgentes().map(agente => {
      const perfil = this.leerPerfil(agente.id);
      return {
        id: agente.id,
        nombre: perfil?.nombre ?? agente.nombre,
        email: agente.email,
        activo: agente.activo,
        esCuentaBase: false,
        esAdministrador: false
      };
    });

    return [...base, ...creados];
  }

  // Elimina la cuenta de un agente, sea creada por el administrador o una de
  // las cuentas base. Las cuentas de administrador no se eliminan y tampoco la
  // propia. Quien llama debe liberar después los reclamos asignados.
  eliminarAgente(id: number): void {
    const actual = this.usuarioSubject.value;
    if (actual?.id === id) {
      throw new Error('No puedes eliminar tu propia cuenta.');
    }

    // Las cuentas base viven en el código: solo la del agente se puede dar de
    // baja, y se registra aparte para que desaparezca del sistema.
    const cuentaBase = Object.values(this.usuariosMock).find(cuenta => cuenta.id === id);
    if (cuentaBase) {
      if (cuentaBase.rol !== RolUsuario.AGENTE) {
        throw new Error('Las cuentas de administrador no se pueden eliminar.');
      }

      const eliminados = this.leerAgentesBaseEliminados();
      if (!eliminados.includes(id)) {
        localStorage.setItem(this.claveAgentesBaseEliminados, JSON.stringify([...eliminados, id]));
      }
      localStorage.removeItem(this.clavePerfil(id));
      return;
    }

    const agente = this.leerAgentes().find(cuenta => cuenta.id === id);
    if (!agente) {
      throw new Error('La cuenta ya no existe.');
    }

    const restantes = this.leerAgentes().filter(cuenta => cuenta.id !== id);
    localStorage.setItem(this.claveAgentes, JSON.stringify(restantes));
    localStorage.removeItem(this.clavePerfil(id));
  }

  // Ruta de inicio según el rol (un único lugar para redirecciones)
  obtenerRutaInicio(rol: RolUsuario | null): string {
    switch (rol) {
      case RolUsuario.CIUDADANO:
        return RUTAS.inicioCiudadano;
      case RolUsuario.AGENTE:
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

  // Busca la cuenta cuyas credenciales coinciden (null si ninguna). Devuelve
  // también las cuentas desactivadas para que el login muestre un aviso claro.
  private buscarCuentaPorCredenciales(email: string, password: string): { id: number; activo: boolean } | null {
    const prueba = this.credencialesMock.find(c => c.email === email && c.password === password);
    if (prueba) {
      const id = this.usuariosMock[prueba.rol].id;
      // Una cuenta base eliminada ya no puede iniciar sesión.
      return this.leerAgentesBaseEliminados().includes(id) ? null : { id, activo: true };
    }

    const registrada = this.leerRegistrados().find(u => u.email === email && u.password === password);
    if (registrada) {
      return { id: registrada.id, activo: true };
    }

    const agente = this.leerAgentes().find(a => a.email === email && a.password === password);
    return agente ? { id: agente.id, activo: agente.activo } : null;
  }

  private correoYaRegistrado(email: string): boolean {
    const eliminados = this.leerAgentesBaseEliminados();
    const cuentasBase = this.credencialesMock.filter(c => !eliminados.includes(this.usuariosMock[c.rol].id));

    return cuentasBase.some(c => c.email === email)
      || this.leerRegistrados().some(u => u.email === email)
      || this.leerAgentes().some(a => a.email === email);
  }

  private siguienteId(): number {
    const ids = [
      ...Object.values(this.usuariosMock).map(u => u.id),
      ...this.leerRegistrados().map(u => u.id),
      ...this.leerAgentes().map(a => a.id)
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

  private leerAgentes(): AgenteRegistrado[] {
    try {
      const datos = JSON.parse(localStorage.getItem(this.claveAgentes) ?? '[]');
      return Array.isArray(datos) ? datos : [];
    } catch {
      // JSON corrupto en localStorage: se ignora
      return [];
    }
  }

  // Ids de las cuentas base de agente que el administrador dio de baja.
  private leerAgentesBaseEliminados(): number[] {
    try {
      const datos = JSON.parse(localStorage.getItem(this.claveAgentesBaseEliminados) ?? '[]');
      return Array.isArray(datos) ? datos.filter(id => typeof id === 'number') : [];
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

  // Las cuentas creadas desde la gestión de agentes son SIEMPRE agentes.
  private agenteAUsuario(agente: AgenteRegistrado): Usuario {
    return {
      id: agente.id,
      nombre: agente.nombre,
      email: agente.email,
      rol: RolUsuario.AGENTE,
      telefono: '',
      direccion: ''
    };
  }

  // Datos base de una cuenta (de prueba, registrada o de agente), sin los
  // cambios de perfil.
  private obtenerUsuarioBase(id: number): Usuario | null {
    const prueba = Object.values(this.usuariosMock).find(u => u.id === id);
    if (prueba) {
      return this.leerAgentesBaseEliminados().includes(id) ? null : prueba;
    }

    const registrada = this.leerRegistrados().find(u => u.id === id);
    if (registrada) {
      return this.aUsuario(registrada);
    }

    const agente = this.leerAgentes().find(a => a.id === id);
    return agente ? this.agenteAUsuario(agente) : null;
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
