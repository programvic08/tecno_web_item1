import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReclamoService } from '../../core/services/reclamo.service';
import { ReporteEstadistico } from '../../models/reclamo.model';
import { EstadoReclamo } from '../../models/reclamo.enums';

@Component({
  selector: 'app-reporte-reclamos',
  templateUrl: './reporte-reclamos.component.html',
  styleUrls: ['./reporte-reclamos.component.css']
})
export class ReporteReclamosComponent implements OnInit, OnDestroy {
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';
  filtroCategoria: string = 'Todas';
  filtroEstado: string = 'Todos';

  categorias: string[] = [];
  estados: string[] = ['Todos', ...Object.values(EstadoReclamo)];

  isLoading: boolean = false;
  mensajeError: string = '';

  reporte: ReporteEstadistico = {
    totalReclamos: 0,
    tiempoPromedioResolucionDias: null,
    reclamosPorEstado: [],
    reclamosPorCategoria: []
  };

  private reporteSubscription?: Subscription;

  constructor(private reclamoService: ReclamoService) {}

  ngOnInit(): void {
    this.categorias = [
      'Todas',
      ...this.reclamoService.getCategorias().map(
        categoria => categoria.nombre
      )
    ];

    this.cargarDatos();
  }

  cargarDatos(): void {
    // Evita acumular suscripciones al presionar Filtrar.
    this.reporteSubscription?.unsubscribe();

    this.isLoading = true;
    this.mensajeError = '';

    this.reporteSubscription = this.reclamoService.obtenerReporte({
      fechaDesde: this.filtroFechaDesde,
      fechaHasta: this.filtroFechaHasta,
      categoria: this.filtroCategoria,
      estado: this.filtroEstado
    }).subscribe({
      next: datos => {
        this.reporte = datos;
        this.isLoading = false;
      },
      error: () => {
        this.mensajeError =
          'No se pudo cargar el reporte. Intenta nuevamente.';
        this.isLoading = false;
      }
    });
  }

  aplicarFiltros(): void {
    if (
      this.filtroFechaDesde &&
      this.filtroFechaHasta &&
      this.filtroFechaDesde > this.filtroFechaHasta
    ) {
      this.mensajeError =
        'La fecha Desde no puede ser posterior a la fecha Hasta.';
      return;
    }

    this.cargarDatos();
  }

  limpiarFiltros(): void {
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.filtroCategoria = 'Todas';
    this.filtroEstado = 'Todos';

    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.reporteSubscription?.unsubscribe();
  }
}