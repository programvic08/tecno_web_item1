import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReclamoService } from '../../core/services/reclamo.service';
import { RUTAS, TAREAS_ADMIN } from '../../core/config/navegacion.config';
import { DiapositivaReporte } from '../../models/reporte-comun.model';
import { crearDiapositivas } from '../../shared/utils/diapositivas-reportes';

@Component({
  selector: 'app-adminhome',
  templateUrl: './adminhome.component.html',
  styleUrls: ['./adminhome.component.css']
})
export class AdminhomeComponent implements OnInit, OnDestroy {

  readonly tareas = TAREAS_ADMIN;
  readonly rutas = RUTAS;

  diapositivas: DiapositivaReporte[] = [];

  private suscripciones = new Subscription();

  constructor(private reclamoService: ReclamoService) {}

  ngOnInit(): void {
    this.suscripciones.add(
      this.reclamoService.obtenerReportesComunes().subscribe(reportes => {
        this.diapositivas = crearDiapositivas(reportes, {
          ruta: RUTAS.reportes,
          etiqueta: 'Ver el reporte estadístico',
          conCategoria: false
        });
      })
    );
  }

  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
  }
}
