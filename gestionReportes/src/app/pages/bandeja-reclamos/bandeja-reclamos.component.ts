import { Component, OnInit } from '@angular/core';
import { ReclamoService } from '../../core/services/reclamo.service';
import { AuthService } from '../../core/services/auth.service';
import { Reclamo } from '../../models/reclamo.model';

@Component({
  selector: 'app-bandeja-reclamos',
  templateUrl: './bandeja-reclamos.component.html',
  styleUrls: ['./bandeja-reclamos.component.css']
})
export class BandejaReclamosComponent implements OnInit {
  reclamos: Reclamo[] = [];
  
  filtroEstado: string = 'Todos';
  filtroCategoria: string = 'Todas';
  filtroPrioridad: string = 'Todas';
  filtroUbicacion: string = '';

  estados: string[] = ['Todos', 'Recibido', 'En revisión', 'En proceso', 'Resuelto', 'Rechazado', 'Cerrado'];
  categorias: string[] = ['Todas', 'Aseo y Ornato', 'Alumbrado Público', 'Infraestructura Urbana', 'Seguridad y Ruidos'];
  prioridades: string[] = ['Todas', 'Baja', 'Media', 'Alta', 'Urgente'];

  constructor(
    private reclamoService: ReclamoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.reclamoService.reclamos$.subscribe(data => {
      this.reclamos = data;
    });
  }

  get reclamosFiltrados(): Reclamo[] {
    return this.reclamos.filter(r => {
      const cumpleEstado = this.filtroEstado === 'Todos' || r.estado === this.filtroEstado;
      const cumpleCat = this.filtroCategoria === 'Todas' || r.categoria === this.filtroCategoria;
      const cumplePrio = this.filtroPrioridad === 'Todas' || r.prioridad === this.filtroPrioridad;
      const cumpleUbi = !this.filtroUbicacion || r.ubicacion.toLowerCase().includes(this.filtroUbicacion.toLowerCase());

      return cumpleEstado && cumpleCat && cumplePrio && cumpleUbi;
    });
  }

  asignarme(folio: string): void {
    const usuario = this.authService.obtenerRolActual();
    const agenteNombre = usuario ? 'Agente Activo' : 'Agente Municipal';
    this.reclamoService.asignarAgente(folio, agenteNombre);
  }

  verDetalle(folio: string): void {
    alert(`Visualizando detalle del reclamo: ${folio}`);
  }
}