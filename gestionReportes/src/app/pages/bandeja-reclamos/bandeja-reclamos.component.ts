import { Component, OnInit } from '@angular/core';
import { ReclamoService } from '../../core/services/reclamo.service';
import { AuthService } from '../../core/services/auth.service';
import { Reclamo } from '../../models/reclamo.model';
import { EstadoReclamo, PrioridadReclamo } from '../../models/reclamo.enums';

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

  // Las listas se derivan de los enums y del servicio: si se agrega un estado o categoría, aparece sola.
  estados: string[] = ['Todos', ...Object.values(EstadoReclamo)];
  categorias: string[] = ['Todas'];
  prioridades: string[] = ['Todas', ...Object.values(PrioridadReclamo)];

  constructor(
    private reclamoService: ReclamoService,
    private authService: AuthService
  ) {
    this.categorias = ['Todas', ...this.reclamoService.getCategorias().map(c => c.nombre)];
  }

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
    // Se asigna con el nombre del agente que tiene la sesión abierta
    const agenteNombre = this.authService.obtenerUsuarioActual()?.nombre ?? 'Agente Municipal';
    this.reclamoService.asignarAgente(folio, agenteNombre);
  }
}