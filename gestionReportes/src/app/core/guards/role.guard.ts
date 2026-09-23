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
    const rolRequerido = route.data['rolRequerido'] as RolUsuario;
    const estaAutenticado = this.authService.estaAutenticado();
    const rolActual = this.authService.obtenerRolActual();

    if (estaAutenticado && rolActual === rolRequerido) {
      return true;
    }

    return this.router.createUrlTree(['/login']);
  }
}