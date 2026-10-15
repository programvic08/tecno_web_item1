import { errorFechaNoFutura, fechaActualLocal } from './fechas';

describe('Fechas compartidas', () => {
  it('obtiene el limite en hora local y acepta la fecha actual', () => {
    expect(errorFechaNoFutura(fechaActualLocal())).toBe('');
    expect(errorFechaNoFutura(fechaActualLocal('date'), 'date')).toBe('');
    expect(fechaActualLocal('date').length).toBe(10);
  });
  it('mantiene los campos vacios opcionales', () => {
    expect(errorFechaNoFutura('')).toBe('');
  });
  it('rechaza fechas futuras con y sin hora', () => {
    expect(errorFechaNoFutura('2999-01-01', 'date')).not.toBe('');
    expect(errorFechaNoFutura('2999-01-01T10:00')).not.toBe('');
  });
  it('rechaza formatos y fechas calendario invalidos', () => {
    expect(errorFechaNoFutura('invalida')).not.toBe('');
    expect(errorFechaNoFutura('2026-02-30', 'date')).not.toBe('');
  });
  it('acepta fechas pasadas', () => {
    expect(errorFechaNoFutura('2020-01-01', 'date')).toBe('');
    expect(errorFechaNoFutura('2020-01-01T12:34')).toBe('');
  });
});
