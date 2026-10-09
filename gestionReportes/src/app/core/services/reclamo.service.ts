import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import {
  Reclamo,
  CategoriaReclamo,
  ReporteEstadistico
} from '../../models/reclamo.model';
import {
  EstadoReclamo,
  PrioridadReclamo
} from '../../models/reclamo.enums';

@Injectable({
  providedIn: 'root'
})
export class ReclamoService {
  private reclamosMock: Reclamo[] = [
    {
      id: 101,
      folio: 'REC-2026-001',
      categoria: 'Aseo y Ornato',
      subcategoria: 'Microbasural',
      descripcion: 'Acumulación de basura en esquina principal.',
      esRecurrente: true,
      direccion: 'Av. Manhattan 123',
      ubicacion: 'Av. Manhattan 123',
      fecha: '2026-09-10',
      prioridad: PrioridadReclamo.ALTA,
      estado: EstadoReclamo.EN_PROCESO,
      agenteAsignado: 'Agente Pérez'
    },
    {
      id: 102,
      folio: 'REC-2026-002',
      categoria: 'Alumbrado Público',
      subcategoria: 'Luminaria Apagada',
      descripcion: 'Luminaria apagada en la plaza central.',
      esRecurrente: false,
      direccion: 'Central Park Oeste',
      ubicacion: 'Central Park Oeste',
      fecha: '2026-09-12',
      prioridad: PrioridadReclamo.MEDIA,
      estado: EstadoReclamo.RECIBIDO,
      agenteAsignado: 'Sin asignar'
    }
  ];

  private reclamosSubject = new BehaviorSubject<Reclamo[]>(
    this.reclamosMock
  );

  public reclamos$: Observable<Reclamo[]> =
    this.reclamosSubject.asObservable();

  getCategorias(): CategoriaReclamo[] {
    return [
      {
        nombre: 'Aseo y Ornato',
        subcategorias: [
          'Microbasural',
          'Corte de césped',
          'Escombros'
        ]
      },
      {
        nombre: 'Alumbrado Público',
        subcategorias: [
          'Luminaria Apagada',
          'Poste Dañado',
          'Foco Parpadeando'
        ]
      },
      {
        nombre: 'Infraestructura Urbana',
        subcategorias: [
          'Bache / Evento',
          'Vereda Rota',
          'Señalética Caída'
        ]
      },
      {
        nombre: 'Seguridad y Ruidos',
        subcategorias: [
          'Ruido Molesto',
          'Vehículo Abandonado',
          'Inseguridad'
        ]
      }
    ];
  }

  crearReclamo(
    nuevoReclamo: Omit<
      Reclamo,
      'id' | 'folio' | 'estado' | 'agenteAsignado' |
      'fecha' | 'fechaResolucion' | 'historialEstados'
    >
  ): Observable<Reclamo> {
    // Genera un identificador sin repetir los existentes.
    const id = Math.max(
      100,
      ...this.reclamosSubject.value.map(reclamo => reclamo.id)
    ) + 1;

    const ahora = new Date().toISOString();

    const reclamoCompleto: Reclamo = {
      ...nuevoReclamo,
      id,
      folio: `REC-${new Date().getFullYear()}-${id}`,
      estado: EstadoReclamo.RECIBIDO,
      prioridad: PrioridadReclamo.MEDIA,
      agenteAsignado: 'Sin asignar',
      fecha: ahora,
      fechaResolucion: undefined,
      historialEstados: [
        {
          estadoAnterior: null,
          estadoNuevo: EstadoReclamo.RECIBIDO,
          fechaHora: ahora,
          motivo: 'Ingreso del reclamo',
          realizadoPor: 'Ciudadano'
        }
      ]
    };

    this.reclamosSubject.next([
      reclamoCompleto,
      ...this.reclamosSubject.value
    ]);

    return new BehaviorSubject<Reclamo>(
      reclamoCompleto
    ).asObservable();
  }

  actualizarReclamo(
    folio: string,
    cambios: Partial<Reclamo>,
    motivo: string = '',
    realizadoPor: string = 'Administrador'
  ): void {
    const listaActualizada = this.reclamosSubject.value.map(
      reclamo => {
        if (reclamo.folio !== folio) {
          return reclamo;
        }

        const historial = [...(reclamo.historialEstados ?? [])];

        const actualizado: Reclamo = {
          ...reclamo,
          ...cambios,

          // Conserva la identidad y el ingreso original.
          id: reclamo.id,
          folio: reclamo.folio,
          fecha: reclamo.fecha,

          // Estos datos los administra el servicio.
          fechaResolucion: reclamo.fechaResolucion,
          historialEstados: historial
        };

        const cambiaEstado =
          cambios.estado !== undefined &&
          cambios.estado !== reclamo.estado;

        if (cambiaEstado) {
          const ahora = new Date().toISOString();

          historial.push({
            estadoAnterior: reclamo.estado,
            estadoNuevo: actualizado.estado,
            fechaHora: ahora,
            motivo: motivo.trim(),
            realizadoPor
          });

          if (actualizado.estado === EstadoReclamo.RESUELTO) {
            actualizado.fechaResolucion = ahora;
          } else if (
            actualizado.estado === EstadoReclamo.CERRADO &&
            reclamo.estado === EstadoReclamo.RESUELTO
          ) {
            // Conserva el tiempo hasta la resolución,
            // sin sumar el tiempo posterior hasta el cierre.
            actualizado.fechaResolucion = reclamo.fechaResolucion;
          } else {
            // Reapertura, rechazo o cierre sin resolución.
            actualizado.fechaResolucion = undefined;
          }
        }

        return actualizado;
      }
    );

    this.reclamosSubject.next(listaActualizada);
  }

  asignarAgente(folio: string, agente: string): void {
    this.actualizarReclamo(
      folio,
      {
        agenteAsignado: agente,
        estado: EstadoReclamo.EN_REVISION
      },
      'Asignación de agente',
      'Administrador'
    );
  }

  reabrirReclamo(folio: string, motivo: string): void {
    const reclamo = this.reclamosSubject.value.find(
      r => r.folio === folio
    );

    if (
      !reclamo ||
      reclamo.estado !== EstadoReclamo.RESUELTO ||
      !motivo.trim()
    ) {
      return;
    }

    this.actualizarReclamo(
      folio,
      { estado: EstadoReclamo.EN_REVISION },
      motivo,
      'Ciudadano'
    );
  }

  apelarReclamo(folio: string, motivo: string): void {
    const reclamo = this.reclamosSubject.value.find(
      r => r.folio === folio
    );

    if (
      !reclamo ||
      reclamo.estado !== EstadoReclamo.RECHAZADO ||
      !motivo.trim()
    ) {
      return;
    }

    this.actualizarReclamo(
      folio,
      { estado: EstadoReclamo.EN_REVISION },
      motivo,
      'Ciudadano'
    );
  }

  obtenerReporte(
    filtros: {
      fechaDesde?: string;
      fechaHasta?: string;
      categoria?: string;
      estado?: string;
    } = {}
  ): Observable<ReporteEstadistico> {
    return this.reclamos$.pipe(
      map(reclamos => {
        const reclamosFiltrados = reclamos.filter(reclamo => {
          const fechaIngreso = this.obtenerDiaIngreso(
            reclamo.fecha
          );

          const cumpleDesde =
            !filtros.fechaDesde ||
            fechaIngreso >= filtros.fechaDesde;

          const cumpleHasta =
            !filtros.fechaHasta ||
            fechaIngreso <= filtros.fechaHasta;

          const cumpleCategoria =
            !filtros.categoria ||
            filtros.categoria === 'Todas' ||
            reclamo.categoria === filtros.categoria;

          const cumpleEstado =
            !filtros.estado ||
            filtros.estado === 'Todos' ||
            reclamo.estado === filtros.estado;

          return (
            cumpleDesde &&
            cumpleHasta &&
            cumpleCategoria &&
            cumpleEstado
          );
        });

        const reclamosPorEstado = Object.values(
          EstadoReclamo
        ).map(estado => ({
          estado,
          cantidad: reclamosFiltrados.filter(
            reclamo => reclamo.estado === estado
          ).length
        }));

        const categorias = Array.from(
          new Set(
            reclamosFiltrados.map(reclamo => reclamo.categoria)
          )
        );

        const reclamosPorCategoria = categorias.map(
          categoria => ({
            categoria,
            cantidad: reclamosFiltrados.filter(
              reclamo => reclamo.categoria === categoria
            ).length
          })
        );

        const duracionesDias: number[] = [];

        for (const reclamo of reclamosFiltrados) {
          const estaFinalizado =
            reclamo.estado === EstadoReclamo.RESUELTO ||
            reclamo.estado === EstadoReclamo.CERRADO;

          if (!estaFinalizado || !reclamo.fechaResolucion) {
            continue;
          }

          const inicio = new Date(reclamo.fecha).getTime();
          const fin = new Date(
            reclamo.fechaResolucion
          ).getTime();

          if (
            Number.isFinite(inicio) &&
            Number.isFinite(fin) &&
            fin >= inicio
          ) {
            duracionesDias.push((fin - inicio) / 86400000);
          }
        }

        const tiempoPromedioResolucionDias =
          duracionesDias.length > 0
            ? duracionesDias.reduce(
                (total, dias) => total + dias,
                0
              ) / duracionesDias.length
            : null;

        return {
          totalReclamos: reclamosFiltrados.length,
          tiempoPromedioResolucionDias,
          reclamosPorEstado,
          reclamosPorCategoria
        };
      })
    );
  }

  private obtenerDiaIngreso(fecha: string): string {
    // Conserva las fechas antiguas que solo tienen día.
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return fecha;
    }

    // Para fechas con hora, usa el día local del navegador.
    const fechaLocal = new Date(fecha);

    if (!Number.isFinite(fechaLocal.getTime())) {
      return '';
    }

    const anio = fechaLocal.getFullYear();
    const mes = String(
      fechaLocal.getMonth() + 1
    ).padStart(2, '0');
    const dia = String(
      fechaLocal.getDate()
    ).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }
}