import { errorFechaNoFutura } from '../../shared/utils/fechas';
import { Component, OnInit } from '@angular/core';
import { ReclamoService } from '../../core/services/reclamo.service';
import { ReporteEstadistico } from '../../models/reclamo.model';
import { EstadoReclamo } from '../../models/reclamo.enums';

@Component({
  selector: 'app-reporte-reclamos',
  templateUrl: './reporte-reclamos.component.html',
  styleUrls: ['./reporte-reclamos.component.css']
})
export class ReporteReclamosComponent implements OnInit {
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';
  filtroCategoria: string = 'Todas';
  filtroEstado: string = 'Todos';

  // Derivadas de los enums y del servicio (antes faltaban "En revisión" y "Rechazado")
  categorias: string[] = ['Todas'];
  estados: string[] = ['Todos', ...Object.values(EstadoReclamo)];

  isLoading: boolean = false;
  reporte: ReporteEstadistico = {
    totalReclamos: 0,
    tiempoPromedioResolucionDias: null,
    reclamosPorEstado: [],
    reclamosPorCategoria: []
  };

  constructor(private reclamoService: ReclamoService) {
    this.categorias = ['Todas', ...this.reclamoService.getCategorias().map(c => c.nombre)];
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    if (errorFechaNoFutura(this.filtroFechaDesde, 'date') || errorFechaNoFutura(this.filtroFechaHasta, 'date')) return;
    this.isLoading = true;
    this.reclamoService.obtenerReporte({
      fechaDesde: this.filtroFechaDesde,
      fechaHasta: this.filtroFechaHasta,
      categoria: this.filtroCategoria,
      estado: this.filtroEstado
    }).subscribe(datos => {
      this.reporte = datos;
      this.isLoading = false;
    });
  }

  aplicarFiltros(): void {
    this.cargarDatos();
  }
}