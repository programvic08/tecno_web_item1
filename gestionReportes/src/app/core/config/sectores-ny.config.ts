export const SECTORES_NY: readonly string[] = ['Manhattan', 'Brooklyn', 'Queens', 'The Bronx', 'Staten Island'];

// Solo nombres explicitos; no inferir el sector desde barrios, texto libre o coordenadas.
export function identificarSectorNY(...valores: (string | undefined)[]): string | undefined {
  const coincidencias = new Set<string>();
  for (const valor of valores) {
    const normalizado = valor?.trim().toLowerCase();
    const sector = normalizado === 'bronx' ? 'The Bronx' :
      SECTORES_NY.find(nombre => nombre.toLowerCase() === normalizado);
    if (sector) coincidencias.add(sector);
  }
  return coincidencias.size === 1 ? [...coincidencias][0] : undefined;
}
