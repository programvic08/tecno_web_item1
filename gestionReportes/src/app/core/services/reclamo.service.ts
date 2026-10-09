import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Reclamo, CategoriaReclamo, ReporteEstadistico } from '../../models/reclamo.model';
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

  private reclamosSubject = new BehaviorSubject<Reclamo[]>(this.reclamosMock);
  public reclamos$: Observable<Reclamo[]> = this.reclamosSubject.asObservable();

  getCategorias(): CategoriaReclamo[] {
    return [
      { nombre: 'Aseo y Ornato', subcategorias: ['Microbasural', 'Corte de césped', 'Escombros'] },
      { nombre: 'Alumbrado Público', subcategorias: ['Luminaria Apagada', 'Poste Dañado', 'Foco Parpadeando'] },
      { nombre: 'Infraestructura Urbana', subcategorias: ['Bache / Evento', 'Vereda Rota', 'Señallética Caída'] },
      { nombre: 'Seguridad y Ruidos', subcategorias: ['Ruido Molesto', 'Vehículo Abandonado', 'Inseguridad'] }
    ];
  }

  crearReclamo(nuevoReclamo: Omit<Reclamo, 'id' | 'folio' | 'estado' | 'agenteAsignado' | 'fecha'>): Observable<Reclamo> {
    const id = Math.floor(Math.random() * 900) + 100;
    const reclamoCompleto: Reclamo = {
      ...nuevoReclamo,
      id,
      folio: `REC-2026-${id}`,
      estado: EstadoReclamo.RECIBIDO,
      prioridad: PrioridadReclamo.MEDIA,
      agenteAsignado: 'Sin asignar',
      fecha: new Date().toISOString().split('T')[0]
    };

    const listaActual = this.reclamosSubject.value;
    this.reclamosSubject.next([reclamoCompleto, ...listaActual]);
    return new BehaviorSubject(reclamoCompleto).asObservable();
  }

  actualizarReclamo(folio: string, cambios: Partial<Reclamo>): void {
    const listaActualizada = this.reclamosSubject.value.map(r => {
      if (r.folio === folio) {
        return { ...r, ...cambios };
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
    { id: 11, categoria: 'Infraestructura Urbana', subcategoria: 'Señallética Caída', cantidad: 6 },
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

  obtenerReporte(): Observable<ReporteEstadistico> {
    return this.reclamos$.pipe(
      map(reclamos => {
        const reclamosPorEstado = Object.values(EstadoReclamo).map(est => ({
          estado: est,
          cantidad: reclamos.filter(r => r.estado === est).length
        }));

        const categorias = Array.from(new Set(reclamos.map(r => r.categoria)));
        const reclamosPorCategoria = categorias.map(cat => ({
          categoria: cat,
          cantidad: reclamos.filter(r => r.categoria === cat).length
        }));

        return {
          totalReclamos: reclamos.length,
          tiempoPromedioResolucionDias: 3.5,
          reclamosPorEstado,
          reclamosPorCategoria
        };
      })
    );
  }
}