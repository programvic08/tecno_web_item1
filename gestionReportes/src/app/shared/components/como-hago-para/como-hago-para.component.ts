import { Component, Input } from '@angular/core';
import { TareaRapida } from '../../../models/navegacion.model';

// Tarjeta blanca que cabalga sobre el carrusel con los trámites más frecuentes
@Component({
  selector: 'app-como-hago-para',
  templateUrl: './como-hago-para.component.html',
  styleUrls: ['./como-hago-para.component.css']
})
export class ComoHagoParaComponent {
  @Input() sobreCarrusel = true;
  @Input() titulo = '¿Cómo hago para…?';
  @Input() tareas: TareaRapida[] = [];
}
