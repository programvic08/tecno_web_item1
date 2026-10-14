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
  evidenciaNombre: string = '';

  datosCiudadanoTexto: string = 'adeyemi yamal — yamal@adeyemi.com';
  enviado: boolean = false;

  constructor(
    private reclamoService: ReclamoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.categorias = this.reclamoService.getCategorias();
    this.precargarDesdeEnlace();
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
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      this.evidenciaNombre = fileList[0].name;
    }
  }

  continuar(esValido: boolean): void {
    if (esValido) {
      this.paso++;
    }
  }

  volver(): void {
    if (!this.esPlantilla && this.paso > 1) {
      this.paso--;
    }
  }

  get formularioValido(): boolean {
    return !!(this.categoria && this.descripcion &&
      (this.esPlantilla ? this.direccion.trim() : this.direccion));
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
        this.router.navigate([RUTAS.historial]);
      }, 2000);
    });
  }
}
