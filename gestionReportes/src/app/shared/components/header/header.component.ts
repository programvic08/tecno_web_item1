import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { RolUsuario } from '../../../models/reclamo.enums';
import { EnlaceNavegacion } from '../../../models/navegacion.model';
import { Usuario } from '../../../models/usuario.model';

const ENLACES_CIUDADANO: EnlaceNavegacion[] = [
  { etiqueta: 'Inicio', ruta: '/userHome', icono: 'home' },
  { etiqueta: 'Crear reclamo', ruta: '/crear-reclamo', icono: 'add_alert' },
  { etiqueta: 'Historial', ruta: '/historial', icono: 'history' },
  { etiqueta: 'Estado', ruta: '/estado-reclamo', icono: 'analytics' }
];

const ENLACES_ADMINISTRADOR: EnlaceNavegacion[] = [
  { etiqueta: 'Inicio', ruta: '/adminHome', icono: 'home' },
  { etiqueta: 'Bandeja', ruta: '/bandeja-reclamos', icono: 'inbox' },
  { etiqueta: 'Modificar', ruta: '/modificar-reclamo', icono: 'edit_note' },
  { etiqueta: 'Reportes', ruta: '/reporteReclamo', icono: 'assessment' }
];

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() subtitulo: string = 'TRÁMITES Y SERVICIOS AL CIUDADANO';

  // Se consumen con el async pipe en la plantilla: Angular se suscribe
  // y se desuscribe solo al destruir el componente.
  enlaces$: Observable<EnlaceNavegacion[]>;
  usuario$: Observable<Usuario | null>;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.enlaces$ = this.authService.rol$.pipe(map(rol => this.obtenerEnlaces(rol)));
    this.usuario$ = this.authService.usuario$;
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private obtenerEnlaces(rol: RolUsuario | null): EnlaceNavegacion[] {
    switch (rol) {
      case RolUsuario.CIUDADANO:
        return ENLACES_CIUDADANO;
      case RolUsuario.ADMINISTRADOR:
        return ENLACES_ADMINISTRADOR;
      default:
        return [];
    }
  }
}
