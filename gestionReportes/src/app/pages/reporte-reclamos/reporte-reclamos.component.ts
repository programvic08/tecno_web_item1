import { Component, OnInit } from '@angular/core';
import { ReclamoService } from '../../core/services/reclamo.service';
import { ReporteEstadistico } from '../../models/reclamo.model';

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

  categorias: string[] = ['Todas', 'Aseo y Ornato', 'Alumbrado Público', 'Infraestructura Urbana', 'Seguridad y Ruidos'];
  estados: string[] = ['Todos', 'Recibido', 'En proceso', 'Resuelto', 'Cerrado'];

  isLoading: boolean = false;
  reporte: ReporteEstadistico = {
    totalReclamos: 0,
    tiempoPromedioResolucionDias: 0,
    reclamosPorEstado: [],
    reclamosPorCategoria: []
  };

  constructor(private reclamoService: ReclamoService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading = true;
    this.reclamoService.obtenerReporte().subscribe(datos => {
      this.reporte = datos;
      this.isLoading = false;
    });
  }

  aplicarFiltros(): void {
    this.cargarDatos();
  }
}