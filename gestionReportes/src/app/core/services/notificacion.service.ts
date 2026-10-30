import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Notificacion, TipoNotificacion } from '../../models/notificacion.model';
import { AuthService } from './auth.service';
import { Reclamo } from '../../models/reclamo.model';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private readonly clave = 'notificaciones_mock';
  private readonly notificacionesSubject = new BehaviorSubject<Notificacion[]>([]);

  readonly notificaciones$: Observable<Notificacion[]> = this.notificacionesSubject.asObservable();

  constructor(private authService: AuthService) {
    this.authService.usuario$.subscribe(usuario => {
      this.notificacionesSubject.next(usuario ? this.leerParaUsuario(usuario.id) : []);
    });
  }

  get noLeidas(): number {
    return this.notificacionesSubject.value.filter(notificacion => !notificacion.leida).length;
  }

  crear(
    usuarioIds: number[],
    tipo: TipoNotificacion,
    titulo: string,
    mensaje: string,
    reclamo: Reclamo
  ): void {
    const destinatarios = [...new Set(usuarioIds)].filter(id => id > 0);
    if (destinatarios.length === 0) {
      return;
    }

    const fecha = new Date().toISOString();
    const existentes = this.leerTodas();
    const nuevas = destinatarios.map(usuarioId => ({
      id: `${Date.now()}-${usuarioId}-${Math.random().toString(36).slice(2, 8)}`,
      usuarioId,
      tipo,
      titulo,
      mensaje,
      folio: reclamo.folio,
      fecha,
      leida: false
    }));

    this.guardarTodas([...nuevas, ...existentes].slice(0, 100));
    const usuario = this.authService.obtenerUsuarioActual();
    if (usuario) {
      this.notificacionesSubject.next(this.leerParaUsuario(usuario.id));
    }
  }

  marcarComoLeida(id: string): void {
    const actualizadas = this.leerTodas().map(notificacion =>
      notificacion.id === id ? { ...notificacion, leida: true } : notificacion
    );
    this.guardarTodas(actualizadas);
    this.refrescarUsuarioActual();
  }

  marcarTodasComoLeidas(): void {
    const usuario = this.authService.obtenerUsuarioActual();
    if (!usuario) {
      return;
    }

    const actualizadas = this.leerTodas().map(notificacion =>
      notificacion.usuarioId === usuario.id
        ? { ...notificacion, leida: true }
        : notificacion
    );
    this.guardarTodas(actualizadas);
    this.refrescarUsuarioActual();
  }

  private refrescarUsuarioActual(): void {
    const usuario = this.authService.obtenerUsuarioActual();
    this.notificacionesSubject.next(usuario ? this.leerParaUsuario(usuario.id) : []);
  }

  private leerParaUsuario(usuarioId: number): Notificacion[] {
    return this.leerTodas().filter(notificacion => notificacion.usuarioId === usuarioId);
  }

  private leerTodas(): Notificacion[] {
    try {
      const datos = JSON.parse(localStorage.getItem(this.clave) ?? '[]');
      return Array.isArray(datos) ? datos : [];
    } catch {
      return [];
    }
  }

  private guardarTodas(notificaciones: Notificacion[]): void {
    localStorage.setItem(this.clave, JSON.stringify(notificaciones));
  }
}
