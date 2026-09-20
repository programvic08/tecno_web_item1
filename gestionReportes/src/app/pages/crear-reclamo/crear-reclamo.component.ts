import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CategoriaOption {
  nombre: string;
  subcategorias: string[];
}

interface ReclamoGenerado {
  categorias: string[];
  subcategorias: string[];
  descripcion: string;
  esRecurrente: boolean | null;
  direccion: string;
  fechaHoraObservada: string;
  ubicacionReferencia: string;
  sectorZona: string;
  evidenciaNombre: string;
  datosCiudadano: string;
}

@Component({
  selector: 'app-crear-reclamo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-reclamo.component.html'
})
export class CrearReclamoComponent {

  // Catálogo de categorías y subcategorías disponibles.
  // Se eligen como "labels" seleccionables, permitiendo multi-selección.
  // Reemplaza esto por tu catálogo real (o cárgalo desde un servicio) cuando corresponda.
  categorias: CategoriaOption[] = [
    {
      nombre: 'Aseo y residuos',
      subcategorias: ['Basura acumulada', 'Falta de recolección', 'Contenedor dañado', 'Punto limpio en mal estado']
    },
    {
      nombre: 'Vialidad y tránsito',
      subcategorias: ['Bache en la vía', 'Semáforo en mal estado', 'Señalética dañada', 'Congestión vehicular']
    },
    {
      nombre: 'Alumbrado público',
      subcategorias: ['Luminaria apagada', 'Poste dañado', 'Cableado expuesto']
    },
    {
      nombre: 'Áreas verdes',
      subcategorias: ['Árbol caído', 'Plaga o enfermedad', 'Riego deficiente', 'Poda necesaria']
    },
    {
      nombre: 'Ruidos molestos',
      subcategorias: ['Fiestas o eventos', 'Maquinaria', 'Comercio', 'Vehículos']
    },
    {
      nombre: 'Seguridad',
      subcategorias: ['Vandalismo', 'Falta de vigilancia', 'Punto oscuro / inseguro']
    }
  ];

  selectedCategorias: string[] = [];
  selectedSubcategorias: string[] = [];

  descripcion = '';
  esRecurrente: boolean | null = null;
  direccion = '';
  fechaHoraObservada = '';
  ubicacionReferencia = '';
  sectorZona = '';

  evidenciaArchivo: File | null = null;
  evidenciaNombre = '';

  // En la app real esto vendría del servicio de autenticación / sesión del usuario.
  datosCiudadanoTexto = 'Se obtendrán de la sesión del usuario autenticado.';

  // Reclamo ya compilado, listo para mostrarse como tarjeta. Null mientras se edita el formulario.
  reclamoGenerado: ReclamoGenerado | null = null;

  get subcategoriasDisponibles(): string[] {
    const subs = this.categorias
      .filter(c => this.selectedCategorias.includes(c.nombre))
      .flatMap(c => c.subcategorias);
    return Array.from(new Set(subs));
  }

  get categoriasSeleccionadas(): CategoriaOption[] {
    return this.categorias.filter(categoria =>
      this.selectedCategorias.includes(categoria.nombre)
    );
  }

  get formularioValido(): boolean {
    return this.selectedCategorias.length > 0
      && this.descripcion.trim().length > 0
      && this.direccion.trim().length > 0;
  }

  isCategoriaSelected(nombre: string): boolean {
    return this.selectedCategorias.includes(nombre);
  }

  isSubcategoriaSelected(nombre: string): boolean {
    return this.selectedSubcategorias.includes(nombre);
  }

  toggleCategoria(nombre: string): void {
    const idx = this.selectedCategorias.indexOf(nombre);
    if (idx === -1) {
      this.selectedCategorias.push(nombre);
    } else {
      this.selectedCategorias.splice(idx, 1);
      // Si se quita una categoría, sus subcategorías ya no deben quedar seleccionadas.
      this.selectedSubcategorias = this.selectedSubcategorias
        .filter(s => this.subcategoriasDisponibles.includes(s));
    }
  }

  toggleSubcategoria(nombre: string): void {
    const idx = this.selectedSubcategorias.indexOf(nombre);
    if (idx === -1) {
      this.selectedSubcategorias.push(nombre);
    } else {
      this.selectedSubcategorias.splice(idx, 1);
    }
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.evidenciaArchivo = input.files[0];
      this.evidenciaNombre = input.files[0].name;
    } else {
      this.evidenciaArchivo = null;
      this.evidenciaNombre = '';
    }
  }

  enviarReclamo(): void {
    if (!this.formularioValido) {
      return;
    }

    this.reclamoGenerado = {
      categorias: [...this.selectedCategorias],
      subcategorias: [...this.selectedSubcategorias],
      descripcion: this.descripcion,
      esRecurrente: this.esRecurrente,
      direccion: this.direccion,
      fechaHoraObservada: this.fechaHoraObservada,
      ubicacionReferencia: this.ubicacionReferencia.trim() || 'Sin indicar',
      sectorZona: this.sectorZona.trim() || 'Sin indicar',
      evidenciaNombre: this.evidenciaNombre || 'Sin evidencia adjunta.',
      datosCiudadano: this.datosCiudadanoTexto
    };

    // NOTA: por ahora el reclamo solo se arma localmente y se muestra como tarjeta.
    // Aquí es donde más adelante se llamaría al servicio para enviarlo al backend.
  }

  cancelar(): void {
    this.selectedCategorias = [];
    this.selectedSubcategorias = [];
    this.descripcion = '';
    this.esRecurrente = null;
    this.direccion = '';
    this.fechaHoraObservada = '';
    this.ubicacionReferencia = '';
    this.sectorZona = '';
    this.evidenciaArchivo = null;
    this.evidenciaNombre = '';
    this.reclamoGenerado = null;
  }

  volver(): void {
    // Placeholder: aquí se integraría la navegación de regreso al paso "2. Dónde".
    console.log('Volver al paso: Dónde');
  }

  editarReclamo(): void {
    this.reclamoGenerado = null;
  }
}
