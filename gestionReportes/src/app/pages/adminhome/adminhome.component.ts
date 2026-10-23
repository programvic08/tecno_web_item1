import { Component } from '@angular/core';
import { RUTAS, TAREAS_ADMIN, TAREAS_AGENTE } from '../../core/config/navegacion.config';
import { AuthService } from '../../core/services/auth.service';
import { RolUsuario } from '../../models/reclamo.enums';
import { TareaRapida } from '../../models/navegacion.model';

@Component({
  selector: 'app-adminhome',
  templateUrl: './adminhome.component.html',
  styleUrls: ['./adminhome.component.css']
})
export class AdminhomeComponent {
  readonly rutas = RUTAS;

  // Panel compartido por el administrador y el agente; cambian los textos según el rol
  readonly esAdmin: boolean;
  readonly tareas: TareaRapida[];

  constructor(authService: AuthService) {
    this.esAdmin = authService.obtenerRolActual() === RolUsuario.ADMINISTRADOR;
    this.tareas = this.esAdmin ? TAREAS_ADMIN : TAREAS_AGENTE;
  }
}
