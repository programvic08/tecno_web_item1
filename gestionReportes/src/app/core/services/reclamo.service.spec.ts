import { of } from 'rxjs';
import { EstadoReclamo, PrioridadReclamo } from '../../models/reclamo.enums';
import { Reclamo } from '../../models/reclamo.model';
import { TestBed } from '@angular/core/testing';

import { ReclamoService } from './reclamo.service';
import { AuthService } from './auth.service';
import { USUARIO_ADMIN_PRUEBA, USUARIO_AGENTE_PRUEBA, USUARIO_CIUDADANO_PRUEBA } from '../../testing/usuarios-prueba';
import { NotificacionService } from './notificacion.service';
import { Usuario } from '../../models/usuario.model';
import { evaluarPrioridad } from '../../shared/utils/prioridad';

describe('ReclamoService', () => {
  let service: ReclamoService;
  let usuarioActual: jasmine.Spy<() => Usuario | null>;

  // Por defecto los tests corren con sesión de administrador (ve y modifica todo)
  beforeEach(() => {
    TestBed.configureTestingModule({});
    usuarioActual = spyOn(TestBed.inject(AuthService), 'obtenerUsuarioActual').and.returnValue(USUARIO_ADMIN_PRUEBA);
    service = TestBed.inject(ReclamoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('filtros del reporte', () => {
    let reclamos: Reclamo[];
    beforeEach(() => {
      const base = { subcategoria: 'Subcategoria', descripcion: 'Descripcion', esRecurrente: false,
        direccion: 'Direccion', ubicacion: 'Direccion', prioridad: PrioridadReclamo.MEDIA, agenteAsignado: 'Sin asignar' };
      reclamos = [
        { ...base, id: 1, folio: '1', categoria: 'A', estado: EstadoReclamo.RECIBIDO, fecha: '2026-09-10' },
        { ...base, id: 2, folio: '2', categoria: 'B', estado: EstadoReclamo.RESUELTO, fecha: '2026-09-12' },
        { ...base, id: 3, folio: '3', categoria: 'A', estado: EstadoReclamo.RESUELTO, fecha: '2026-09-15' },
        { ...base, id: 4, folio: '4', categoria: 'A', estado: EstadoReclamo.RESUELTO, fecha: '2026-09-20' }
      ];
      service.reclamos$ = of(reclamos);
    });

    const casos: { nombre: string; filtros?: Parameters<ReclamoService['obtenerReporte']>[0]; ids: number[] }[] = [
      { nombre: 'sin filtros devuelve todos', ids: [1, 2, 3, 4] },
      { nombre: 'Todas y Todos no filtran', filtros: { categoria: 'Todas', estado: 'Todos', fechaDesde: '', fechaHasta: '' }, ids: [1, 2, 3, 4] },
      { nombre: 'categoria', filtros: { categoria: 'A' }, ids: [1, 3, 4] },
      { nombre: 'estado', filtros: { estado: EstadoReclamo.RESUELTO }, ids: [2, 3, 4] },
      { nombre: 'fechaDesde inclusiva', filtros: { fechaDesde: '2026-09-12' }, ids: [2, 3, 4] },
      { nombre: 'fechaHasta inclusiva', filtros: { fechaHasta: '2026-09-15' }, ids: [1, 2, 3] },
      { nombre: 'combinacion de los cuatro filtros', filtros: { fechaDesde: '2026-09-12', fechaHasta: '2026-09-15', categoria: 'A', estado: EstadoReclamo.RESUELTO }, ids: [3] },
      { nombre: 'sin coincidencias', filtros: { categoria: 'Inexistente' }, ids: [] }
    ];
    for (const caso of casos) {
      it(caso.nombre, () => {
        const esperados = reclamos.filter(r => caso.ids.includes(r.id));
        service.obtenerReporte(caso.filtros).subscribe(reporte => {
          expect(reporte.totalReclamos).toBe(esperados.length);
          expect(reporte.reclamosPorEstado).toEqual(Object.values(EstadoReclamo).map(estado => ({
            estado, cantidad: esperados.filter(r => r.estado === estado).length
          })));
          expect(reporte.reclamosPorCategoria).toEqual([...new Set(esperados.map(r => r.categoria))].map(categoria => ({
            categoria, cantidad: esperados.filter(r => r.categoria === categoria).length
          })));
          expect(reporte.tiempoPromedioResolucionDias).toBeNull();
        });
        service.obtenerReporte().subscribe(reporte => expect(reporte.totalReclamos).toBe(4));
      });
    }
  });

  it('calcula promedio real incluyendo cero dias y respeta filtros', () => {
    let originales: Reclamo[] = [];
    service.reclamos$.subscribe(rs => originales = rs).unsubscribe();
    const base = originales[0];
    service.reclamos$ = of([
      { ...base, categoria: 'A', estado: EstadoReclamo.RESUELTO, fecha: '2026-01-01', fechaResolucion: '2026-01-04' },
      { ...base, categoria: 'A', estado: EstadoReclamo.CERRADO, fecha: '2026-01-02', fechaResolucion: '2026-01-06' },
      { ...base, categoria: 'B', estado: EstadoReclamo.RESUELTO, fecha: '2026-01-02', fechaResolucion: '2026-01-02' },
      { ...base, estado: EstadoReclamo.RESUELTO },
      { ...base, estado: EstadoReclamo.EN_PROCESO, fechaResolucion: '2026-09-15' },
      { ...base, estado: EstadoReclamo.RESUELTO, fechaResolucion: 'invalida' },
      { ...base, estado: EstadoReclamo.RESUELTO, fechaResolucion: '2026-02-30' },
      { ...base, estado: EstadoReclamo.RESUELTO, fechaResolucion: '2026-01-01' },
      { ...base, estado: EstadoReclamo.RESUELTO, fechaResolucion: '2999-01-01' }
    ]);
    service.obtenerReporte().subscribe(r => expect(r.tiempoPromedioResolucionDias).toBeCloseTo(7 / 3));
    service.obtenerReporte({ categoria: 'A' }).subscribe(r => expect(r.tiempoPromedioResolucionDias).toBe(3.5));
    service.obtenerReporte({ categoria: 'B' }).subscribe(r => expect(r.tiempoPromedioResolucionDias).toBe(0));
    service.obtenerReporte({ categoria: 'Sin coincidencias' }).subscribe(r => expect(r.tiempoPromedioResolucionDias).toBeNull());
  });
  describe('flujo controlado y notificaciones', () => {
    const folio = 'REC-2026-002';
    let notificar: jasmine.Spy;
    const caso = (): Reclamo => {
      let reclamo!: Reclamo;
      service.reclamos$.subscribe(rs => reclamo = rs.find(r => r.folio === folio)!).unsubscribe();
      return reclamo;
    };
    beforeEach(() => { notificar = spyOn(TestBed.inject(NotificacionService), 'crear'); });

    it('crea recibido sin agente y notifica a administradores con el folio', () => {
      service.crearReclamo({ ...caso(), estado: EstadoReclamo.CERRADO, agenteId: 3,
        resultadoCierre: 'Resuelto', fechaResolucion: '2020-01-01' } as any).subscribe(r => {
        expect(r.estado).toBe(EstadoReclamo.RECIBIDO);
        expect(r.agenteId).toBeNull();
        expect(r.resultadoCierre).toBeUndefined();
        expect(r.fechaResolucion).toBeUndefined();
        expect(r.bitacora?.length).toBe(1);
        expect(notificar).toHaveBeenCalledWith([USUARIO_ADMIN_PRUEBA.id], 'nuevo-reclamo',
          'Nuevo reclamo pendiente de asignación', jasmine.stringContaining(r.folio), r);
      });
    });
    it('asigna, registra bit?cora y notifica al agente', () => {
      expect(service.asignarAgente(folio, USUARIO_AGENTE_PRUEBA)).toBeTrue();
      expect(caso().estado).toBe(EstadoReclamo.EN_REVISION);
      expect(caso().bitacora?.length).toBe(2);
      expect(notificar).toHaveBeenCalledWith([USUARIO_AGENTE_PRUEBA.id], 'asignacion',
        'Te asignaron un caso', jasmine.stringContaining(folio), caso());
    });
    it('autoasignación registra bit?cora sin notificarse', () => {
      expect(service.asignarAgente(folio, USUARIO_ADMIN_PRUEBA)).toBeTrue();
      expect(caso().bitacora?.length).toBe(2);
      expect(notificar).not.toHaveBeenCalled();
    });
    it('primer avance inicia proceso y siguientes avances conservan estado', () => {
      service.asignarAgente(folio, USUARIO_AGENTE_PRUEBA);
      usuarioActual.and.returnValue(USUARIO_AGENTE_PRUEBA);
      expect(service.registrarAvance(folio, '  ')).toBeFalse();
      expect(service.registrarAvance(folio, 'Inspección')).toBeTrue();
      expect(caso().estado).toBe(EstadoReclamo.EN_PROCESO);
      expect(notificar).toHaveBeenCalledWith([1], 'bitacora', 'Tu reclamo se encuentra en proceso', jasmine.any(String), caso());
      expect(service.registrarAvance(folio, 'Reparación')).toBeTrue();
      expect(caso().estado).toBe(EstadoReclamo.EN_PROCESO);
      expect(caso().bitacora?.slice(-1)[0].autor).toBe(USUARIO_AGENTE_PRUEBA.nombre);
      expect(notificar).toHaveBeenCalledWith([1], 'bitacora', 'Hay una nueva actualización en tu reclamo', jasmine.any(String), caso());
    });
    it('rechazo exige revisi?n y motivo y cierra con resultado y notificaci?n', () => {
      expect(service.rechazarReclamo(folio, 'Motivo')).toBeFalse();
      service.asignarAgente(folio, USUARIO_AGENTE_PRUEBA);
      expect(service.rechazarReclamo(folio, ' ')).toBeFalse();
      expect(service.rechazarReclamo(folio, 'Fuera de competencia')).toBeTrue();
      expect(caso().estado).toBe(EstadoReclamo.CERRADO);
      expect(caso().resultadoCierre).toBe('Rechazado');
      expect(caso().fechaResolucion).toBeUndefined();
      expect(caso().bitacora?.slice(-2).map(e => e.estado)).toEqual([EstadoReclamo.RECHAZADO, EstadoReclamo.CERRADO]);
      expect(notificar).toHaveBeenCalledWith([1], 'rechazo', 'Tu reclamo fue rechazado', jasmine.stringContaining('Fuera de competencia'), caso());
      expect(service.rechazarReclamo(folio, 'Otra vez')).toBeFalse();
      expect(service.registrarAvance(folio, 'Reabrir')).toBeFalse();
    });
    it('resolver exige proceso y notifica cierre resuelto', () => {
      expect(service.resolverReclamo(folio)).toBeFalse();
      service.asignarAgente(folio, USUARIO_AGENTE_PRUEBA);
      expect(service.resolverReclamo(folio)).toBeFalse();
      service.registrarAvance(folio, 'Trabajo');
      expect(service.actualizarReclamo(folio, { estado: EstadoReclamo.RECIBIDO })).toBeFalse();
      expect(service.rechazarReclamo(folio, 'Motivo')).toBeFalse();
      expect(service.resolverReclamo(folio)).toBeTrue();
      expect(caso().fechaResolucion).toBe(new Date().toISOString().slice(0, 10));
      expect(caso().bitacora?.slice(-2).map(e => e.estado)).toEqual([EstadoReclamo.RESUELTO, EstadoReclamo.CERRADO]);
      expect(caso().resultadoCierre).toBe('Resuelto');
      expect(caso().estado).toBe(EstadoReclamo.CERRADO);
      expect(notificar).toHaveBeenCalledWith([1], 'resolucion', 'Tu reclamo fue resuelto y cerrado', jasmine.any(String), caso());
      expect(service.resolverReclamo(folio)).toBeFalse();
      expect(service.actualizarReclamo(folio, { estado: EstadoReclamo.EN_REVISION })).toBeFalse();
      expect(service.asignarAgente(folio, USUARIO_ADMIN_PRUEBA)).toBeFalse();
    });
    it('bloquea saltos manuales y manipulación de campos protegidos', () => {
      for (const estado of Object.values(EstadoReclamo)) {
        expect(service.actualizarReclamo(folio, { estado })).toBeFalse();
      }
      for (const cambios of [{ bitacora: [] }, { resultadoCierre: 'Resuelto' as const }, { agenteId: 3 }, { usuarioId: 3 }]) {
        expect(service.actualizarReclamo(folio, cambios)).toBeFalse();
      }
      expect(service.registrarAvance(folio, 'Sin asignar')).toBeFalse();
    });
    it('agente ajeno y ciudadano no pueden ejecutar acciones', () => {
      service.asignarAgente(folio, USUARIO_ADMIN_PRUEBA);
      for (const usuario of [USUARIO_AGENTE_PRUEBA, USUARIO_CIUDADANO_PRUEBA, null]) {
        usuarioActual.and.returnValue(usuario);
        expect(service.registrarAvance(folio, 'Intento')).toBeFalse();
        expect(service.rechazarReclamo(folio, 'Intento')).toBeFalse();
        expect(service.resolverReclamo(folio)).toBeFalse();
      }
    });
  });

  describe('permisos por rol', () => {
    const idsVisibles = (): number[] => {
      let ids: number[] = [];
      service.reclamosVisibles$.subscribe(rs => ids = rs.map(r => r.id)).unsubscribe();
      return ids;
    };
    const buscar = (folio: string) => {
      let encontrado: Reclamo | undefined;
      service.reclamos$.subscribe(rs => encontrado = rs.find(r => r.folio === folio)).unsubscribe();
      return encontrado!;
    };

    // REC-2026-001 (id 101) está asignado al agente de prueba; REC-2026-002 (id 102) no tiene agente.
    it('el administrador ve todos los reclamos', () => {
      expect(idsVisibles()).toEqual([101, 102]);
    });

    it('el agente solo ve los reclamos que tiene asignados', () => {
      usuarioActual.and.returnValue(USUARIO_AGENTE_PRUEBA);
      expect(idsVisibles()).toEqual([101]);
    });

    it('un ciudadano o una sesión inexistente no ven reclamos de gestión', () => {
      usuarioActual.and.returnValue(USUARIO_CIUDADANO_PRUEBA);
      expect(idsVisibles()).toEqual([]);
      usuarioActual.and.returnValue(null);
      expect(idsVisibles()).toEqual([]);
    });

    it('el agente puede modificar su reclamo y queda constancia en la bitácora', () => {
      usuarioActual.and.returnValue(USUARIO_AGENTE_PRUEBA);
      const guardado = service.registrarAvance('REC-2026-001', 'Listo');
      expect(guardado).toBeTrue();
      expect(buscar('REC-2026-001').estado).toBe(EstadoReclamo.EN_PROCESO);
      expect(buscar('REC-2026-001').bitacora?.length).toBe(1);
    });

    it('el agente no puede modificar un reclamo ajeno ni uno sin asignar', () => {
      usuarioActual.and.returnValue(USUARIO_AGENTE_PRUEBA);
      const antes = buscar('REC-2026-002');
      expect(service.actualizarReclamo('REC-2026-002', { estado: EstadoReclamo.RESUELTO })).toBeFalse();
      expect(buscar('REC-2026-002')).toEqual(antes);
    });

    it('el agente no puede cambiar la asignación aunque modifique su propio reclamo', () => {
      usuarioActual.and.returnValue(USUARIO_AGENTE_PRUEBA);
      const guardado = service.actualizarReclamo('REC-2026-001', {
        prioridad: PrioridadReclamo.URGENTE, agenteId: USUARIO_ADMIN_PRUEBA.id, agenteAsignado: 'Otro'
      });
      expect(guardado).toBeFalse();
      expect(buscar('REC-2026-001').prioridad).toBe(evaluarPrioridad(buscar('REC-2026-001')).prioridad);
      expect(buscar('REC-2026-001').agenteId).toBe(USUARIO_AGENTE_PRUEBA.id);
      expect(buscar('REC-2026-001').agenteAsignado).toBe('Agente Pérez');
    });

    it('solo el administrador asigna reclamos; el agente lo ve al recibirlo', () => {
      usuarioActual.and.returnValue(USUARIO_AGENTE_PRUEBA);
      expect(service.asignarAgente('REC-2026-002', { id: USUARIO_AGENTE_PRUEBA.id, nombre: USUARIO_AGENTE_PRUEBA.nombre })).toBeFalse();
      expect(idsVisibles()).toEqual([101]);

      usuarioActual.and.returnValue(USUARIO_ADMIN_PRUEBA);
      expect(service.asignarAgente('REC-2026-002', { id: USUARIO_AGENTE_PRUEBA.id, nombre: USUARIO_AGENTE_PRUEBA.nombre })).toBeTrue();

      usuarioActual.and.returnValue(USUARIO_AGENTE_PRUEBA);
      expect(idsVisibles()).toEqual([101, 102]);
    });

    it('no quita asignacion en proceso', () => {
      expect(service.asignarAgente('REC-2026-001', null)).toBeFalse();
      expect(buscar('REC-2026-001').agenteId).toBe(USUARIO_AGENTE_PRUEBA.id);
    });

    it('el reporte del agente se calcula solo con sus reclamos', () => {
      usuarioActual.and.returnValue(USUARIO_AGENTE_PRUEBA);
      service.obtenerReporte().subscribe(r => expect(r.totalReclamos).toBe(1)).unsubscribe();
      usuarioActual.and.returnValue(USUARIO_ADMIN_PRUEBA);
      service.obtenerReporte().subscribe(r => expect(r.totalReclamos).toBe(2)).unsubscribe();
    });
  });

  describe('prioridad automática', () => {
    const nuevo = (extra: Partial<Reclamo> = {}) => ({
      categoria: 'Seguridad y Ruidos', subcategoria: 'Inseguridad', descripcion: 'Descripcion',
      esRecurrente: false, direccion: 'Broadway 100', ubicacion: 'Broadway 100',
      sectorZona: 'Manhattan', usuarioId: 1, ...extra
    });
    const buscar = (folio: string) => {
      let encontrado: Reclamo | undefined;
      service.reclamos$.subscribe(rs => encontrado = rs.find(r => r.folio === folio)).unsubscribe();
      return encontrado!;
    };
    beforeEach(() => { spyOn(TestBed.inject(NotificacionService), 'crear'); });

    it('asigna la prioridad al crear el reclamo según el puntaje, sin aceptar una prioridad propia', () => {
      let creado!: Reclamo;
      service.crearReclamo({ ...nuevo(), prioridad: PrioridadReclamo.BAJA } as any).subscribe(r => creado = r);
      expect(creado.prioridad).toBe(PrioridadReclamo.URGENTE);
      expect(creado.puntaje?.total).toBe(80);
      expect(creado.puntaje?.envejecimiento).toBe(0);
    });

    it('un reclamo de baja gravedad en una zona poco poblada queda con prioridad baja', () => {
      let creado!: Reclamo;
      service.crearReclamo(nuevo({
        categoria: 'Aseo y Ornato', subcategoria: 'Corte de césped', direccion: 'Calle Tranquila 5', sectorZona: 'Staten Island'
      })).subscribe(r => creado = r);
      expect(creado.prioridad).toBe(PrioridadReclamo.BAJA);
    });

    it('no permite cambiar la prioridad ni el puntaje a mano', () => {
      expect(service.actualizarReclamo('REC-2026-001', { prioridad: PrioridadReclamo.URGENTE })).toBeFalse();
      expect(service.actualizarReclamo('REC-2026-001', { puntaje: undefined })).toBeFalse();
    });

    it('recalcula la prioridad cuando cambia un dato que forma parte del puntaje', () => {
      const antes = buscar('REC-2026-001').puntaje!.total;
      expect(service.actualizarReclamo('REC-2026-001', { subcategoria: 'Inseguridad' })).toBeTrue();
      expect(buscar('REC-2026-001').puntaje!.total).toBeGreaterThan(antes);
    });

    it('al cerrar un reclamo se congela su prioridad', () => {
      service.asignarAgente('REC-2026-002', USUARIO_ADMIN_PRUEBA);
      service.registrarAvance('REC-2026-002', 'En camino');
      expect(service.resolverReclamo('REC-2026-002')).toBeTrue();
      const cerrado = buscar('REC-2026-002');
      expect(cerrado.estado).toBe(EstadoReclamo.CERRADO);
      expect(cerrado.puntaje).toBeDefined();
      expect(cerrado.prioridad).toBe(evaluarPrioridad(cerrado).prioridad);
    });
  });

  it('libera los reclamos del agente eliminado y conserva su estado', () => {
    let antes: Reclamo[] = [];
    service.reclamos$.subscribe(rs => antes = rs).unsubscribe();
    const estadoOriginal = antes.find(r => r.agenteId === USUARIO_AGENTE_PRUEBA.id)!.estado;

    const liberados = service.liberarReclamosDeAgente(USUARIO_AGENTE_PRUEBA.id);
    expect(liberados).toBe(1);

    let despues: Reclamo[] = [];
    service.reclamos$.subscribe(rs => despues = rs).unsubscribe();
    const liberado = despues.find(r => r.id === 101)!;
    expect(liberado.agenteId).toBeNull();
    expect(liberado.agenteAsignado).toBe('Sin asignar');
    expect(liberado.estado).toBe(estadoOriginal);
  });
});
