import { Component } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { PESTANAS_ADMIN, PESTANAS_CIUDADANO } from '../../../core/config/navegacion.config';
import { PestanaSubnav } from '../../../models/navegacion.model';
import { RolUsuario } from '../../../models/reclamo.enums';

// Fila de pestañas bajo el navbar. Elige sus pestañas según el rol de la sesión.
@Component({
  selector: 'app-subnav',
  templateUrl: './subnav.component.html',
  styleUrls: ['./subnav.component.css']
})
export class SubnavComponent {
  pestanas$: Observable<PestanaSubnav[]>;

  constructor(private authService: AuthService) {
    this.pestanas$ = this.authService.rol$.pipe(
      map(rol => {
        switch (rol) {
          case RolUsuario.ADMINISTRADOR:
            return PESTANAS_ADMIN;
          case RolUsuario.CIUDADANO:
            return PESTANAS_CIUDADANO;
          default:
            return [];
        }
      })
    );
  }
}
