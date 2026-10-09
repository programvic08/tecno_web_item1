import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { DiapositivaReporte } from '../../../models/reporte-comun.model';

@Component({
  selector: 'app-reportes-carousel',
  templateUrl: './reportes-carousel.component.html',
  styleUrls: ['./reportes-carousel.component.css']
})
export class ReportesCarouselComponent implements OnInit, OnChanges, OnDestroy {

  // Láminas entregadas por la página (más reportadas primero)
  @Input() items: DiapositivaReporte[] = [];

  // Autoavance en milisegundos (la guía indica 6 s)
  @Input() intervalMs = 6000;

  indiceActual = 0;

  private temporizador?: ReturnType<typeof setInterval>;

  // Quien pide menos movimiento en su sistema no recibe autoavance
  private readonly reducirMovimiento =
    typeof window !== 'undefined' && !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  ngOnInit(): void {
    this.reiniciar();
  }

  // Los datos llegan de forma asíncrona: si la lista cambia, el índice no puede quedar fuera
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] && this.indiceActual >= this.items.length) {
      this.indiceActual = 0;
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.temporizador);
  }

  irA(indice: number): void {
    if (this.items.length === 0) {
      return;
    }
    this.indiceActual = (indice + this.items.length) % this.items.length;
  }

  siguiente(): void {
    this.irA(this.indiceActual + 1);
    this.reiniciar();
  }

  anterior(): void {
    this.irA(this.indiceActual - 1);
    this.reiniciar();
  }

  // También lo usa la página padre vía @ViewChild
  seleccionar(indice: number): void {
    this.irA(indice);
    this.reiniciar();
  }

  pausar(): void {
    clearInterval(this.temporizador);
  }

  reanudar(): void {
    this.reiniciar();
  }

  private reiniciar(): void {
    clearInterval(this.temporizador);
    if (this.reducirMovimiento) {
      return;
    }
    this.temporizador = setInterval(() => this.irA(this.indiceActual + 1), this.intervalMs);
  }
}
