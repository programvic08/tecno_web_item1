export type TipoFecha = 'date' | 'datetime-local';

export function fechaActualLocal(tipo: TipoFecha = 'datetime-local'): string {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, tipo === 'date' ? 10 : 16);
}

// Los campos vacios siguen siendo opcionales; required se valida por separado.
export function errorFechaNoFutura(valor: string | null | undefined, tipo: TipoFecha = 'datetime-local'): string {
  if (!valor) return '';
  const patron = tipo === 'date' ? /^\d{4}-\d{2}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/;
  const fecha = new Date(tipo === 'date' ? valor + 'T00:00:00' : valor);
  const [anio, mes, dia] = valor.slice(0, 10).split('-').map(Number);
  if (!patron.test(valor) || !Number.isFinite(fecha.getTime()) ||
      fecha.getFullYear() !== anio || fecha.getMonth() + 1 !== mes || fecha.getDate() !== dia) {
    return 'La fecha ingresada no es valida.';
  }
  return fecha.getTime() > Date.now() ? 'La fecha y hora no puede ser posterior al momento actual.' : '';
}
