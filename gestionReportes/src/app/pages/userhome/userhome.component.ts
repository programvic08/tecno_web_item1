import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReclamoService } from '../../core/services/reclamo.service';
import { RUTAS, TAREAS_CIUDADANO } from '../../core/config/navegacion.config';
import { DiapositivaReporte, ReporteComun } from '../../models/reporte-comun.model';
import { ReportesCarouselComponent } from '../../shared/components/reportes-carousel/reportes-carousel.component';
import { crearDiapositivas } from '../../shared/utils/diapositivas-reportes';

// Cuántos reportes comunes se muestran en las cartas deslizables
const LIMITE_FRECUENTES = 6;

@Component({
  selector: 'app-userhome',
  templateUrl: './userhome.component.html',
  styleUrls: ['./userhome.component.css']
})
export class UserhomeComponent implements OnInit, OnDestroy {

  readonly tareas = TAREAS_CIUDADANO;
  readonly rutaCrear = RUTAS.crear;

  diapositivas: DiapositivaReporte[] = [];
  frecuentes: ReporteComun[] = [];

  // Referencia al carrusel hijo (técnica del curso: @ViewChild)
  @ViewChild(ReportesCarouselComponent) carrusel?: ReportesCarouselComponent;

  // Pista desplazable de las cartas
  @ViewChild('pista') pista?: ElementRef<HTMLDivElement>;

  private suscripciones = new Subscription();

  constructor(private reclamoService: ReclamoService) {}

  ngOnInit(): void {
    this.suscripciones.add(
      this.reclamoService.obtenerReportesComunes().subscribe(reportes => {
        this.diapositivas = crearDiapositivas(reportes, {
          ruta: RUTAS.crear,
          etiqueta: 'Reportar un problema de esta categoría',
          conCategoria: true
        });
        this.frecuentes = reportes
          .filter(reporte => reporte.subcategoria !== '')
          .slice(0, LIMITE_FRECUENTES);
      })
    );
  }

  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
  }

  // Desplaza las cartas un paso a la izquierda (-1) o a la derecha (1)
  desplazar(direccion: number): void {
    this.pista?.nativeElement.scrollBy({ left: direccion * 320, behavior: 'smooth' });
  }

  // Posición de la categoría de una carta dentro del carrusel (-1 si no está entre las láminas)
  indiceDiapositiva(reporte: ReporteComun): number {
    return this.diapositivas.findIndex(d => d.titulo === reporte.categoria);
  }

  verEnCarrusel(reporte: ReporteComun): void {
    const indice = this.indiceDiapositiva(reporte);
    if (indice < 0) {
      return;
    }
    this.carrusel?.seleccionar(indice);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
