
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';

import {
  Reclamo,
  CategoriaReclamo,
  EntradaBitacora,
  ReporteEstadistico
} from '../../models/reclamo.model';

import { ReporteComun } from '../../models/reporte-comun.model';
import { EstadoReclamo, PrioridadReclamo, RolUsuario } from '../../models/reclamo.enums';
import { SIN_ASIGNAR } from '../../models/reclamo.model';
import { AgenteAsignable } from '../../models/usuario.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReclamoService {

  // ==========================================
  // 1. DATOS DE PRUEBA
  // ==========================================

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
      agenteId: 3,
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

  constructor(private authService: AuthService) {}

  // --- Permisos por rol ---
  // Administrador: todos los reclamos. Agente: solo los que tiene asignados.
  // Cualquier otro rol (o sin sesión): ninguno.

  puedeGestionar(reclamo: Reclamo): boolean {
    const usuario = this.authService.obtenerUsuarioActual();
    if (!usuario) {
      return false;
    }
    if (usuario.rol === RolUsuario.ADMINISTRADOR) {
      return true;
    }
    return usuario.rol === RolUsuario.AGENTE && reclamo.agenteId === usuario.id;
  }

  // Solo el administrador reparte reclamos entre los agentes
  puedeAsignar(): boolean {
    return this.authService.obtenerUsuarioActual()?.rol === RolUsuario.ADMINISTRADOR;
  }

  // Lo que el usuario con sesión puede ver en la bandeja y en los reportes de gestión.
  // Se evalúa en cada emisión, con el usuario de ese momento.
  get reclamosVisibles$(): Observable<Reclamo[]> {
    return this.reclamos$.pipe(
      map(lista => lista.filter(r => this.puedeGestionar(r)))
    );
  }

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

  // ==========================================
  // 3. CREAR RECLAMO
  // ==========================================

  crearReclamo(nuevoReclamo: Omit<Reclamo, 'id' | 'folio' | 'estado' | 'agenteAsignado' | 'agenteId' | 'fecha'>): Observable<Reclamo> {
    const id = this.generarId();

    const reclamoCompleto: Reclamo = {
      ...nuevoReclamo,
      id,
      folio: `REC-${new Date().getFullYear()}-${String(id).padStart(3, '0')}`,
      estado: EstadoReclamo.RECIBIDO,
      prioridad: PrioridadReclamo.MEDIA,
      agenteAsignado: SIN_ASIGNAR,
      agenteId: null,
      fecha: new Date().toISOString().split('T')[0]
    };

    const listaActual = this.reclamosSubject.value;

    this.reclamosSubject.next([
      reclamoCompleto,
      ...listaActual
    ]);

    return of(reclamoCompleto);
  }

  private generarId(): number {
    return this.reclamosSubject.value.reduce(
      (maximo, reclamo) => Math.max(maximo, reclamo.id),
      0
    ) + 1;
  }

  // ==========================================
  // 4. RECLAMOS POR USUARIO
  // ==========================================

  obtenerReclamosDeUsuario(
    usuarioId: number | undefined
  ): Observable<Reclamo[]> {

    return this.reclamos$.pipe(
      map(lista =>
        lista.filter(
          reclamo =>
            usuarioId !== undefined &&
            reclamo.usuarioId === usuarioId
        )
      )
    );
  }

  // ==========================================
  // 5. ACTUALIZAR RECLAMO
  // ==========================================

  // Devuelve false (y no cambia nada) si el reclamo no existe o el usuario no puede gestionarlo.
  actualizarReclamo(folio: string, cambios: Partial<Reclamo>, observacion?: string, autor?: string): boolean {
    const objetivo = this.reclamosSubject.value.find(r => r.folio === folio);
    if (!objetivo || !this.puedeGestionar(objetivo)) {
      return false;
    }

    // Un agente puede editar su reclamo, pero no cambiar quién lo tiene asignado
    if (!this.puedeAsignar()) {
      const { agenteId, agenteAsignado, ...sinAsignacion } = cambios;
      cambios = sinAsignacion;
    }

    const listaActualizada = this.reclamosSubject.value.map(r => {
      if (r.folio === folio) {
        const actualizado = { ...r, ...cambios };
        if (cambios.estado === EstadoReclamo.RESUELTO) {

          const yaResuelto =
            r.estado === EstadoReclamo.RESUELTO ||
            r.estado === EstadoReclamo.CERRADO;

          actualizado.fechaResolucion =
            yaResuelto && r.fechaResolucion
              ? r.fechaResolucion
              : new Date().toISOString().slice(0, 10);

        } else if (
          cambios.estado &&
          cambios.estado !== EstadoReclamo.CERRADO
        ) {
          // Si se reabre, deja de estar resuelto.
          actualizado.fechaResolucion = undefined;
        }

        // Registrar observación en la bitácora.
        const texto = observacion?.trim();

        if (texto) {
          const entrada: EntradaBitacora = {
            fecha: new Date().toISOString().slice(0, 10),
            autor: autor?.trim() || 'Agente Municipal',
            estado: actualizado.estado,
            observacion: texto
          };

          actualizado.bitacora = [
            ...(r.bitacora ?? []),
            entrada
          ];
        }

        return actualizado;
      }
      return r;
    });

    this.reclamosSubject.next(listaActualizada);
    return true;
  }

  // Solo el administrador puede asignar. Con agente null el reclamo queda sin asignar.
  asignarAgente(folio: string, agente: AgenteAsignable | null): boolean {
    if (!this.puedeAsignar() || !this.reclamosSubject.value.some(r => r.folio === folio)) {
      return false;
    }

    const lista = this.reclamosSubject.value.map(r => {
      if (r.folio === folio) {
        return {
          ...r,
          agenteId: agente?.id ?? null,
          agenteAsignado: agente?.nombre ?? SIN_ASIGNAR,
          estado: agente ? EstadoReclamo.EN_REVISION : r.estado
        };
      }

      return r;
    });

    this.reclamosSubject.next(lista);
    return true;
  }

  // ==========================================
  // 7. ESTADÍSTICAS BASE
  // ==========================================

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

  // ==========================================
  // 8. REPORTES MÁS COMUNES
  // ==========================================

  obtenerReportesComunes(): Observable<ReporteComun[]> {

    return this.reclamos$.pipe(
      map(reclamos => {

        const conteo = new Map<string, ReporteComun>();

        for (const base of this.estadisticaBase) {
          conteo.set(
            `${base.categoria}|${base.subcategoria}`,
            { ...base }
          );
        }

        for (const reclamo of reclamos) {

          const clave =
            `${reclamo.categoria}|${reclamo.subcategoria}`;

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

        return Array.from(conteo.values()).sort(
          (a, b) => b.cantidad - a.cantidad
        );
      })
    );
  }

  // ==========================================
  // 9. REPORTE ESTADÍSTICO GENERAL
  // ==========================================

  obtenerReporte(filtros?: {
    fechaDesde?: string;
    fechaHasta?: string;
    categoria?: string;
    estado?: string;
  }): Observable<ReporteEstadistico> {
    // El reporte se calcula solo con lo que el usuario puede ver: el administrador, todo; el agente, lo suyo
    return this.reclamosVisibles$.pipe(
      map(reclamos => {

        let seleccionados = reclamos;

        // Filtrar por categoría.
        if (
          filtros?.categoria &&
          filtros.categoria !== 'Todas'
        ) {
          seleccionados = seleccionados.filter(
            r => r.categoria === filtros.categoria
          );
        }

        // Filtrar por estado.
        if (
          filtros?.estado &&
          filtros.estado !== 'Todos'
        ) {
          seleccionados = seleccionados.filter(
            r => r.estado === filtros.estado
          );
        }

        // Filtrar por fecha de ingreso.
        const reclamosFiltrados = seleccionados.filter(r => {

          const fecha = r.fecha.slice(0, 10);

          return (
            (!filtros?.fechaDesde ||
              fecha >= filtros.fechaDesde) &&
            (!filtros?.fechaHasta ||
              fecha <= filtros.fechaHasta)
          );
        });

        // Cantidad de reclamos por estado.
        const reclamosPorEstado = Object.values(
          EstadoReclamo
        ).map(estado => ({
          estado,
          cantidad: reclamosFiltrados.filter(
            r => r.estado === estado
          ).length
        }));

        // Cantidad de reclamos por categoría.
        const categorias = Array.from(
          new Set(
            reclamosFiltrados.map(r => r.categoria)
          )
        );

        const reclamosPorCategoria = categorias.map(
          categoria => ({
            categoria,
            cantidad: reclamosFiltrados.filter(
              r => r.categoria === categoria
            ).length
          })
        );

        // Tiempo promedio de resolución.
        const duraciones = reclamosFiltrados
          .filter(r =>
            r.estado === EstadoReclamo.RESUELTO ||
            r.estado === EstadoReclamo.CERRADO
          )
          .map(r => this.diasHastaResolucion(r))
          .filter(
            (dias): dias is number => dias !== null
          );

        const promedio = duraciones.length > 0
          ? duraciones.reduce(
              (total, dias) => total + dias,
              0
            ) / duraciones.length
          : null;

        // Construir reporte completo.
        return {
          totalReclamos: reclamosFiltrados.length,
          tiempoPromedioResolucionDias: promedio,
          reclamosPorEstado,
          reclamosPorCategoria,
          reclamosPorMes: this.agruparCantidadPorMes(
            reclamosFiltrados,
            filtros?.fechaDesde,
            filtros?.fechaHasta
          )
        };
      })
    );
  }

  // ==========================================
  // 10. CANTIDAD DE RECLAMOS POR MES
  // ==========================================

  private agruparCantidadPorMes(
    reclamos: Reclamo[],
    fechaDesde?: string,
    fechaHasta?: string
  ): { mes: string; cantidad: number }[] {

    const ahora = new Date();

    // Si no hay fechas, mostrar el año actual.
    const anioActual = ahora.getFullYear();

    const inicio = fechaDesde
      ? fechaDesde.slice(0, 7)
      : fechaHasta
        ? `${fechaHasta.slice(0, 4)}-01`
        : `${anioActual}-01`;

    const fin = fechaHasta
      ? fechaHasta.slice(0, 7)
      : fechaDesde
        ? `${fechaDesde.slice(0, 4)}-12`
        : `${anioActual}-12`;

    const validarMes = (valor: string): boolean => {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(valor)) {
        return false;
      }

      return true;
    };

    if (
      !validarMes(inicio) ||
      !validarMes(fin) ||
      inicio > fin
    ) {
      return [];
    }

    // Contar reclamos por mes de ingreso.
    const conteo = new Map<string, number>();

    for (const reclamo of reclamos) {

      const fecha = reclamo.fecha.slice(0, 10);

      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        continue;
      }

      if (fechaDesde && fecha < fechaDesde) {
        continue;
      }

      if (fechaHasta && fecha > fechaHasta) {
        continue;
      }

      const mes = fecha.slice(0, 7);

      conteo.set(
        mes,
        (conteo.get(mes) ?? 0) + 1
      );
    }

    const resultado: {
      mes: string;
      cantidad: number;
    }[] = [];

    const anioInicio = Number(inicio.slice(0, 4));
    const mesInicio = Number(inicio.slice(5, 7));

    const anioFin = Number(fin.slice(0, 4));
    const mesFin = Number(fin.slice(5, 7));

    const indiceInicio = anioInicio * 12 + mesInicio - 1;
    const indiceFin = anioFin * 12 + mesFin - 1;

    // Incluir también los meses sin reclamos.
    for (
      let indice = indiceInicio;
      indice <= indiceFin;
      indice++
    ) {

      const anio = Math.floor(indice / 12);

      const numeroMes = String(
        (indice % 12) + 1
      ).padStart(2, '0');

      const mes = `${anio}-${numeroMes}`;

      resultado.push({
        mes,
        cantidad: conteo.get(mes) ?? 0
      });
    }

    return resultado;
  }

  // ==========================================
  // 11. CALCULAR DÍAS HASTA RESOLUCIÓN
  // ==========================================

  private diasHastaResolucion(
    reclamo: Reclamo
  ): number | null {

    // Convertir fecha YYYY-MM-DD a UTC.
    const convertir = (
      fecha: string | undefined
    ): number | null => {

      if (
        !fecha ||
        !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
      ) {
        return null;
      }

      const instante = Date.parse(
        fecha + 'T00:00:00Z'
      );

      if (!Number.isFinite(instante)) {
        return null;
      }

      const fechaValidada = new Date(instante)
        .toISOString()
        .slice(0, 10);

      return fechaValidada === fecha
        ? instante
        : null;
    };

    const inicio = convertir(reclamo.fecha);

    const fin = convertir(
      reclamo.fechaResolucion
    );

    // Descartar fechas inválidas.
    if (
      inicio === null ||
      fin === null ||
      fin < inicio ||
      fin > Date.now()
    ) {
      return null;
    }

    const milisegundosPorDia = 86400000;

    return (fin - inicio) / milisegundosPorDia;
  }
}
