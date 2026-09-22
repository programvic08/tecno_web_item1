import { Component, OnInit } from '@angular/core';
import { ReporteReclamo } from 'src/app/models/reporte-reclamo';

@Component({
  selector: 'app-reporte-reclamos',
  templateUrl: './reporte-reclamos.component.html',
  styleUrls: ['./reporte-reclamos.component.css']
})
export class ReporteReclamosComponent implements OnInit {

  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';
  filtroCategoria: string = 'TODAS';
  filtroEstado: string = 'TODOS';

  categorias: string[] = ['TODAS', 'Alumbrado público', 'Aseo', 'Seguridad', 'Áreas verdes'];
  estados: string[] = ['TODOS', 'Recibido', 'En revisión', 'En proceso', 'Resuelto', 'Rechazado', 'Cerrado'];

  isLoading: boolean = false;

  reporte: ReporteReclamo = {
    totalReclamos: 0,
    tiempoPromedioResolucionDias: 0,
    reclamosPorEstado: [],
    reclamosPorCategoria: []
  };

  constructor() { }

  ngOnInit(): void {
    this.cargarDatosReporte();
  }

  aplicarFiltros(): void {
    console.log('Filtrando:', {
      desde: this.filtroFechaDesde,
      hasta: this.filtroFechaHasta,
      categoria: this.filtroCategoria,
      estado: this.filtroEstado
    });
    this.cargarDatosReporte();
    
  }

  private cargarDatosReporte(): void {
    this.isLoading = true;

    // esto simula una carga (como que esta funcionando)
    setTimeout(() => {
      this.reporte = {
        totalReclamos: 12,
        tiempoPromedioResolucionDias: 3,
        reclamosPorEstado: [
          { estado: 'Recibido', cantidad: 3 },
          { estado: 'En proceso', cantidad: 4 },
          { estado: 'Resuelto', cantidad: 5 }
        ],
        reclamosPorCategoria: [
          { categoria: 'Alumbrado público', cantidad: 4 },
          { categoria: 'Aseo', cantidad: 3 },
          { categoria: 'Seguridad', cantidad: 5 }
        ]
      };
      this.isLoading = false;
    }, 500);
  }
}