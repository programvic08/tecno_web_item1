export interface PreguntaFrecuente {
  pregunta: string;
  respuesta?: string;
  estados?: { nombre: string; descripcion: string }[];
}
