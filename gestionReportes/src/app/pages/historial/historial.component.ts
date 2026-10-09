import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'; // Importar Router
import { ReclamoService } from '../../core/services/reclamo.service';
import { Reclamo } from '../../models/reclamo.model';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css']
})
export class HistorialComponent implements OnInit {
  reclamos: Reclamo[] = [];
  reclamosFiltrados: Reclamo[] = [];
  filtroEstado: string = '';

  constructor(
    private reclamoService: ReclamoService,
    private router: Router // Inyectar Router
  ) {}

  ngOnInit(): void {
    this.reclamoService.reclamos$.subscribe(datos => {
      this.reclamos = datos;
      this.aplicarFiltro();
    });
  }

  onFiltroChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.filtroEstado = selectElement.value;
    this.aplicarFiltro();
  }

  aplicarFiltro(): void {
    if (!this.filtroEstado) {
      this.reclamosFiltrados = [...this.reclamos];
    } else {
      this.reclamosFiltrados = this.reclamos.filter(
        r => r.estado.toLowerCase() === this.filtroEstado.toLowerCase()
      );
    }
  }

  // Método para redirigir a la vista de estado con el folio
  verDetalle(folio: string): void {
    this.router.navigate(['/estado-reclamo'], { queryParams: { folio } });
  }
}