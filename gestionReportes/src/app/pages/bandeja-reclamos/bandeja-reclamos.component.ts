import { Component } from '@angular/core';
import { ReclamoBandeja } from '../../models/reclamo-bandeja';

@Component({
  selector: 'app-bandeja-reclamos',
  templateUrl: './bandeja-reclamos.component.html',
  styleUrls: ['./bandeja-reclamos.component.css']
})
export class BandejaReclamosComponent {

  reclamos: ReclamoBandeja[] = [
    { folio: '#NYC-1001', categoria: 'Infraestructura', subcategoria: 'Bache en la vía', ubicacion: 'Broadway #450', fecha: '12/03/2026', prioridad: 'Alta', estado: 'En proceso', agenteAsignado: 'Sin asignar' },
    { folio: '#NYC-0982', categoria: 'Alumbrado Público', subcategoria: 'Luminaria apagada', ubicacion: '5th Ave & 34th St', fecha: '28/02/2026', prioridad: 'Media', estado: 'Resuelto', agenteAsignado: 'J. Martínez' },
    { folio: '#NYC-0850', categoria: 'Aseo Urbano', subcategoria: 'Acumulación de basura', ubicacion: 'Central Park West #12', fecha: '15/01/2026', prioridad: 'Baja', estado: 'Cerrado', agenteAsignado: 'A. Gómez' },
    { folio: '#NYC-0920', categoria: 'Seguridad', subcategoria: 'Semáforo dañado', ubicacion: 'Lexington Ave #77', fecha: '05/03/2026', prioridad: 'Urgente', estado: 'Recibido', agenteAsignado: 'Sin asignar' },
  ];

  filtroEstado: string = 'Todos';
  filtroCategoria: string = 'Todos';
  filtroPrioridad: string = 'Todos';
  filtroUbicacion: string = '';

  estados: string[] = ['Todos', 'Recibido', 'En revisión', 'En proceso', 'Resuelto', 'Rechazado', 'Cerrado'];
  categorias: string[] = ['Todos', 'Infraestructura', 'Alumbrado Público', 'Aseo Urbano', 'Seguridad'];
  prioridades: string[] = ['Todos', 'Baja', 'Media', 'Alta', 'Urgente'];

  get reclamosFiltrados(): ReclamoBandeja[] {
    return this.reclamos.filter(r => {
      const coincideEstado = this.filtroEstado === 'Todos' || r.estado === this.filtroEstado;
      const coincideCategoria = this.filtroCategoria === 'Todos' || r.categoria === this.filtroCategoria;
      const coincidePrioridad = this.filtroPrioridad === 'Todos' || r.prioridad === this.filtroPrioridad;
      const coincideUbicacion = r.ubicacion.toLowerCase().includes(this.filtroUbicacion.toLowerCase());
      return coincideEstado && coincideCategoria && coincidePrioridad && coincideUbicacion;
    });
  }

  verDetalle(folio: string): void {
    console.log('Ver detalle de', folio);
  }

  asignarme(folio: string): void {
    const reclamo = this.reclamos.find(r => r.folio === folio);
    if (reclamo) {
      reclamo.agenteAsignado = 'Yo (agente actual)';
    }
  }

  badgeClaseEstado(estado: string): string {
    switch (estado) {
      case 'Recibido': return 'bg-secondary';
      case 'En revisión': return 'bg-info text-dark';
      case 'En proceso': return 'bg-warning text-dark';
      case 'Resuelto': return 'bg-success';
      case 'Rechazado': return 'bg-danger';
      case 'Cerrado': return 'bg-dark';
      default: return 'bg-light text-dark';
    }
  }

  limpiarFiltros(): void {
    this.filtroEstado = 'Todos';
    this.filtroCategoria = 'Todos';
    this.filtroPrioridad = 'Todos';
    this.filtroUbicacion = '';
  }
}