import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReclamoService } from '../../core/services/reclamo.service';
import { RUTAS } from '../../core/config/navegacion.config';
import { ReporteComun } from '../../models/reporte-comun.model';
import { DIAPOSITIVAS_HOME } from '../../core/config/diapositivas-home.config';
import { PREGUNTAS_FRECUENTES } from '../../core/config/preguntas-frecuentes.config';
import { buscarPlantilla } from '../../core/config/plantillas-reclamo.config';

// Cuántos reportes comunes se muestran en las cartas deslizables
const LIMITE_FRECUENTES = 6;

@Component({
  selector: 'app-userhome',
  templateUrl: './userhome.component.html',
  styleUrls: ['./userhome.component.css']
})
export class UserhomeComponent implements OnInit, OnDestroy {

  readonly rutaCrear = RUTAS.crear;

  readonly diapositivas = DIAPOSITIVAS_HOME;
  readonly preguntasFrecuentes = PREGUNTAS_FRECUENTES;
  frecuentes: ReporteComun[] = [];

  @ViewChild('reportesFrecuentes') reportesFrecuentes?: ElementRef<HTMLElement>;

  // Pista desplazable de las cartas
  @ViewChild('pista') pista?: ElementRef<HTMLDivElement>;

  private suscripciones = new Subscription();

  constructor(private reclamoService: ReclamoService) {}

  ngOnInit(): void {
    this.suscripciones.add(
      this.reclamoService.obtenerReportesComunes().subscribe(reportes => {
        this.frecuentes = reportes
          .filter(reporte => reporte.subcategoria !== '')
          .slice(0, LIMITE_FRECUENTES);
      })
    );
  }

  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
  }

  parametrosReporte(reporte: ReporteComun): Record<string, string> {
    const plantilla = buscarPlantilla(reporte.categoria, reporte.subcategoria);
    return plantilla ? { plantilla: plantilla.id } : {
      categoria: reporte.categoria,
      subcategoria: reporte.subcategoria
    };
  }

  // Desplaza las cartas un paso a la izquierda (-1) o a la derecha (1)
  desplazar(direccion: number): void {
    this.pista?.nativeElement.scrollBy({ left: direccion * 320, behavior: 'smooth' });
  }

  irASeccion(seccion: string): void {
    if (seccion === 'reportes-frecuentes') {
      const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.reportesFrecuentes?.nativeElement.scrollIntoView({
        behavior: reducirMovimiento ? 'auto' : 'smooth', block: 'start'
      });
    }
  }
}
