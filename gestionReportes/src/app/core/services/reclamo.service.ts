
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, defer, map, of } from 'rxjs';

import {
  Reclamo,
  CrearReclamoDto,
  ActualizarReclamoDto,
  CategoriaReclamo,
  EntradaBitacora,
  ReporteEstadistico
} from '../../models/reclamo.model';

import { ReporteComun } from '../../models/reporte-comun.model';
import { EstadoReclamo, PrioridadReclamo, RolUsuario } from '../../models/reclamo.enums';
import { SIN_ASIGNAR } from '../../models/reclamo.model';
import { AgenteAsignable } from '../../models/usuario.model';
import { AuthService } from './auth.service';
import { NotificacionService } from './notificacion.service';
import { esReclamoAbierto, evaluarPrioridad } from '../../shared/utils/prioridad';
import { RECLAMOS_DEMO } from '../config/reclamos-demo.config';

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
      sectorZona: 'Manhattan',
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
      sectorZona: 'Manhattan',
      fecha: '2026-09-12',
      prioridad: PrioridadReclamo.MEDIA,
      estado: EstadoReclamo.RECIBIDO,
      agenteAsignado: 'Sin asignar',
      usuarioId: 1,
      bitacora: [
        {
          fecha: '2026-09-12',
          autor: 'Sistema',
          estado: EstadoReclamo.RECIBIDO,
          observacion: 'El reclamo fue recibido y quedó pendiente de asignación.'
        }
      ]
    }
  ];

  private reclamosSubject = new BehaviorSubject<Reclamo[]>(this.aplicarPrioridad(this.reclamosMock, new Date()));
  // La prioridad se recalcula en cada suscripción y en cada cambio: el envejecimiento
  // depende de la fecha de hoy, así que no puede quedar guardada de forma fija.
  public reclamos$: Observable<Reclamo[]> = defer(() =>
    this.reclamosSubject.pipe(map(lista => this.aplicarPrioridad(lista, new Date())))
  );

  constructor(
    private authService: AuthService,
    private notificacionService: NotificacionService
  ) {}

  // Agrega los reclamos de ejemplo (idempotente). Se llama al arrancar la aplicación (AppModule),
  // no en el constructor, para que las pruebas unitarias partan solo con los dos reclamos base.
  cargarReclamosDemo(): void {
    const existentes = new Set(this.reclamosSubject.value.map(r => r.id));
    const nuevos = RECLAMOS_DEMO.filter(r => !existentes.has(r.id)).map(r => {
      // Un reclamo cerrado queda con el puntaje que tenía el día en que se cerró (última entrada de la bitácora)
      const ultima = r.bitacora?.[r.bitacora.length - 1]?.fecha;
      const cierre = ultima ? new Date(ultima) : new Date();
      return { ...r, ...evaluarPrioridad(r, esReclamoAbierto(r) ? new Date() : cierre) } as Reclamo;
    });
    if (nuevos.length > 0) {
      this.reclamosSubject.next([...this.reclamosSubject.value, ...nuevos]);
    }
  }

  // Los reclamos abiertos reciben prioridad y puntaje vigentes. Los cerrados conservan
  // el que tenían al cerrarse (ya no envejecen).
  private aplicarPrioridad(lista: Reclamo[], ahora: Date): Reclamo[] {
    return lista.map(reclamo => esReclamoAbierto(reclamo) ? { ...reclamo, ...evaluarPrioridad(reclamo, ahora) } : reclamo);
  }

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


  crearReclamo(nuevoReclamo: CrearReclamoDto): Observable<Reclamo> {
    const id = this.generarId();
    const fecha = new Date().toISOString().split('T')[0];

    const reclamoCompleto: Reclamo = {
      ...nuevoReclamo,
      id,
      folio: `REC-${new Date().getFullYear()}-${String(id).padStart(3, '0')}`,
      estado: EstadoReclamo.RECIBIDO,
      // La prioridad no la elige el ciudadano: la calcula el sistema con el puntaje
      ...evaluarPrioridad({ ...nuevoReclamo, fecha }),
      agenteAsignado: SIN_ASIGNAR,
      agenteId: null,
      fecha,
      fechaResolucion: undefined,
      resultadoCierre: undefined,
      bitacora: [{
        fecha: new Date().toISOString(),
        autor: this.authService.obtenerUsuarioActual()?.nombre ?? 'Ciudadano',
        estado: EstadoReclamo.RECIBIDO,
        observacion: 'El reclamo fue recibido y quedó pendiente de asignación.' }]

    };

    const listaActual = this.reclamosSubject.value;

    this.reclamosSubject.next([
      reclamoCompleto,
      ...listaActual
    ]);

    this.notificacionService.crear(
      this.authService.obtenerAdministradores().map(usuario => usuario.id),
      'nuevo-reclamo', 'Nuevo reclamo pendiente de asignación',
      'El reclamo ' + reclamoCompleto.folio + ' está pendiente de asignación.', reclamoCompleto
    );
    return of(reclamoCompleto);
  }

  private generarId(): number {
    return this.reclamosSubject.value.reduce(
      (maximo, reclamo) => Math.max(maximo, reclamo.id),
      0
    ) + 1;
  }


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


  actualizarReclamo(folio: string, cambios: ActualizarReclamoDto, observacion?: string, autor?: string): boolean {
    const reclamo = this.buscarGestionable(folio);
    if (!reclamo || reclamo.estado === EstadoReclamo.CERRADO) return false;
    const protegidos: (keyof Reclamo)[] = [
      'id', 'folio', 'usuarioId', 'estado', 'agenteId', 'agenteAsignado',
      'bitacora', 'fechaResolucion', 'resultadoCierre', 'prioridad', 'puntaje'
    ];
    if (protegidos.some(campo => Object.prototype.hasOwnProperty.call(cambios, campo))) return false;
    if (observacion !== undefined) return false;
    // Si el cambio altera el puntaje (por ejemplo, la subcategoría), la prioridad se recalcula
    const anterior = evaluarPrioridad(reclamo);
    const modificado = { ...reclamo, ...cambios };
    const actualizado = { ...modificado, ...evaluarPrioridad(modificado) };
    this.guardar(actualizado);
    if (actualizado.prioridad !== anterior.prioridad) {
      const actorId = this.authService.obtenerUsuarioActual()?.id;
      this.notificacionService.crear(
        [reclamo.usuarioId ?? 0, reclamo.agenteId ?? 0].filter(id => id !== actorId),
        'bitacora', 'Actualización de tu caso',
        'Se actualizó la prioridad del caso ' + folio + '.', actualizado
      );
    }
    return true;
  }

  asignarAgente(folio: string, agente: AgenteAsignable | null): boolean {
    const reclamo = this.buscarGestionable(folio);
    if (!this.puedeAsignar() || !reclamo || reclamo.estado !== EstadoReclamo.RECIBIDO) return false;
    if (!agente) return !reclamo.agenteId;
    const disponible = this.authService.obtenerAgentes().find(a => a.id === agente.id);
    if (!disponible) return false;
    const actualizado: Reclamo = {
      ...reclamo, agenteId: disponible.id, agenteAsignado: disponible.nombre,
      estado: EstadoReclamo.EN_REVISION,
      bitacora: [...(reclamo.bitacora ?? []), this.entrada(EstadoReclamo.EN_REVISION,
        'Caso asignado a ' + disponible.nombre + '.')]
    };
    this.guardar(actualizado);
    if (disponible.id !== this.authService.obtenerUsuarioActual()?.id) {
      this.notificacionService.crear([disponible.id], 'asignacion', 'Te asignaron un caso',
        'El caso ' + folio + ' fue asignado a tu bandeja.', actualizado);
    }
    return true;
  }

  // Al eliminar la cuenta de un agente, sus reclamos vuelven a "Sin asignar"
  // sin cambiar el estado en el que estaban. Devuelve cuántos se liberaron.
  liberarReclamosDeAgente(agenteId: number): number {
    let liberados = 0;

    const lista = this.reclamosSubject.value.map(reclamo => {
      if (reclamo.agenteId !== agenteId) {
        return reclamo;
      }

      liberados++;
      return {
        ...reclamo,
        agenteId: null,
        agenteAsignado: SIN_ASIGNAR
      };
    });

    if (liberados > 0) {
      this.reclamosSubject.next(lista);
    }

    return liberados;
  }

  registrarAvance(folio: string, observacion: string): boolean {
    const reclamo = this.buscarGestionable(folio);
    const texto = observacion.trim();
    if (!reclamo || !texto || !reclamo.agenteId ||
        ![EstadoReclamo.EN_REVISION, EstadoReclamo.EN_PROCESO].includes(reclamo.estado)) return false;
    const primero = reclamo.estado === EstadoReclamo.EN_REVISION;
    const actualizado: Reclamo = {
      ...reclamo, estado: EstadoReclamo.EN_PROCESO,
      bitacora: [...(reclamo.bitacora ?? []), this.entrada(EstadoReclamo.EN_PROCESO, texto)]
    };
    this.guardar(actualizado);
    this.notificacionService.crear([reclamo.usuarioId ?? 0], 'bitacora',
      primero ? 'Tu reclamo se encuentra en proceso' : 'Hay una nueva actualización en tu reclamo',
      'Actualización del caso ' + folio + ': ' + texto, actualizado);
    return true;
  }

  rechazarReclamo(folio: string, motivo: string): boolean {
    if (!motivo.trim()) return false;
    return this.cerrar(folio, 'Rechazado', motivo.trim());
  }

  resolverReclamo(folio: string): boolean {
    return this.cerrar(folio, 'Resuelto', 'El reclamo fue resuelto.');
  }

  private cerrar(folio: string, resultado: 'Resuelto' | 'Rechazado', observacion: string): boolean {
    const reclamo = this.buscarGestionable(folio);
    const resuelto = resultado === 'Resuelto';
    if (!reclamo || !reclamo.agenteId || reclamo.estado !==
        (resuelto ? EstadoReclamo.EN_PROCESO : EstadoReclamo.EN_REVISION)) return false;
    const actualizado: Reclamo = {
      // Al cerrar se congela la prioridad y el puntaje que tenía el reclamo
      ...reclamo, ...evaluarPrioridad(reclamo), estado: EstadoReclamo.CERRADO, resultadoCierre: resultado,
      fechaResolucion: resuelto ? new Date().toISOString().slice(0, 10) : undefined,
      bitacora: [...(reclamo.bitacora ?? []),
        this.entrada(resuelto ? EstadoReclamo.RESUELTO : EstadoReclamo.RECHAZADO, observacion),
        this.entrada(EstadoReclamo.CERRADO, 'Reclamo cerrado por ' + (resuelto ? 'resolución' : 'rechazo') + '.')]
    };
    this.guardar(actualizado);
    this.notificacionService.crear([reclamo.usuarioId ?? 0], resuelto ? 'resolucion' : 'rechazo',
      resuelto ? 'Tu reclamo fue resuelto y cerrado' : 'Tu reclamo fue rechazado',
      'Caso ' + folio + ': ' + observacion, actualizado);
    return true;
  }

  private buscarGestionable(folio: string): Reclamo | undefined {
    const reclamo = this.reclamosSubject.value.find(r => r.folio === folio);
    return reclamo && this.puedeGestionar(reclamo) ? reclamo : undefined;
  }

  private entrada(estado: EstadoReclamo, observacion: string): EntradaBitacora {
    return { fecha: new Date().toISOString(),
      autor: this.authService.obtenerUsuarioActual()!.nombre, estado, observacion };
  }

  // Un reclamo abierto se guarda siempre con su prioridad y puntaje al día
  private guardar(reclamo: Reclamo): void {
    const guardado = esReclamoAbierto(reclamo) ? { ...reclamo, ...evaluarPrioridad(reclamo) } : reclamo;
    this.reclamosSubject.next(this.reclamosSubject.value.map(r => r.folio === guardado.folio ? guardado : r));
  }


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
        if (
          filtros?.estado &&
          filtros.estado !== 'Todos'
        ) {
          seleccionados = seleccionados.filter(
            r => r.estado === filtros.estado
          );
        }
        const reclamosFiltrados = seleccionados.filter(r => {

          const fecha = r.fecha.slice(0, 10);

          return (
            (!filtros?.fechaDesde ||
              fecha >= filtros.fechaDesde) &&
            (!filtros?.fechaHasta ||
              fecha <= filtros.fechaHasta)
          );
        });
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
            (r.estado === EstadoReclamo.CERRADO && r.resultadoCierre !== 'Rechazado')
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
