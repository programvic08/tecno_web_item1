import { PreguntaFrecuente } from '../../models/pregunta-frecuente.model';

export const PREGUNTAS_FRECUENTES: PreguntaFrecuente[] = [
  {
    pregunta: '¿Qué tipos de problemas puedo reportar?',
    respuesta:
      'Puedes registrar problemas de cuatro categorías: ' +
      'Aseo y Ornato, que incluye microbasurales, necesidades de corte de césped y escombros; ' +
      'Alumbrado Público, para luminarias apagadas, postes dañados y focos que parpadean; ' +
      'Infraestructura Urbana, para baches, veredas rotas y señalética caída; ' +
      'y Seguridad y Ruidos, para ruidos molestos, vehículos aparentemente abandonados y situaciones de inseguridad. ' +
      'Al crear tu reclamo, selecciona la categoría y el tipo que mejor describan el problema. ' +
      'Indica la ubicación con precisión y explica qué sucede, desde cuándo lo observas y si se repite. ' +
      'También puedes consultar la guía “Conocer los reclamos” disponible en el carrusel de inicio. ' +
      'Si existe peligro inmediato, utiliza los canales de emergencia de tu localidad; este formulario no reemplaza una atención urgente.'
  },
  {
    pregunta: '¿Qué significan los estados de mi reclamo?',
    estados: [
      {
        nombre: 'Recibido',
        descripcion:
          'Tu reclamo fue registrado en el sistema y está pendiente de revisión. ' +
          'En esta etapa se recibió la información que enviaste, pero todavía no significa que hayan comenzado los trabajos para resolver el problema.'
      },
      {
        nombre: 'En revisión',
        descripcion:
          'Tu reclamo se encuentra en una etapa de evaluación. ' +
          'Se revisan los antecedentes, la ubicación y el tipo de problema para determinar cómo debe gestionarse. ' +
          'Este estado todavía no indica que el problema esté resuelto.'
      },
      {
        nombre: 'En proceso',
        descripcion:
          'La gestión de tu reclamo está en curso. ' +
          'El área correspondiente está realizando las acciones necesarias para atender la situación reportada. ' +
          'El tiempo que permanezca en este estado puede variar según la complejidad del problema y los recursos necesarios para resolverlo.'
      },
      {
        nombre: 'Resuelto',
        descripcion:
          'Se registró una solución para el problema reportado. ' +
          'Puedes revisar el detalle del reclamo y las observaciones disponibles para conocer qué atención se realizó. ' +
          'Este estado informa que se registró la resolución, mientras que “Cerrado” indica que la gestión del caso ha finalizado.'
      },
      {
        nombre: 'Rechazado',
        descripcion:
          'Tras la evaluación, se determinó que el reclamo no continuará su gestión. ' +
          'Revisa las observaciones disponibles en el detalle del caso para conocer el motivo registrado. ' +
          'El rechazo no significa que el problema haya sido solucionado.'
      },
      {
        nombre: 'Cerrado',
        descripcion:
          'La gestión del reclamo se ha dado por finalizada. ' +
          'Puedes consultar su información en el historial para revisar el estado final y las observaciones disponibles. ' +
          'Para conocer el resultado concreto de la atención, revisa el detalle del caso.'
      }
    ]
  },
  {
    pregunta: '¿Puedo agregar una imagen como evidencia?',
    respuesta:
      'Sí. Al crear un reclamo puedes adjuntar una imagen que ayude a comprender el problema. ' +
      'En el formulario, busca el campo para adjuntar evidencia y selecciona el archivo desde tu dispositivo. ' +
      'Procura que la fotografía sea clara, tenga buena iluminación y muestre tanto el daño como alguna referencia del lugar. ' +
      'Por ejemplo, puedes mostrar la luminaria afectada, la acumulación de basura o el tramo de vereda deteriorado. ' +
      'La imagen complementa tu descripción, por lo que también debes explicar qué ocurre e indicar la ubicación. ' +
      'Respeta los formatos y el tamaño máximo que indique el formulario, evita mostrar datos personales innecesarios y toma las fotografías desde un lugar seguro.'
  },
  {
    pregunta: '¿Cómo puedo conocer el estado de mi reclamo?',
    respuesta:
      'Ingresa con la cuenta de ciudadano que utilizaste para registrar el reclamo. ' +
      'Desde la página de inicio, selecciona “Consultar estado”, o accede a tu historial para buscar una solicitud anterior. ' +
      'Identifica el reclamo por su folio, fecha o descripción y revisa la información disponible. ' +
      'Allí podrás conocer su estado actual y consultar las observaciones que se hayan registrado. ' +
      'Conserva el folio de tu solicitud para identificarla con mayor facilidad y revisa su seguimiento cuando necesites conocer avances.'
  },
  {
    pregunta: '¿Cuánto tarda en ser respondido un reclamo?',
    respuesta:
      'No existe un único tiempo de atención para todos los reclamos. ' +
      'El plazo puede variar según el tipo de problema, su prioridad, la complejidad de la solución y los recursos necesarios para atenderlo. ' +
      'Recibir una respuesta o ver un cambio de estado no significa necesariamente que el problema ya esté solucionado: primero puede requerir evaluación y luego acciones para resolverlo. ' +
      'Puedes revisar el estado y las observaciones disponibles en “Consultar estado” o en tu historial. ' +
      'Si se informa un plazo específico para tu caso, úsalo como referencia para su seguimiento.'
  }
];