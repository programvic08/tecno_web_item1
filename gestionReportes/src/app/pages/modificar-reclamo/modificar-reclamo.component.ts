import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReclamoService } from '../../core/services/reclamo.service';
import { AuthService } from '../../core/services/auth.service';
import { Reclamo, SIN_ASIGNAR } from '../../models/reclamo.model';
import { EstadoReclamo, PrioridadReclamo, RolUsuario } from '../../models/reclamo.enums';
import { AgenteAsignable } from '../../models/usuario.model';
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
  sinPermiso: boolean = false;

  // Solo el administrador reasigna; el agente ve el responsable pero no lo cambia
  esAdmin = false;
  agentes: AgenteAsignable[] = [];

  estados = Object.values(EstadoReclamo);
  prioridades = Object.values(PrioridadReclamo);

  nuevoEstado!: EstadoReclamo;
  nuevaPrioridad!: PrioridadReclamo;
  nuevoAgenteId: number | null = null;
  nuevaObservacion: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reclamoService: ReclamoService,
    private authService: AuthService
  ) {
    this.esAdmin = this.authService.obtenerRolActual() === RolUsuario.ADMINISTRADOR;
    this.agentes = this.authService.obtenerAgentes();
  }

  get agenteActual(): string {
    return this.reclamo?.agenteAsignado ?? SIN_ASIGNAR;
  }

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
    this.sinPermiso = false;

    // Solo se busca entre los reclamos que el usuario puede gestionar (el agente no encuentra los ajenos).
    // take(1) obtiene el valor actual sin dejar la suscripción abierta.
    this.reclamoService.reclamosVisibles$.pipe(take(1)).subscribe(lista => {
      const encontrado = lista.find(
        r => r.folio.toLowerCase() === this.busquedaFolio.trim().toLowerCase() ||
             r.id.toString() === this.busquedaFolio.trim()
      );

      if (encontrado) {
        this.reclamo = { ...encontrado };
        this.nuevoEstado = encontrado.estado;
        this.nuevaPrioridad = encontrado.prioridad;
        this.nuevoAgenteId = encontrado.agenteId ?? null;
      } else {
        this.reclamo = null;
      }
    });
  }

  guardarCambios(): void {
    if (!this.reclamo) return;

    const cambios: Partial<Reclamo> = {
      estado: this.nuevoEstado,
      prioridad: this.nuevaPrioridad
    };

    // Solo el administrador envía la asignación (el servicio además la descarta si no lo es)
    if (this.esAdmin) {
      const agente = this.agentes.find(a => a.id === this.nuevoAgenteId) ?? null;
      cambios.agenteId = agente?.id ?? null;
      cambios.agenteAsignado = agente?.nombre ?? SIN_ASIGNAR;
    }

    // Delegamos la actualización al servicio, que valida el permiso. La observación queda en la bitácora.
    const guardado = this.reclamoService.actualizarReclamo(
      this.reclamo.folio,
      cambios,
      this.nuevaObservacion,
      this.authService.obtenerUsuarioActual()?.nombre
    );

    if (!guardado) {
      this.sinPermiso = true;
      return;
    }
    this.sinPermiso = false;
    this.nuevaObservacion = '';

    this.actualizadoExito = true;

    setTimeout(() => {
      this.actualizadoExito = false;
      this.router.navigate(['/bandeja-reclamos']);
    }, 2000);
  }
}