import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReclamoService } from '../../core/services/reclamo.service';
import { AuthService } from '../../core/services/auth.service';
import { Reclamo, SIN_ASIGNAR } from '../../models/reclamo.model';
import { EstadoReclamo } from '../../models/reclamo.enums';
import { RUTAS } from '../../core/config/navegacion.config';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-modificar-reclamo',
  templateUrl: './modificar-reclamo.component.html',
  styleUrls: ['./modificar-reclamo.component.css']
})
export class ModificarReclamoComponent implements OnInit, OnDestroy {
  busquedaFolio: string = '';
  reclamo: Reclamo | null = null;
  buscado: boolean = false;
  actualizadoExito: boolean = false;
  sinPermiso: boolean = false;

  readonly EstadoReclamo = EstadoReclamo;
  nuevaObservacion: string = '';
  private redireccion?: ReturnType<typeof setTimeout>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reclamoService: ReclamoService,
    private authService: AuthService
  ) {
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

  ngOnDestroy(): void {
    clearTimeout(this.redireccion);
  }

  buscarReclamo(): void {
    if (!this.busquedaFolio.trim()) return;

    clearTimeout(this.redireccion);
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
        this.nuevaObservacion = '';
      } else {
        this.reclamo = null;
      }
    });
  }

  get nombreCiudadano(): string {
    return this.reclamo?.usuarioId
      ? this.authService.obtenerUsuarioPorId(this.reclamo.usuarioId)?.nombre ?? 'Ciudadano no disponible'
      : 'Ciudadano no disponible';
  }

  ejecutar(accion: 'avance' | 'rechazar' | 'resolver'): void {
    if (!this.reclamo) return;
    const folio = this.reclamo.folio;
    const guardado = accion === 'avance'
      ? this.reclamoService.registrarAvance(folio, this.nuevaObservacion)
      : accion === 'rechazar'
        ? this.reclamoService.rechazarReclamo(folio, this.nuevaObservacion)
        : this.reclamoService.resolverReclamo(folio);
    this.sinPermiso = !guardado;
    if (guardado) {
      this.busquedaFolio = folio;
      this.buscarReclamo();
      this.actualizadoExito = true;
      if (this.reclamo?.estado === EstadoReclamo.CERRADO) {
        this.redireccion = setTimeout(() => {
          this.router.navigate([RUTAS.bandeja]);
        }, 2000);
      }
    }
  }
}
