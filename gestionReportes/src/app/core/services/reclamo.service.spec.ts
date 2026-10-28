import { of } from 'rxjs';
import { EstadoReclamo, PrioridadReclamo } from '../../models/reclamo.enums';
import { Reclamo } from '../../models/reclamo.model';
import { TestBed } from '@angular/core/testing';

import { ReclamoService } from './reclamo.service';
import { AuthService } from './auth.service';
import { USUARIO_ADMIN_PRUEBA, USUARIO_AGENTE_PRUEBA, USUARIO_CIUDADANO_PRUEBA } from '../../testing/usuarios-prueba';
import { Usuario } from '../../models/usuario.model';

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

  it('registra la fecha al resolver, la conserva al cerrar y la limpia al reabrir', () => {
    const folio = 'REC-2026-001';
    service.actualizarReclamo(folio, { estado: EstadoReclamo.RESUELTO });
    const hoy = new Date().toISOString().slice(0, 10);
    service.reclamos$.subscribe(reclamos => expect(reclamos.find(r => r.folio === folio)?.fechaResolucion).toBe(hoy)).unsubscribe();
    service.actualizarReclamo(folio, { estado: EstadoReclamo.CERRADO });
    service.reclamos$.subscribe(reclamos => expect(reclamos.find(r => r.folio === folio)?.fechaResolucion).toBe(hoy)).unsubscribe();
    service.actualizarReclamo(folio, { estado: EstadoReclamo.EN_PROCESO });
    service.reclamos$.subscribe(reclamos => expect(reclamos.find(r => r.folio === folio)?.fechaResolucion).toBeUndefined()).unsubscribe();
  });

  it('no inventa fecha al cerrar directamente y conserva fechas al editar otros campos', () => {
    service.actualizarReclamo('REC-2026-001', { estado: EstadoReclamo.CERRADO });
    service.obtenerReporte().subscribe(r => expect(r.tiempoPromedioResolucionDias).toBeNull()).unsubscribe();
    service.actualizarReclamo('REC-2026-002', { estado: EstadoReclamo.RESUELTO });
    const hoy = new Date().toISOString().slice(0, 10);
    service.actualizarReclamo('REC-2026-002', { descripcion: 'Editada' });
    service.reclamos$.subscribe(rs => expect(rs[1].fechaResolucion).toBe(hoy)).unsubscribe();
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

  it('conserva la resolucion al guardar otra vez y renueva la fecha tras reasignar', () => {
    const folio = 'REC-2026-001';
    service.actualizarReclamo(folio, { estado: EstadoReclamo.RESUELTO });
    service.actualizarReclamo(folio, { fechaResolucion: '2026-09-15' });
    service.actualizarReclamo(folio, { estado: EstadoReclamo.RESUELTO });
    service.reclamos$.subscribe(rs => expect(rs[0].fechaResolucion).toBe('2026-09-15')).unsubscribe();
    service.asignarAgente(folio, { id: USUARIO_AGENTE_PRUEBA.id, nombre: USUARIO_AGENTE_PRUEBA.nombre });
    service.actualizarReclamo(folio, { estado: EstadoReclamo.RESUELTO });
    service.reclamos$.subscribe(rs => expect(rs[0].fechaResolucion).toBe(new Date().toISOString().slice(0, 10))).unsubscribe();
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
      const guardado = service.actualizarReclamo('REC-2026-001', { estado: EstadoReclamo.RESUELTO }, 'Listo', 'Agente Pérez');
      expect(guardado).toBeTrue();
      expect(buscar('REC-2026-001').estado).toBe(EstadoReclamo.RESUELTO);
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
      expect(guardado).toBeTrue();
      expect(buscar('REC-2026-001').prioridad).toBe(PrioridadReclamo.URGENTE);
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

    it('al quitar la asignación el agente deja de ver el reclamo', () => {
      service.asignarAgente('REC-2026-001', null);
      expect(buscar('REC-2026-001').agenteId).toBeNull();
      expect(buscar('REC-2026-001').agenteAsignado).toBe('Sin asignar');
      usuarioActual.and.returnValue(USUARIO_AGENTE_PRUEBA);
      expect(idsVisibles()).toEqual([]);
    });

    it('el reporte del agente se calcula solo con sus reclamos', () => {
      usuarioActual.and.returnValue(USUARIO_AGENTE_PRUEBA);
      service.obtenerReporte().subscribe(r => expect(r.totalReclamos).toBe(1)).unsubscribe();
      usuarioActual.and.returnValue(USUARIO_ADMIN_PRUEBA);
      service.obtenerReporte().subscribe(r => expect(r.totalReclamos).toBe(2)).unsubscribe();
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
