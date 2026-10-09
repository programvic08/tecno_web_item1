import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { MARCA_PORTAL, RUTAS, apartadosPortal } from '../../../core/config/navegacion.config';
import { ApartadoPortal } from '../../../models/navegacion.model';
import { Usuario } from '../../../models/usuario.model';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  readonly marca = MARCA_PORTAL;
  readonly rutaPerfil = RUTAS.perfil;

  menuAbierto = false;

  // Se consumen con el async pipe: Angular se suscribe y se desuscribe solo.
  apartados$: Observable<ApartadoPortal[]>;
  usuario$: Observable<Usuario | null>;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.apartados$ = this.authService.rol$.pipe(map(rol => apartadosPortal(rol)));
    this.usuario$ = this.authService.usuario$;
  }

  // Iniciales del avatar (máximo dos letras)
  iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter(parte => parte.length > 0)
      .slice(0, 2)
      .map(parte => parte[0].toUpperCase())
      .join('');
  }

  // Un apartado queda activo en cualquiera de sus rutas (p. ej. Reclamos: crear, historial, estado)
  activo(apartado: ApartadoPortal): boolean {
    const url = this.router.url.split('?')[0];
    return (apartado.prefijos ?? []).some(p => url === p || url.startsWith(p + '/'));
  }

  alternarMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  cerrarSesion(): void {
    this.cerrarMenu();
    this.authService.logout();
    this.router.navigate([RUTAS.login]);
  }
}
