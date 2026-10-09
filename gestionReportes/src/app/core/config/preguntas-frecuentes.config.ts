import { PreguntaFrecuente } from '../../models/pregunta-frecuente.model';

export const PREGUNTAS_FRECUENTES: PreguntaFrecuente[] = [
  { pregunta: '¿Qué tipos de problemas puedo reportar?', respuesta: 'Puedes registrar problemas asociados a Aseo y Ornato, Alumbrado Público, Infraestructura Urbana y Seguridad y Ruidos.' },
  { pregunta: '¿Qué significan los estados de mi reclamo?', estados: [
    { nombre: 'Recibido', descripcion: 'El reclamo fue registrado correctamente y está pendiente de revisión.' },
    { nombre: 'En revisión', descripcion: 'El reclamo está siendo evaluado para determinar cómo debe gestionarse.' },
    { nombre: 'En proceso', descripcion: 'El reclamo ya está siendo gestionado por el área correspondiente.' },
    { nombre: 'Resuelto', descripcion: 'La gestión asociada al reclamo fue realizada y se registró una solución.' },
    { nombre: 'Rechazado', descripcion: 'El reclamo no continuará su gestión según la evaluación realizada.' },
    { nombre: 'Cerrado', descripcion: 'El proceso del reclamo ha finalizado.' }
  ] },
  { pregunta: '¿Puedo agregar una imagen como evidencia?', respuesta: 'Sí. Al crear un reclamo puedes adjuntar una imagen como evidencia del problema.' },
  { pregunta: '¿Cómo puedo conocer el estado de mi reclamo?', respuesta: 'Puedes utilizar la opción “Consultar estado” o revisar tu historial de reclamos.' },
  { pregunta: '¿Cuánto tarda en ser respondido un reclamo?', respuesta: 'El tiempo de respuesta puede variar según el tipo, prioridad y características del reclamo.' }
];
