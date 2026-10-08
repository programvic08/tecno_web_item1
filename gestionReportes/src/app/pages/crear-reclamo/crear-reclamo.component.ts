import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReclamoService } from '../../core/services/reclamo.service';
import { CategoriaReclamo } from '../../models/reclamo.model';
import { PrioridadReclamo } from '../../models/reclamo.enums';
import { EvidenciaStorageService } from '../../core/services/evidencia-storage.service';

@Component({
  selector: 'app-crear-reclamo',
  templateUrl: './crear-reclamo.component.html',
  styleUrls: ['./crear-reclamo.component.css']
})
export class CrearReclamoComponent implements OnInit {
  paso: number = 1;
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
  evidenciaNombre: string = '';
  evidenciaId: string = '';
  errorEvidencia: string = '';

  datosCiudadanoTexto: string = 'adeyemi yamal — yamal@adeyemi.com';
  enviado: boolean = false;

  constructor(
    private reclamoService: ReclamoService,
    private router: Router,
    private evidenciaStorage: EvidenciaStorageService
  ) {}

  ngOnInit(): void {
    this.categorias = this.reclamoService.getCategorias();
  }

  cambiarCategoria(): void {
    const catEncontrada = this.categorias.find(c => c.nombre === this.categoria);
    this.subcategoriasDisponibles = catEncontrada ? catEncontrada.subcategorias : [];
    this.subcategoria = '';
  }

  onArchivoSeleccionado(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    this.errorEvidencia = '';

    if (!fileList || fileList.length === 0) return;

    const archivo = fileList[0];
    const validacion = this.evidenciaStorage.validar(archivo);

    if (!validacion.valido) {
      this.errorEvidencia = validacion.motivo;
      this.evidenciaNombre = '';
      this.evidenciaId = '';
      element.value = ''; // permite volver a elegir el mismo archivo
      return;
    }

    // Guarda el PDF/JPG de forma local (localStorage)
    this.evidenciaStorage.guardar(archivo)
      .then(evidencia => {
        this.evidenciaNombre = evidencia.nombre;
        this.evidenciaId = evidencia.id;
      })
      .catch((err: Error) => {
        this.errorEvidencia = err.message;
        this.evidenciaNombre = '';
        this.evidenciaId = '';
        element.value = '';
      });
  }

  continuar(esValido: boolean): void {
    if (esValido) {
      this.paso++;
    }
  }

  volver(): void {
    if (this.paso > 1) {
      this.paso--;
    }
  }

  /** Fecha/hora actual (hora local) en formato 'YYYY-MM-DDTHH:mm', para el atributo [max] de un input datetime-local. */
  get fechaMaxima(): string {
    const ahora = new Date();
    const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  /** Fecha de hoy en formato 'YYYY-MM-DD', para el atributo [max] de un input date. */
  get fechaMaximaDia(): string {
    return this.fechaMaxima.slice(0, 10);
  }

  /** La fecha observada es opcional, pero si se ingresa no puede estar en el futuro. */
  get fechaValida(): boolean {
    if (!this.fechaHoraObservada) return true;
    return this.fechaHoraObservada <= this.fechaMaxima;
  }

  get formularioValido(): boolean {
    return !!(this.categoria && this.descripcion && this.direccion) && this.fechaValida;
  }

  enviarReclamo(): void {
    if (!this.formularioValido) return;

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
      prioridad: PrioridadReclamo.MEDIA // <-- Agregas esta línea aquí
    }).subscribe(() => {
      this.enviado = true;
      setTimeout(() => {
        this.router.navigate(['/historial']);
      }, 2000);
    });
  }
}