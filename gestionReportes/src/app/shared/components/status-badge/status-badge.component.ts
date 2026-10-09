import { Component, Input } from '@angular/core';
import { EstadoReclamo } from '../../../models/reclamo.enums';

// Estilos compartidos del indicador definidos en styles.css.
@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [ngClass]="obtenerClase()">{{ estado }}</span>`
})
export class StatusBadgeComponent {
  @Input() estado!: string;

  obtenerClase(): string {
    switch (this.estado) {
      case EstadoReclamo.RECIBIDO:
      case EstadoReclamo.EN_REVISION:
        return 'recibido';
      case EstadoReclamo.EN_PROCESO:
        return 'en-proceso';
      case EstadoReclamo.RESUELTO:
        return 'resuelto';
      case EstadoReclamo.RECHAZADO:
        return 'rechazado';
      default:
        return 'cerrado';
    }
  }
}
