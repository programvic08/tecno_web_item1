import { DiapositivaReporte, ReporteComun } from '../../models/reporte-comun.model';

export interface DestinoDiapositiva {
  ruta: string;
  etiqueta: string;
  // true: el enlace lleva la categoría como query param (para precargar el formulario)
  conCategoria: boolean;
}

// Convierte el ranking por subcategoría en láminas por categoría.
// `reportes` debe venir ordenado de mayor a menor (así lo entrega ReclamoService).
export function crearDiapositivas(
  reportes: ReporteComun[],
  destino: DestinoDiapositiva,
  maximo = 4
): DiapositivaReporte[] {
  const categorias = new Map<string, { total: number; principal: string }>();

  for (const reporte of reportes) {
    const actual = categorias.get(reporte.categoria);
    if (actual) {
      actual.total += reporte.cantidad;
    } else {
      categorias.set(reporte.categoria, { total: reporte.cantidad, principal: reporte.subcategoria });
    }
  }

  return Array.from(categorias.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, maximo)
    .map(([categoria, dato], indice) => ({
      id: indice + 1,
      etiqueta: indice === 0 ? 'Lo más reportado' : 'Reporte frecuente',
      destacada: indice === 0,
      titulo: categoria,
      resumen: `${dato.total} reclamos en los últimos 30 días. Lo que más se reporta: ${dato.principal || 'varios problemas'}.`,
      detalle: `N.º ${indice + 1} entre las categorías más reportadas`,
      enlaceEtiqueta: destino.etiqueta,
      ruta: destino.ruta,
      queryParams: destino.conCategoria ? { categoria } : undefined,
      tema: indice + 1
    }));
}
