import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReclamoService } from '../../core/services/reclamo.service';
import { Reclamo } from '../../models/reclamo.model';
import { EstadoReclamo, PrioridadReclamo } from '../../models/reclamo.enums';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-modificar-reclamo',
  templateUrl: './modificar-reclamo.component.html',
  styleUrls: ['./modificar-reclamo.component.css']
})
export class ModificarReclamoComponent implements OnInit {
  busquedaFolio: string = '';
  reclamo: Reclamo | null = null;
  buscado: boolean = false;
  actualizadoExito: boolean = false;

  estados = Object.values(EstadoReclamo);
  prioridades = Object.values(PrioridadReclamo);

  nuevoEstado!: EstadoReclamo;
  nuevaPrioridad!: PrioridadReclamo;
  nuevoAgente: string = '';
  nuevaObservacion: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reclamoService: ReclamoService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['folio']) {
        this.busquedaFolio = params['folio'];
        this.buscarReclamo();
      }
    });
  }

  buscarReclamo(): void {
    if (!this.busquedaFolio.trim()) return;

    this.buscado = true;
    this.actualizadoExito = false;

    // Usamos take(1) para obtener el valor actual sin dejar la suscripción abierta
    this.reclamoService.reclamos$.pipe(take(1)).subscribe(lista => {
      const encontrado = lista.find(
        r => r.folio.toLowerCase() === this.busquedaFolio.trim().toLowerCase() ||
             r.id.toString() === this.busquedaFolio.trim()
      );

      if (encontrado) {
        this.reclamo = { ...encontrado };
        this.nuevoEstado = encontrado.estado;
        this.nuevaPrioridad = encontrado.prioridad;
        this.nuevoAgente = encontrado.agenteAsignado;
      } else {
        this.reclamo = null;
      }
    });
  }

  guardarCambios(): void {
    if (!this.reclamo) return;

    // Delegamos la actualización de datos directamente al servicio
    this.reclamoService.actualizarReclamo(this.reclamo.folio, {
      estado: this.nuevoEstado,
      prioridad: this.nuevaPrioridad,
      agenteAsignado: this.nuevoAgente
    });

    this.actualizadoExito = true;

    setTimeout(() => {
      this.actualizadoExito = false;
      this.router.navigate(['/bandeja-reclamos']);
    }, 2000);
  }
}