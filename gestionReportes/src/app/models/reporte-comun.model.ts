// Cuántos reclamos se registran por subcategoría (base del ranking de "más comunes")
export interface ReporteComun {
  id: number;
  categoria: string;
  subcategoria: string;
  cantidad: number;
}

// Lámina del carrusel de la portada
export interface DiapositivaReporte {
  id: number;
  etiqueta: string;
  destacada: boolean;
  titulo: string;
  resumen: string;
  detalle: string;
  enlaceEtiqueta: string;
  ruta: string;
  queryParams?: Record<string, string>;
  tema: number;
}
