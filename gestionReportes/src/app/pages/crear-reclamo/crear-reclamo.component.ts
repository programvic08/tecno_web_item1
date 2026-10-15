import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReclamoService } from '../../core/services/reclamo.service';
import { CategoriaReclamo } from '../../models/reclamo.model';
import { PrioridadReclamo } from '../../models/reclamo.enums';
import { RUTAS } from '../../core/config/navegacion.config';
import { obtenerPlantilla } from '../../core/config/plantillas-reclamo.config';

@Component({
  selector: 'app-crear-reclamo',
  templateUrl: './crear-reclamo.component.html',
  styleUrls: ['./crear-reclamo.component.css']
})
export class CrearReclamoComponent implements OnInit {
  paso: number = 1;
  esPlantilla = false;
  categorias: CategoriaReclamo[] = [];
  subcategoriasDisponibles: string[] = [];

  categoria: string = '';
  subcategoria: string = '';
  descripcion: string = '';
  esRecurrente: boolean | null = null;

  direccion: string = '';
  fechaHoraObservada: string = '';
  ubicacionReferencia: string = '';
  sectorZona: string = '';

  // Fecha observada: solo se permiten fechas pasadas o el momento actual
  fechaMaxima: string = '';
  errorFecha: string = '';

  // Evidencia adjunta (solo PDF o imágenes)
  readonly tiposPermitidos: string[] = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ];
  readonly tamanoMaximoMB = 5;

  evidenciaNombre: string = '';
  evidenciaTipo: string = '';
  evidenciaDataUrl: string = '';
  errorArchivo: string = '';
  leyendoEvidencia = false;
  private lectorEvidencia: FileReader | null = null;

  datosCiudadanoTexto: string = 'adeyemi yamal — yamal@adeyemi.com';
  enviado: boolean = false;

  constructor(
    private reclamoService: ReclamoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.categorias = this.reclamoService.getCategorias();
    this.actualizarFechaMaxima();
    this.fechaHoraObservada = this.fechaMaxima;
    this.precargarDesdeEnlace();
  }

  // Devuelve la fecha y hora actual en hora local con formato 'YYYY-MM-DDTHH:mm'
  private actualizarFechaMaxima(): void {
    const ahora = new Date();
    const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
    this.fechaMaxima = local.toISOString().slice(0, 16);
  }

  validarFecha(): boolean {
    this.errorFecha = '';
    if (!this.fechaHoraObservada) {
      return true; // el campo es opcional
    }

    this.actualizarFechaMaxima();
    const fechaIngresada = new Date(this.fechaHoraObservada);

    if (isNaN(fechaIngresada.getTime())) {
      this.errorFecha = 'La fecha ingresada no es válida.';
      return false;
    }

    if (fechaIngresada.getTime() > new Date().getTime()) {
      this.errorFecha = 'La fecha y hora observada no puede ser posterior al momento actual.';
      return false;
    }

    return true;
  }

  // Las plantillas abren Revisión; los enlaces anteriores conservan la precarga normal.
  private precargarDesdeEnlace(): void {
    const parametros = this.route.snapshot.queryParamMap;
    const plantillaId = parametros.get('plantilla');
    const plantilla = plantillaId ? obtenerPlantilla(plantillaId) : undefined;
    if (plantilla) {
      this.categoria = plantilla.categoria;
      this.cambiarCategoria();
      this.subcategoria = plantilla.subcategoria;
      this.descripcion = plantilla.descripcion;
      this.esRecurrente = plantilla.esRecurrente;
      this.esPlantilla = true;
      this.paso = 3;
      return;
    }
    const categoria = parametros.get('categoria');
    if (!categoria || !this.categorias.some(c => c.nombre === categoria)) {
      return;
    }
    this.categoria = categoria;
    this.cambiarCategoria();

    const subcategoria = parametros.get('subcategoria');
    if (subcategoria && this.subcategoriasDisponibles.includes(subcategoria)) {
      this.subcategoria = subcategoria;
    }
  }

  cambiarCategoria(): void {
    const catEncontrada = this.categorias.find(c => c.nombre === this.categoria);
    this.subcategoriasDisponibles = catEncontrada ? catEncontrada.subcategorias : [];
    this.subcategoria = '';
  }

  onArchivoSeleccionado(event: Event): void {
    const input = (event.target ?? event.currentTarget) as HTMLInputElement;
    const archivo = input.files?.[0];
    this.errorArchivo = '';
    this.limpiarEvidencia();

    if (!archivo) {
      this.limpiarEvidencia();
      return;
    }

    if (!this.tiposPermitidos.includes(archivo.type)) {
      this.errorArchivo = 'Formato no permitido. Solo se aceptan PDF o imágenes (JPG, PNG, WEBP).';
      this.limpiarEvidencia();
      input.value = '';
      return;
    }

    if (archivo.size > this.tamanoMaximoMB * 1024 * 1024) {
      this.errorArchivo = `El archivo supera el máximo de ${this.tamanoMaximoMB} MB.`;
      this.limpiarEvidencia();
      input.value = '';
      return;
    }

    const lector = new FileReader();
    this.lectorEvidencia = lector;
    this.leyendoEvidencia = true;
    lector.onload = () => {
      if (this.lectorEvidencia !== lector) return;
      this.leyendoEvidencia = false;
      this.lectorEvidencia = null;
      this.evidenciaNombre = archivo.name;
      this.evidenciaTipo = archivo.type;
      this.evidenciaDataUrl = lector.result as string;
    };
    lector.onerror = () => {
      if (this.lectorEvidencia !== lector) return;
      this.errorArchivo = 'No se pudo leer el archivo. Intenta nuevamente.';
      this.limpiarEvidencia();
      input.value = '';
    };
    lector.readAsDataURL(archivo);
  }

  quitarEvidencia(input: HTMLInputElement): void {
    input.value = '';
    this.errorArchivo = '';
    this.limpiarEvidencia();
  }

  private limpiarEvidencia(): void {
    if (this.lectorEvidencia) {
      this.lectorEvidencia.abort();
      this.lectorEvidencia = null;
    }
    this.leyendoEvidencia = false;
    this.evidenciaNombre = '';
    this.evidenciaTipo = '';
    this.evidenciaDataUrl = '';
  }

  continuar(esValido: boolean): void {
    if (!esValido) return;
    if (this.paso === 2 && !this.validarFecha()) return;
    this.paso++;
  }

  volver(): void {
    if (!this.esPlantilla && this.paso > 1) {
      this.paso--;
    }
  }

  get formularioValido(): boolean {
    return !!(this.categoria && this.subcategoria && this.descripcion &&
      (this.esPlantilla ? this.direccion.trim() : this.direccion));
  }

  enviarReclamo(): void {
    if (!this.formularioValido || !this.validarFecha() || this.leyendoEvidencia || this.enviado) return;

    this.reclamoService.crearReclamo({
      categoria: this.categoria,
      subcategoria: this.subcategoria,
      descripcion: this.descripcion,
      esRecurrente: this.esRecurrente ?? false,
      direccion: this.direccion,
      fechaHoraObservada: this.fechaHoraObservada,
      ubicacion: this.direccion + (this.ubicacionReferencia ? ` (${this.ubicacionReferencia})` : ''),
      sectorZona: this.sectorZona,
      evidenciaNombre: this.evidenciaNombre,
      evidenciaTipo: this.evidenciaTipo,
      evidenciaDataUrl: this.evidenciaDataUrl,
      prioridad: PrioridadReclamo.MEDIA
    }).subscribe(() => {
      this.enviado = true;
      setTimeout(() => {
        this.router.navigate([RUTAS.historial]);
      }, 2000);
    });
  }
}
