// Apartado del navbar del portal. Sin `ruta`, el sistema aún no está construido
// y se muestra en gris con el título "Próximamente".
export interface ApartadoPortal {
  etiqueta: string;
  ruta?: string;
  // Rutas que dejan este apartado marcado como activo
  prefijos?: string[];
}

// Pestaña de la subnavegación (patrón de la guía, sección 4)
export interface PestanaSubnav {
  etiqueta: string;
  ruta: string;
}

// Acceso del componente "¿Cómo hago para…?"
export interface TareaRapida {
  etiqueta: string;
  ruta: string;
  queryParams?: Record<string, string>;
}
