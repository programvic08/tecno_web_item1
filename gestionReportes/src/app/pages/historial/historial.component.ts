import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ReclamoService } from '../../core/services/reclamo.service';
import { AuthService } from '../../core/services/auth.service';
import { RUTAS } from '../../core/config/navegacion.config';
import { Reclamo } from '../../models/reclamo.model';
import { EstadoReclamo } from '../../models/reclamo.enums';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css']
})
export class HistorialComponent implements OnInit, OnDestroy {
  reclamos: Reclamo[] = [];
  reclamosFiltrados: Reclamo[] = [];
  filtroEstado: string = '';

  // Todos los estados posibles (antes faltaban "En revisión" y "Rechazado")
  readonly estados: string[] = Object.values(EstadoReclamo);

  private destruir$ = new Subject<void>();

  constructor(
    private reclamoService: ReclamoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Solo los reclamos del ciudadano con sesión activa
    const usuarioId = this.authService.obtenerUsuarioActual()?.id;
    this.reclamoService.obtenerReclamosDeUsuario(usuarioId)
      .pipe(takeUntil(this.destruir$))
      .subscribe(datos => {
        this.reclamos = datos;
        this.aplicarFiltro();
      });
  }

  ngOnDestroy(): void {
    this.destruir$.next();
    this.destruir$.complete();
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

  // Redirige a la vista de estado con el folio
  verDetalle(folio: string): void {
    this.router.navigate([RUTAS.estado], { queryParams: { folio } });
  }
}
