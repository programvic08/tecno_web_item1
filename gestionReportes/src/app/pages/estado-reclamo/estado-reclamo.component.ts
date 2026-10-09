import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReclamoService } from '../../core/services/reclamo.service';
import { Reclamo } from '../../models/reclamo.model';
import { EstadoReclamo } from '../../models/reclamo.enums';

interface HitoTimeline {
  titulo: string;
  fecha: string;
  descripcion: string;
  completado: boolean;
  actual: boolean;
}

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
    private reclamoService: ReclamoService
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
    if (!this.busquedaFolio.trim()) return;

    this.buscado = true;
    this.reclamoService.reclamos$.subscribe(lista => {
      const encontrado = lista.find(
        r => r.folio.toLowerCase() === this.busquedaFolio.trim().toLowerCase() ||
             r.id.toString() === this.busquedaFolio.trim()
      );

      this.reclamoEncontrado = encontrado || null;

      if (this.reclamoEncontrado) {
        this.generarTimeline(this.reclamoEncontrado);
      }
    });
  }

  generarTimeline(reclamo: Reclamo): void {
    const estadosSecuencia = [
      { estado: EstadoReclamo.RECIBIDO, titulo: 'Solicitud Recibida', desc: 'El sistema registró con éxito el reporte ciudadano.' },
      { estado: EstadoReclamo.EN_REVISION, titulo: 'En Revisión Técnica', desc: 'Asignado a inspección municipal y validación de antecedentes.' },
      { estado: EstadoReclamo.EN_PROCESO, titulo: 'En Proceso de Solución', desc: 'Cuadrilla o departamento operativo desplegado en el sector.' },
      { estado: EstadoReclamo.RESUELTO, titulo: 'Resolución Completada', desc: 'Trabajos finalizados y verificación conforme.' }
    ];

    let pasoActualAlcanzado = false;

    this.timeline = estadosSecuencia.map((item) => {
      const esActual = reclamo.estado === item.estado;
      
      // Si aún no hemos pasado la etapa actual, está completado
      const esCompletado = !pasoActualAlcanzado;
      
      if (esActual) {
        pasoActualAlcanzado = true;
      }

      return {
        titulo: item.titulo,
        fecha: esCompletado ? reclamo.fecha : 'Pendiente',
        descripcion: item.desc,
        completado: esCompletado,
        actual: esActual
      };
    });
  }
}