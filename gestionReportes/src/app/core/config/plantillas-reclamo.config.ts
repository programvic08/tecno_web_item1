import { PlantillaReclamo } from '../../models/plantilla-reclamo.model';

export const PLANTILLAS_RECLAMO: ReadonlyArray<Readonly<PlantillaReclamo>> = [
  { id: 'microbasural', categoria: 'Aseo y Ornato', subcategoria: 'Microbasural',
    descripcion: 'Acumulación de basura en un espacio público que requiere limpieza y retiro.', esRecurrente: true },
  { id: 'luminaria-apagada', categoria: 'Alumbrado Público', subcategoria: 'Luminaria Apagada',
    descripcion: 'Luminaria del alumbrado público apagada que requiere revisión y reparación.', esRecurrente: false },
  { id: 'bache-evento', categoria: 'Infraestructura Urbana', subcategoria: 'Bache / Evento',
    descripcion: 'Bache en la calzada que dificulta el tránsito y requiere reparación.', esRecurrente: false },
  { id: 'ruido-molesto', categoria: 'Seguridad y Ruidos', subcategoria: 'Ruido Molesto',
    descripcion: 'Ruidos molestos que afectan la tranquilidad del sector y requieren fiscalización.', esRecurrente: true },
  { id: 'vereda-rota', categoria: 'Infraestructura Urbana', subcategoria: 'Vereda Rota',
    descripcion: 'Vereda deteriorada que dificulta el paso peatonal y requiere reparación.', esRecurrente: false },
  { id: 'escombros', categoria: 'Aseo y Ornato', subcategoria: 'Escombros',
    descripcion: 'Escombros depositados en un espacio público que requieren retiro.', esRecurrente: false }
];

export function obtenerPlantilla(id: string): Readonly<PlantillaReclamo> | undefined {
  return PLANTILLAS_RECLAMO.find(plantilla => plantilla.id === id);
}

export function buscarPlantilla(categoria: string, subcategoria: string): Readonly<PlantillaReclamo> | undefined {
  return PLANTILLAS_RECLAMO.find(plantilla =>
    plantilla.categoria === categoria && plantilla.subcategoria === subcategoria);
}
