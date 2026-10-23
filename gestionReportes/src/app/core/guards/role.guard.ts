import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RolUsuario } from '../../models/reclamo.enums';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    // 1. Sin sesión válida (o vencida): al login
    if (!this.authService.estaAutenticado()) {
      return this.authService.crearUrlLogin();
    }

    // 2. Con sesión y con alguno de los roles que la ruta admite: acceso permitido
    const rolesPermitidos = route.data['rolesPermitidos'] as RolUsuario[] | undefined;
    const rolActual = this.authService.obtenerRolActual();

    if (rolActual && rolesPermitidos?.includes(rolActual)) {
      return true;
    }

    // 3. Con sesión pero con otro rol: se le devuelve a SU propio inicio
    //    (no se le cierra la sesión ni se le manda al login sin razón)
    return this.router.createUrlTree([this.authService.obtenerRutaInicio(rolActual)]);
  }
}
