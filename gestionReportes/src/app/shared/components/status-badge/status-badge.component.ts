import { Component, Input } from '@angular/core';
import { EstadoReclamo } from '../../../models/reclamo.enums';

// Muestra el estado con las pills comunes de todo el portal (definidas en styles.css)
@Component({
  selector: 'app-status-badge',
  template: `<span class="pill" [ngClass]="obtenerClase()">{{ estado }}</span>`
})
export class StatusBadgeComponent {
  @Input() estado!: string;

  obtenerClase(): string {
    switch (this.estado) {
      case EstadoReclamo.RECIBIDO:
      case EstadoReclamo.EN_REVISION:
        return 'pill--pendiente';
      case EstadoReclamo.EN_PROCESO:
        return 'pill--proceso';
      case EstadoReclamo.RESUELTO:
        return 'pill--confirmada';
      case EstadoReclamo.RECHAZADO:
        return 'pill--rechazada';
      default:
        return 'pill--cancelada';
    }
  }
}
