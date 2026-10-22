import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import { Reclamo, CategoriaReclamo, EntradaBitacora, ReporteEstadistico } from '../../models/reclamo.model';
import { ReporteComun } from '../../models/reporte-comun.model';
import { EstadoReclamo, PrioridadReclamo } from '../../models/reclamo.enums';

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
      agenteAsignado: 'Agente Pérez',
      usuarioId: 1
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
      agenteAsignado: 'Sin asignar',
      usuarioId: 1
    }
  ];

  private reclamosSubject = new BehaviorSubject<Reclamo[]>(this.reclamosMock);
  public reclamos$: Observable<Reclamo[]> = this.reclamosSubject.asObservable();

  getCategorias(): CategoriaReclamo[] {
    return [
      { nombre: 'Aseo y Ornato', subcategorias: ['Microbasural', 'Corte de césped', 'Escombros'] },
      { nombre: 'Alumbrado Público', subcategorias: ['Luminaria Apagada', 'Poste Dañado', 'Foco Parpadeando'] },
      { nombre: 'Infraestructura Urbana', subcategorias: ['Bache / Evento', 'Vereda Rota', 'Señalética Caída'] },
      { nombre: 'Seguridad y Ruidos', subcategorias: ['Ruido Molesto', 'Vehículo Abandonado', 'Inseguridad'] }
    ];
  }

  crearReclamo(nuevoReclamo: Omit<Reclamo, 'id' | 'folio' | 'estado' | 'agenteAsignado' | 'fecha'>): Observable<Reclamo> {
    const id = this.generarId();
    const reclamoCompleto: Reclamo = {
      ...nuevoReclamo,
      id,
      folio: `REC-${new Date().getFullYear()}-${String(id).padStart(3, '0')}`,
      estado: EstadoReclamo.RECIBIDO,
      prioridad: PrioridadReclamo.MEDIA,
      agenteAsignado: 'Sin asignar',
      fecha: new Date().toISOString().split('T')[0]
    };

    const listaActual = this.reclamosSubject.value;
    this.reclamosSubject.next([reclamoCompleto, ...listaActual]);
    return of(reclamoCompleto);
  }

  // El próximo id es el mayor existente + 1: nunca se repite, así dos reclamos no comparten folio.
  private generarId(): number {
    return this.reclamosSubject.value.reduce((maximo, r) => Math.max(maximo, r.id), 0) + 1;
  }

  // Solo los reclamos creados por ese usuario (el historial y la consulta de estado muestran los propios).
  obtenerReclamosDeUsuario(usuarioId: number | undefined): Observable<Reclamo[]> {
    return this.reclamos$.pipe(
      map(lista => lista.filter(r => usuarioId !== undefined && r.usuarioId === usuarioId))
    );
  }

  actualizarReclamo(folio: string, cambios: Partial<Reclamo>, observacion?: string, autor?: string): void {
    const listaActualizada = this.reclamosSubject.value.map(r => {
      if (r.folio === folio) {
        const actualizado = { ...r, ...cambios };
        if (cambios.estado === EstadoReclamo.RESUELTO) {
          const yaResuelto = r.estado === EstadoReclamo.RESUELTO || r.estado === EstadoReclamo.CERRADO;
          actualizado.fechaResolucion = yaResuelto && r.fechaResolucion
            ? r.fechaResolucion : new Date().toISOString().slice(0, 10);
        } else if (cambios.estado && cambios.estado !== EstadoReclamo.CERRADO) {
          actualizado.fechaResolucion = undefined;
        }

        const texto = observacion?.trim();
        if (texto) {
          const entrada: EntradaBitacora = {
            fecha: new Date().toISOString().slice(0, 10),
            autor: autor?.trim() || 'Agente Municipal',
            estado: actualizado.estado,
            observacion: texto
          };
          actualizado.bitacora = [...(r.bitacora ?? []), entrada];
        }
        return actualizado;
      }
      return r;
    });
    this.reclamosSubject.next(listaActualizada);
  }
  
  asignarAgente(folio: string, agente: string): void {
    const lista = this.reclamosSubject.value.map(r => {
      if (r.folio === folio) {
        return { ...r, agenteAsignado: agente, estado: EstadoReclamo.EN_REVISION };
      }
      return r;
    });
    this.reclamosSubject.next(lista);
  }

  // Estadística base de los últimos 30 días (datos de demostración hasta tener backend).
  // A ella se suman los reclamos que existan en memoria, así el ranking se mueve al crear uno.
  private readonly estadisticaBase: ReporteComun[] = [
    { id: 1, categoria: 'Aseo y Ornato', subcategoria: 'Microbasural', cantidad: 42 },
    { id: 2, categoria: 'Alumbrado Público', subcategoria: 'Luminaria Apagada', cantidad: 37 },
    { id: 3, categoria: 'Infraestructura Urbana', subcategoria: 'Bache / Evento', cantidad: 31 },
    { id: 4, categoria: 'Seguridad y Ruidos', subcategoria: 'Ruido Molesto', cantidad: 24 },
    { id: 5, categoria: 'Infraestructura Urbana', subcategoria: 'Vereda Rota', cantidad: 19 },
    { id: 6, categoria: 'Aseo y Ornato', subcategoria: 'Escombros', cantidad: 17 },
    { id: 7, categoria: 'Alumbrado Público', subcategoria: 'Foco Parpadeando', cantidad: 14 },
    { id: 8, categoria: 'Alumbrado Público', subcategoria: 'Poste Dañado', cantidad: 11 },
    { id: 9, categoria: 'Seguridad y Ruidos', subcategoria: 'Vehículo Abandonado', cantidad: 9 },
    { id: 10, categoria: 'Aseo y Ornato', subcategoria: 'Corte de césped', cantidad: 8 },
    { id: 11, categoria: 'Infraestructura Urbana', subcategoria: 'Señalética Caída', cantidad: 6 },
    { id: 12, categoria: 'Seguridad y Ruidos', subcategoria: 'Inseguridad', cantidad: 5 }
  ];

  // Ranking de reportes más comunes por subcategoría, de mayor a menor.
  obtenerReportesComunes(): Observable<ReporteComun[]> {
    return this.reclamos$.pipe(
      map(reclamos => {
        const conteo = new Map<string, ReporteComun>();
        for (const base of this.estadisticaBase) {
          conteo.set(`${base.categoria}|${base.subcategoria}`, { ...base });
        }
        for (const reclamo of reclamos) {
          const clave = `${reclamo.categoria}|${reclamo.subcategoria}`;
          const existente = conteo.get(clave);
          if (existente) {
            existente.cantidad++;
          } else {
            conteo.set(clave, {
              id: 100 + conteo.size,
              categoria: reclamo.categoria,
              subcategoria: reclamo.subcategoria,
              cantidad: 1
            });
          }
        }
        return Array.from(conteo.values()).sort((a, b) => b.cantidad - a.cantidad);
      })
    );
  }

  obtenerReporte(filtros?: {
    fechaDesde?: string;
    fechaHasta?: string;
    categoria?: string;
    estado?: string;
  }): Observable<ReporteEstadistico> {
    return this.reclamos$.pipe(
      map(reclamos => {
        let reclamosFiltrados = reclamos;

        if (filtros?.fechaDesde) {
          reclamosFiltrados = reclamosFiltrados.filter(r => r.fecha >= filtros.fechaDesde!);
        }
        if (filtros?.fechaHasta) {
          reclamosFiltrados = reclamosFiltrados.filter(r => r.fecha <= filtros.fechaHasta!);
        }
        if (filtros?.categoria && filtros.categoria !== 'Todas') {
          reclamosFiltrados = reclamosFiltrados.filter(r => r.categoria === filtros.categoria);
        }
        if (filtros?.estado && filtros.estado !== 'Todos') {
          reclamosFiltrados = reclamosFiltrados.filter(r => r.estado === filtros.estado);
        }

        const reclamosPorEstado = Object.values(EstadoReclamo).map(est => ({
          estado: est,
          cantidad: reclamosFiltrados.filter(r => r.estado === est).length
        }));

        const categorias = Array.from(new Set(reclamosFiltrados.map(r => r.categoria)));
        const reclamosPorCategoria = categorias.map(cat => ({
          categoria: cat,
          cantidad: reclamosFiltrados.filter(r => r.categoria === cat).length
        }));

        const duraciones = reclamosFiltrados
          .filter(r => r.estado === EstadoReclamo.RESUELTO || r.estado === EstadoReclamo.CERRADO)
          .map(r => this.diasHastaResolucion(r))
          .filter((dias): dias is number => dias !== null);
        const promedio = duraciones.length
          ? duraciones.reduce((total, dias) => total + dias, 0) / duraciones.length
          : null;

        return {
          totalReclamos: reclamosFiltrados.length,
          tiempoPromedioResolucionDias: promedio,
          reclamosPorEstado,
          reclamosPorCategoria
        };
      })
    );
  }

  private diasHastaResolucion(reclamo: Reclamo): number | null {
    // Comparar fechas calendario en UTC evita diferencias por horario de verano.
    const convertir = (fecha: string | undefined): number | null => {
      if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;
      const instante = Date.parse(fecha + 'T00:00:00Z');
      return Number.isFinite(instante) && new Date(instante).toISOString().slice(0, 10) === fecha
        ? instante : null;
    };
    const inicio = convertir(reclamo.fecha);
    const fin = convertir(reclamo.fechaResolucion);
    if (inicio === null || fin === null || fin < inicio || fin > Date.now()) return null;
    return (fin - inicio) / 86400000;
  }
}
