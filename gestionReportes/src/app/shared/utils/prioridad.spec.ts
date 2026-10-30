import { PrioridadReclamo, EstadoReclamo } from '../../models/reclamo.enums';
import { Reclamo } from '../../models/reclamo.model';
import { RANGOS_PRIORIDAD, TOPE_ENVEJECIMIENTO } from '../../core/config/prioridad.config';
import {
  calcularPuntajeBase, compararPorUrgencia, diasDeEspera, evaluarPrioridad, prioridadPorPuntaje,
  puntajeBaseMaximo, puntosEnvejecimiento, puntosVia
} from './prioridad';

describe('Prioridad automática', () => {
  // Fecha fija para que las pruebas no dependan del día en que se ejecutan
  const HOY = new Date(2026, 9, 30, 12, 0);
  const base = {
    categoria: 'Seguridad y Ruidos', subcategoria: 'Inseguridad', direccion: 'Calle 1',
    esRecurrente: false, sectorZona: 'Manhattan', fecha: '2026-10-30'
  };

  describe('puntaje base', () => {
    it('suma categoría, subcategoría, sector, vía y recurrencia', () => {
      const puntaje = calcularPuntajeBase({ ...base, direccion: 'Fifth Avenue 10', esRecurrente: true });
      expect(puntaje).toEqual({ categoria: 20, subcategoria: 40, sector: 12, via: 8, recurrencia: 4, base: 84 });
    });

    it('un problema grave en zona muy poblada puntúa más que uno leve en zona poco poblada', () => {
      const grave = calcularPuntajeBase({ ...base, subcategoria: 'Bache / Evento', categoria: 'Infraestructura Urbana', direccion: 'Broadway 1' });
      const leve = calcularPuntajeBase({ ...base, subcategoria: 'Corte de césped', categoria: 'Aseo y Ornato', sectorZona: 'Staten Island' });
      expect(grave.base).toBeGreaterThan(leve.base);
    });

    it('la misma falla puntúa más en un sector más poblado', () => {
      const manhattan = calcularPuntajeBase({ ...base, sectorZona: 'Manhattan' }).base;
      const staten = calcularPuntajeBase({ ...base, sectorZona: 'Staten Island' }).base;
      expect(manhattan).toBeGreaterThan(staten);
    });

    it('ignora tildes y mayúsculas al buscar en las tablas', () => {
      expect(calcularPuntajeBase({ ...base, categoria: 'ALUMBRADO PUBLICO', subcategoria: 'poste danado' }))
        .toEqual(jasmine.objectContaining({ categoria: 10, subcategoria: 34 }));
    });

    it('usa puntajes por defecto para categorías, subcategorías o sectores desconocidos', () => {
      const puntaje = calcularPuntajeBase({ ...base, categoria: 'Otra', subcategoria: 'Nueva', sectorZona: undefined });
      expect(puntaje).toEqual(jasmine.objectContaining({ categoria: 5, subcategoria: 10, sector: 6 }));
    });

    it('reconoce avenidas y vías principales en la dirección', () => {
      for (const direccion of ['Av. Manhattan 123', '350 5th Avenue', 'Brooklyn-Queens Expressway', 'Broadway 20', 'Avenida Central']) {
        expect(puntosVia(direccion)).toBe(8);
      }
      for (const direccion of ['Central Park Oeste', '12 Mulberry Street', 'Avenger Lane', '', undefined]) {
        expect(puntosVia(direccion)).toBe(0);
      }
    });
  });

  describe('envejecimiento', () => {
    it('cuenta días completos y trata fechas inválidas o futuras como cero', () => {
      expect(diasDeEspera('2026-10-30', HOY)).toBe(0);
      expect(diasDeEspera('2026-10-20', HOY)).toBe(10);
      expect(diasDeEspera('2026-11-05', HOY)).toBe(0);
      expect(diasDeEspera('no-es-fecha', HOY)).toBe(0);
      expect(diasDeEspera(undefined, HOY)).toBe(0);
    });

    it('crece con los días y no pasa del tope', () => {
      expect(puntosEnvejecimiento(0)).toBe(0);
      expect(puntosEnvejecimiento(1)).toBe(0);
      expect(puntosEnvejecimiento(2)).toBe(1);
      expect(puntosEnvejecimiento(30)).toBe(15);
      expect(puntosEnvejecimiento(100000)).toBe(TOPE_ENVEJECIMIENTO);
    });

    it('el tope supera el puntaje base máximo: un reclamo viejo siempre acaba superando a uno nuevo', () => {
      expect(TOPE_ENVEJECIMIENTO).toBeGreaterThanOrEqual(puntajeBaseMaximo());
    });

    it('un reclamo leve que espera mucho sube de prioridad', () => {
      const leve = { ...base, categoria: 'Aseo y Ornato', subcategoria: 'Corte de césped', sectorZona: 'Staten Island' };
      const nuevo = evaluarPrioridad({ ...leve, fecha: '2026-10-30' }, HOY);
      const viejo = evaluarPrioridad({ ...leve, fecha: '2026-06-01' }, HOY);
      expect(nuevo.prioridad).toBe(PrioridadReclamo.BAJA);
      expect(viejo.puntaje.total).toBeGreaterThan(nuevo.puntaje.total);
      expect(viejo.puntaje.envejecimiento).toBeGreaterThan(0);
      expect(viejo.prioridad).not.toBe(PrioridadReclamo.BAJA);
    });

    it('un reclamo leve muy antiguo termina por delante de uno grave recién ingresado', () => {
      const leveViejo = evaluarPrioridad({ ...base, categoria: 'Aseo y Ornato', subcategoria: 'Corte de césped', sectorZona: 'Staten Island', fecha: '2020-01-01' }, HOY);
      const graveNuevo = evaluarPrioridad({ ...base, direccion: 'Fifth Avenue 10', esRecurrente: true, fecha: '2026-10-30' }, HOY);
      expect(leveViejo.puntaje.total).toBeGreaterThan(graveNuevo.puntaje.total);
    });
  });

  describe('rangos de prioridad', () => {
    it('cada puntaje cae en el rango esperado, incluidos los extremos', () => {
      for (const rango of RANGOS_PRIORIDAD) {
        expect(prioridadPorPuntaje(rango.desde)).toBe(rango.prioridad);
        if (Number.isFinite(rango.hasta)) {
          expect(prioridadPorPuntaje(rango.hasta)).toBe(rango.prioridad);
        }
      }
      expect(prioridadPorPuntaje(0)).toBe(PrioridadReclamo.BAJA);
      expect(prioridadPorPuntaje(29)).toBe(PrioridadReclamo.BAJA);
      expect(prioridadPorPuntaje(30)).toBe(PrioridadReclamo.MEDIA);
      expect(prioridadPorPuntaje(55)).toBe(PrioridadReclamo.ALTA);
      expect(prioridadPorPuntaje(80)).toBe(PrioridadReclamo.URGENTE);
      expect(prioridadPorPuntaje(500)).toBe(PrioridadReclamo.URGENTE);
    });

    it('los rangos son contiguos y cubren todos los puntajes enteros', () => {
      for (let i = 1; i < RANGOS_PRIORIDAD.length; i++) {
        expect(RANGOS_PRIORIDAD[i].desde).toBe(RANGOS_PRIORIDAD[i - 1].hasta + 1);
      }
      expect(RANGOS_PRIORIDAD[0].desde).toBe(0);
    });
  });

  describe('orden de la bandeja', () => {
    const reclamo = (id: number, total: number, fecha: string, estado = EstadoReclamo.RECIBIDO): Reclamo => ({
      id, folio: 'F' + id, categoria: 'A', subcategoria: 'B', descripcion: '', esRecurrente: false,
      direccion: '', ubicacion: '', fecha, prioridad: PrioridadReclamo.MEDIA, estado, agenteAsignado: '',
      puntaje: { categoria: 0, subcategoria: 0, sector: 0, via: 0, recurrencia: 0, base: total, envejecimiento: 0, total }
    });

    it('ordena por puntaje descendente, luego por antigüedad, y deja los cerrados al final', () => {
      const lista = [
        reclamo(1, 30, '2026-10-01'),
        reclamo(2, 90, '2026-10-10', EstadoReclamo.CERRADO),
        reclamo(3, 70, '2026-10-05'),
        reclamo(4, 30, '2026-09-01'),
        reclamo(5, 55, '2026-10-02')
      ];
      expect([...lista].sort(compararPorUrgencia).map(r => r.id)).toEqual([3, 5, 4, 1, 2]);
    });
  });
});
