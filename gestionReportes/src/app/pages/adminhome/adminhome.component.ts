import { Component } from '@angular/core';
import { RUTAS, TAREAS_ADMIN } from '../../core/config/navegacion.config';

@Component({
  selector: 'app-adminhome',
  templateUrl: './adminhome.component.html',
  styleUrls: ['./adminhome.component.css']
})
export class AdminhomeComponent {
  readonly tareas = TAREAS_ADMIN;
  readonly rutas = RUTAS;
}
