import { Component, Input } from '@angular/core';
import { EstadoReclamo } from '../../../models/reclamo.enums';

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [ngClass]="obtenerClase()">{{ estado }}</span>`,
  styles: [`
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; }
    .recibido { background-color: #e0f2fe; color: #0369a1; }
    .en-proceso { background-color: #fef3c7; color: #92400e; }
    .resuelto { background-color: #dcfce7; color: #15803d; }
    .cerrado { background-color: #f3f4f6; color: #374151; }
  `]
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