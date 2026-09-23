import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Reclamo, CategoriaReclamo, ReporteEstadistico } from '../../models/reclamo.model';
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