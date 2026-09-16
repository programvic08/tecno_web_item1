import { Component } from '@angular/core';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css']
})
export class HistorialComponent {
  
  // Variable que guarda el estado seleccionado en el <select>
  filtroSeleccionado: string = '';

  // Lista base de reclamos
  reclamos = [
    { id: 'NYC-1001', categoria: 'Infraestructura', subcategoria: 'Bache en la vía', ubicacion: 'Broadway #450', fecha: '12/03/2026', estado: 'En proceso', css: 'en-proceso' },
    { id: 'NYC-0982', categoria: 'Alumbrado Público', subcategoria: 'Luminaria apagada', ubicacion: '5th Ave & 34th St', fecha: '28/02/2026', estado: 'Resuelto', css: 'resuelto' },
    { id: 'NYC-0850', categoria: 'Aseo Urbano', subcategoria: 'Acumulación de basura', ubicacion: 'Central Park West #12', fecha: '15/01/2026', estado: 'Cerrado', css: 'cerrado' }
  ];

  // Propiedad calculada: filtra la lista automáticamente
  get reclamosFiltrados() {
    if (!this.filtroSeleccionado) {
      return this.reclamos;
    }
    return this.reclamos.filter(reclamo => reclamo.estado === this.filtroSeleccionado);
  }

  // Función segura para capturar el valor del selector sin errores de TypeScript
  onFiltroChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtroSeleccionado = target.value;
  }

}