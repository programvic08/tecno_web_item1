import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReclamoService } from '../../core/services/reclamo.service';
import { CategoriaReclamo } from '../../models/reclamo.model';
import { PrioridadReclamo } from '../../models/reclamo.enums';

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

  datosCiudadanoTexto: string = 'adeyemi yamal — yamal@adeyemi.com';
  enviado: boolean = false;

  constructor(
    private reclamoService: ReclamoService,
    private router: Router
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
    if (this.paso > 1) {
      this.paso--;
    }
  }

  get formularioValido(): boolean {
    return !!(this.categoria && this.descripcion && this.direccion);
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