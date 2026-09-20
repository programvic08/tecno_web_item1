import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CategoriaOption {
  nombre: string;
  subcategorias: string[];
}

interface ReclamoGenerado {
  categoria: string;
  subcategoria: string;
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

  // 1 = "El qué", 2 = "Dónde", 3 = "Revisión"
  paso = 1;

  // Catálogo de categorías y subcategorías disponibles.
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

  // --- Paso 1: El qué ---
  categoria = '';
  subcategoria = '';
  descripcion = '';
  esRecurrente: boolean | null = null;

  // --- Paso 2: Dónde ---
  direccion = '';
  fechaHoraObservada = '';
  ubicacionReferencia = '';
  sectorZona = '';
  evidenciaArchivo: File | null = null;
  evidenciaNombre = '';

  // --- Dato fijo (no editable) ---
  // En la app real esto vendría del servicio de autenticación / sesión del usuario.
  datosCiudadanoTexto = 'Se obtendrán de la sesión del usuario autenticado.';

  // --- Estado final ---
  reclamoGenerado: ReclamoGenerado | null = null;
  enviado = false;

  get subcategoriasDisponibles(): string[] {
    const cat = this.categorias.find(c => c.nombre === this.categoria);
    return cat ? cat.subcategorias : [];
  }

  // Chequeo final antes de poder enviar (además de la validación de cada paso).
  get formularioValido(): boolean {
    return this.categoria !== ''
      && this.descripcion.trim().length > 0
      && this.direccion.trim().length > 0;
  }

  cambiarCategoria(): void {
    // Al cambiar de categoría, la subcategoría anterior ya no tiene por qué aplicar.
    this.subcategoria = '';
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

  // Avanza de paso solo si el formulario del paso actual es válido.
  continuar(formularioValido: boolean): void {
    if (formularioValido && this.paso < 3) {
      this.paso++;
    }
  }

  volver(): void {
    if (this.paso > 1) {
      this.paso--;
    }
  }

  enviarReclamo(): void {
    if (!this.formularioValido) {
      return;
    }

    this.reclamoGenerado = {
      categoria: this.categoria,
      subcategoria: this.subcategoria,
      descripcion: this.descripcion,
      esRecurrente: this.esRecurrente,
      direccion: this.direccion,
      fechaHoraObservada: this.fechaHoraObservada,
      ubicacionReferencia: this.ubicacionReferencia.trim() || 'Sin indicar',
      sectorZona: this.sectorZona.trim() || 'Sin indicar',
      evidenciaNombre: this.evidenciaNombre || 'Sin evidencia adjunta.',
      datosCiudadano: this.datosCiudadanoTexto
    };

    this.enviado = true;

    // NOTA: por ahora el reclamo solo se arma localmente y se marca como "enviado".
    // Aquí es donde más adelante se llamaría al servicio para mandarlo al backend.
  }
}