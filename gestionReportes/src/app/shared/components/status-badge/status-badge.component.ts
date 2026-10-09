import { Component, Input } from '@angular/core';
import { EstadoReclamo } from '../../../models/reclamo.enums';

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [ngClass]="obtenerClase()">{{ estado }}</span>`,
  styleUrls: ['./status-badge.component.css']
})
export class StatusBadgeComponent {
  @Input() estado!: string;

  obtenerClase(): string {
    switch (this.estado) {
      case EstadoReclamo.RECIBIDO: return 'recibido';
      case EstadoReclamo.EN_PROCESO: return 'en-proceso';
      case EstadoReclamo.RESUELTO: return 'resuelto';
      default: return 'cerrado';
    }
  }
}