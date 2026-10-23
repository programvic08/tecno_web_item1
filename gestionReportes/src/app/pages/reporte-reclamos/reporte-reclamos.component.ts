import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import { Subscription } from 'rxjs';
import Chart from 'chart.js/auto';

import { errorFechaNoFutura } from '../../shared/utils/fechas';
import { ReclamoService } from '../../core/services/reclamo.service';
import { ReporteEstadistico } from '../../models/reclamo.model';
import { EstadoReclamo } from '../../models/reclamo.enums';

@Component({
  selector: 'app-reporte-reclamos',
  templateUrl: './reporte-reclamos.component.html',
  styleUrls: ['./reporte-reclamos.component.css']
})
export class ReporteReclamosComponent implements OnInit, OnDestroy {

  // ==========================================
  // 1. FILTROS
  // ==========================================

  filtroFechaDesde = '';
  filtroFechaHasta = '';
  filtroCategoria = 'Todas';
  filtroEstado = 'Todos';

  categorias: string[] = ['Todas'];

  estados: string[] = [
    'Todos',
    ...Object.values(EstadoReclamo)
  ];

  isLoading = false;
  mensajeError = '';

  // ==========================================
  // 2. DATOS DEL REPORTE
  // ==========================================

  reporte: ReporteEstadistico = {
    totalReclamos: 0,
    tiempoPromedioResolucionDias: null,
    reclamosPorEstado: [],
    reclamosPorCategoria: [],
    reclamosPorMes: []
  };

  private reporteSubscription?: Subscription;

  private grafico?: Chart<
    'line',
    (number | null)[],
    string
  >;

  private canvas?: HTMLCanvasElement;

  // ==========================================
  // 3. REFERENCIA AL CANVAS
  // ==========================================

  @ViewChild('graficoMensual')
  set referenciaGrafico(
    elemento: ElementRef<HTMLCanvasElement> | undefined
  ) {

    const nuevoCanvas = elemento?.nativeElement;

    if (this.canvas === nuevoCanvas) {
      return;
    }

    this.grafico?.destroy();
    this.grafico = undefined;

    this.canvas = nuevoCanvas;

    if (this.canvas) {
      this.actualizarGrafico();
    }
  }

  // ==========================================
  // 4. CONSTRUCTOR
  // ==========================================

  constructor(
    private reclamoService: ReclamoService
  ) {

    this.categorias = [
      'Todas',
      ...this.reclamoService
        .getCategorias()
        .map(categoria => categoria.nombre)
    ];
  }

  // ==========================================
  // 5. INICIALIZACIÓN
  // ==========================================

  ngOnInit(): void {
    this.cargarDatos();
  }

  // ==========================================
  // 6. CARGAR DATOS
  // ==========================================

  cargarDatos(): void {

    this.mensajeError = '';

    // Validar fechas futuras.
    if (
      errorFechaNoFutura(this.filtroFechaDesde, 'date') ||
      errorFechaNoFutura(this.filtroFechaHasta, 'date')
    ) {
      this.mensajeError =
        'Las fechas no pueden ser futuras.';
      return;
    }

    // Validar orden de fechas.
    if (
      this.filtroFechaDesde &&
      this.filtroFechaHasta &&
      this.filtroFechaDesde > this.filtroFechaHasta
    ) {
      this.mensajeError =
        'La fecha Desde no puede ser posterior a la fecha Hasta.';
      return;
    }

    // El gráfico representa un solo año.
    if (
      this.filtroFechaDesde &&
      this.filtroFechaHasta &&
      this.filtroFechaDesde.slice(0, 4) !==
        this.filtroFechaHasta.slice(0, 4)
    ) {
      this.mensajeError =
        'Selecciona fechas del mismo año para esta vista anual.';
      return;
    }

    this.reporteSubscription?.unsubscribe();

    this.isLoading = true;

    this.reporteSubscription =
      this.reclamoService.obtenerReporte({
        fechaDesde: this.filtroFechaDesde,
        fechaHasta: this.filtroFechaHasta,
        categoria: this.filtroCategoria,
        estado: this.filtroEstado
      }).subscribe({

        next: datos => {

          this.reporte = datos;
          this.isLoading = false;

          this.actualizarGrafico();
        },

        error: () => {

          this.isLoading = false;

          this.mensajeError =
            'No se pudo cargar el reporte. Intenta nuevamente.';
        }
      });
  }

  // ==========================================
  // 7. APLICAR FILTROS
  // ==========================================

  aplicarFiltros(): void {
    this.cargarDatos();
  }

  // ==========================================
  // 8. LIMPIAR FILTROS
  // ==========================================

  limpiarFiltros(): void {

    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.filtroCategoria = 'Todas';
    this.filtroEstado = 'Todos';

    this.cargarDatos();
  }

  // ==========================================
  // 9. AÑO DEL GRÁFICO
  // ==========================================

  get anioGrafico(): string {

    if (this.filtroFechaDesde) {
      return this.filtroFechaDesde.slice(0, 4);
    }

    if (this.filtroFechaHasta) {
      return this.filtroFechaHasta.slice(0, 4);
    }

    return String(new Date().getFullYear());
  }

  // ==========================================
  // 10. CANTIDADES MENSUALES
  // ==========================================

  private obtenerCantidadesMensuales(): (number | null)[] {

    // Los 12 meses del año.
    const cantidades: (number | null)[] =
      Array(12).fill(null);

    const anio = this.anioGrafico;

    const datos = this.reporte.reclamosPorMes ?? [];

    const mapaCantidades = new Map<string, number>();

    // Asociar cada cantidad con su mes real.
    for (const item of datos) {

      if (item.cantidad !== null) {

        mapaCantidades.set(
          item.mes,
          item.cantidad
        );
      }
    }

    // Recorrer enero a diciembre.
    for (let mes = 1; mes <= 12; mes++) {

      const numeroMes = String(mes).padStart(2, '0');

      const clave = `${anio}-${numeroMes}`;

      // No mostrar meses anteriores al filtro Desde.
      if (
        this.filtroFechaDesde &&
        clave < this.filtroFechaDesde.slice(0, 7)
      ) {
        cantidades[mes - 1] = null;
        continue;
      }

      // No mostrar meses posteriores al filtro Hasta.
      if (
        this.filtroFechaHasta &&
        clave > this.filtroFechaHasta.slice(0, 7)
      ) {
        cantidades[mes - 1] = null;
        continue;
      }

      // Mes con reclamos o con cantidad cero.
      cantidades[mes - 1] =
        mapaCantidades.get(clave) ?? 0;
    }

    return cantidades;
  }

  // ==========================================
  // 11. CREAR Y ACTUALIZAR GRÁFICO
  // ==========================================

  private actualizarGrafico(): void {

    if (!this.canvas) {
      return;
    }

    const meses = [
      'Ene', 'Feb', 'Mar', 'Abr',
      'May', 'Jun', 'Jul', 'Ago',
      'Sep', 'Oct', 'Nov', 'Dic'
    ];

    const cantidades =
      this.obtenerCantidadesMensuales();

    // Actualizar el gráfico existente.
    if (this.grafico) {

      this.grafico.data.labels = meses;

      this.grafico.data.datasets[0].data =
        cantidades;

      this.grafico.update();

      return;
    }

    // Crear gráfico de líneas.
    this.grafico = new Chart<
      'line',
      (number | null)[],
      string
    >(
      this.canvas,
      {
        type: 'line',

        data: {
          labels: meses,

          datasets: [
            {
              label: 'Reclamos ingresados',
              data: cantidades,

              // Color de la línea.
              borderColor: '#27aeb9',
              backgroundColor: '#27aeb9',

              // Grosor de la línea.
              borderWidth: 2,

              // Puntos pequeños y definidos.
              pointRadius: 4,
              pointHoverRadius: 6,

              pointBackgroundColor: '#27aeb9',
              pointBorderColor: '#ffffff',

              pointBorderWidth: 1,
              pointHoverBorderWidth: 2,

              // Línea recta entre puntos.
              tension: 0,

              fill: false,
              spanGaps: false
            }
          ]
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,

          layout: {
            padding: {
              top: 12,
              right: 12,
              bottom: 8,
              left: 8
            }
          },

          plugins: {

            legend: {
              display: false
            },

            tooltip: {
              callbacks: {

                title: elementos =>
                  elementos.length
                    ? `${elementos[0].label} ${this.anioGrafico}`
                    : '',

                label: contexto => {

                  const cantidad = contexto.parsed.y;

                  if (cantidad === null) {
                    return 'Sin dato';
                  }

                  return `${cantidad} ${
                    cantidad === 1
                      ? 'reclamo'
                      : 'reclamos'
                  }`;
                }
              }
            }
          },

          scales: {

            // ==================================
            // EJE X: MESES
            // ==================================

            x: {

              grid: {
                display: false
              },

              title: {
                display: true,
                text: 'Mes',

                font: {
                  size: 13,
                  weight: 'bold'
                },

                padding: {
                  top: 10
                }
              },

              ticks: {
                autoSkip: false,
                maxRotation: 0,
                minRotation: 0,

                font: {
                  size: 11
                }
              }
            },

            // ==================================
            // EJE Y: CANTIDAD DE RECLAMOS
            // ==================================

            y: {

              // Pequeño espacio bajo cero para
              // que los puntos se vean completos.
              min: -1,

              // Máximo visible.
              max: 60,

              // Mostrar marcas cada 10 unidades.
              afterBuildTicks: axis => {
                axis.ticks = [
                  -1, 0, 10, 20, 30, 40, 50, 60
                ].map(value => ({ value }));
              },

              ticks: {
                precision: 0,

                callback: value => {
                  const numero = Number(value);

                  return numero >= 0
                    ? String(numero)
                    : '';
                }
              },

              title: {
                display: true,
                text: 'Cantidad de reclamos',

                font: {
                  size: 13,
                  weight: 'bold'
                }
              },

              grid: {
                color: '#e5edf2'
              }
            }
          }
        }
      }
    );
  }

  // ==========================================
  // 12. LIMPIEZA DE RECURSOS
  // ==========================================

  ngOnDestroy(): void {

    this.reporteSubscription?.unsubscribe();

    this.grafico?.destroy();
    this.grafico = undefined;
  }
}