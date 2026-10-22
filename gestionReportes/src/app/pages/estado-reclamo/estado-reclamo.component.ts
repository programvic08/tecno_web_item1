import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs/operators';
import { ReclamoService } from '../../core/services/reclamo.service';
import { AuthService } from '../../core/services/auth.service';
import { Reclamo } from '../../models/reclamo.model';
import { EstadoReclamo } from '../../models/reclamo.enums';

interface HitoTimeline {
  titulo: string;
  fecha: string;
  descripcion: string;
  completado: boolean;
  actual: boolean;
}

interface PasoTimeline {
  estado: EstadoReclamo;
  titulo: string;
  desc: string;
}

// Flujo normal de un reclamo. Rechazado y Cerrado no están aquí: son finales y se agregan aparte.
const PASOS_TIMELINE: PasoTimeline[] = [
  { estado: EstadoReclamo.RECIBIDO, titulo: 'Solicitud Recibida', desc: 'El sistema registró con éxito el reporte ciudadano.' },
  { estado: EstadoReclamo.EN_REVISION, titulo: 'En Revisión Técnica', desc: 'Asignado a inspección municipal y validación de antecedentes.' },
  { estado: EstadoReclamo.EN_PROCESO, titulo: 'En Proceso de Solución', desc: 'Cuadrilla o departamento operativo desplegado en el sector.' },
  { estado: EstadoReclamo.RESUELTO, titulo: 'Resolución Completada', desc: 'Trabajos finalizados y verificación conforme.' }
];

@Component({
  selector: 'app-estado-reclamo',
  templateUrl: './estado-reclamo.component.html',
  styleUrls: ['./estado-reclamo.component.css']
})
export class EstadoReclamoComponent implements OnInit {
  busquedaFolio: string = '';
  reclamoEncontrado: Reclamo | null = null;
  buscado: boolean = false;
  timeline: HitoTimeline[] = [];

  constructor(
    private route: ActivatedRoute,
    private reclamoService: ReclamoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Si la ruta trae parámetro de folio (ej: /estado-reclamo?folio=REC-2026-101)
    this.route.queryParams.subscribe(params => {
      if (params['folio']) {
        this.busquedaFolio = params['folio'];
        this.buscarReclamo();
      }
    });
  }

  buscarReclamo(): void {
    const termino = this.busquedaFolio.trim().toLowerCase();
    if (!termino) return;

    this.buscado = true;
    const usuarioId = this.authService.obtenerUsuarioActual()?.id;

    // Solo se buscan los reclamos del propio ciudadano. take(1) lee la lista una vez y
    // cierra la suscripción (antes cada búsqueda dejaba una abierta).
    this.reclamoService.obtenerReclamosDeUsuario(usuarioId).pipe(take(1)).subscribe(lista => {
      this.reclamoEncontrado = lista.find(
        r => r.folio.toLowerCase() === termino || r.id.toString() === termino
      ) ?? null;

      if (this.reclamoEncontrado) {
        this.generarTimeline(this.reclamoEncontrado);
      } else {
        this.timeline = [];
      }
    });
  }

  generarTimeline(reclamo: Reclamo): void {
    const esRechazado = reclamo.estado === EstadoReclamo.RECHAZADO;
    const esCerrado = reclamo.estado === EstadoReclamo.CERRADO;
    const esFinal = esRechazado || esCerrado;

    // Un reclamo rechazado no sigue el flujo normal: solo consta su recepción y el rechazo.
    const pasos = esRechazado ? PASOS_TIMELINE.slice(0, 1) : PASOS_TIMELINE;

    // Uno cerrado ya recorrió todo el flujo; en el resto, el paso actual es el del estado.
    const indiceActual = esFinal
      ? pasos.length - 1
      : pasos.findIndex(paso => paso.estado === reclamo.estado);

    const hitos: HitoTimeline[] = pasos.map((paso, i) => {
      const completado = i <= indiceActual;
      return {
        titulo: paso.titulo,
        fecha: this.fechaDelHito(reclamo, paso.estado, completado),
        descripcion: paso.desc,
        completado,
        actual: !esFinal && i === indiceActual
      };
    });

    if (esFinal) {
      hitos.push({
        titulo: esRechazado ? 'Reclamo Rechazado' : 'Reclamo Cerrado',
        fecha: reclamo.fechaResolucion ?? 'Sin fecha registrada',
        descripcion: esRechazado
          ? 'La solicitud fue revisada y no pudo ser acogida.'
          : 'El caso se dio por finalizado.',
        completado: true,
        actual: true
      });
    }

    this.timeline = hitos;
  }

  // Solo se muestran fechas que existen de verdad (antes todos los hitos usaban la de registro).
  private fechaDelHito(reclamo: Reclamo, estado: EstadoReclamo, completado: boolean): string {
    if (!completado) return 'Pendiente';
    if (estado === EstadoReclamo.RECIBIDO) return reclamo.fecha;
    if (estado === EstadoReclamo.RESUELTO) return reclamo.fechaResolucion ?? 'Sin fecha registrada';
    return 'Completado';
  }
}
