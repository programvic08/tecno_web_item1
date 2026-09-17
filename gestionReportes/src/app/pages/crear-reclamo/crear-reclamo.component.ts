import { Component } from '@angular/core';

@Component({
  selector: 'app-crear-reclamo',
  templateUrl: './crear-reclamo.component.html',
  styleUrls: ['./crear-reclamo.component.css']
})
export class CrearReclamoComponent {
  paso = 1; 
  categoria = '';
  subcategoria = '';
  descripcion = '';
  recurrente = '';
  direccion = '';
  fechaHora = '';
  referencia = '';
  sector = '';

  /* readonly significa que no se puede modificar la propiedad categorias   después de la inicialización */
  /* Record significa que define un tipo con claves de tipo string y valores de tipo string[] (categorias y cada categoria tiene su subcategoria)*/
  readonly categorias: Record<string, string[]> = {
    'Infraestructura pública': ['Vereda dañada', 'Calle con baches', 'Señalética dañada', 'Mobiliario urbano dañado'],
    'Aseo y residuos': ['Basura acumulada', 'Contenedor lleno/dañado', 'Microbasural', 'Falta de retiro de residuos'],
    'Alumbrado público': ['Luminaria apagada', 'Luminaria intermitente', 'Poste dañado', 'Alumbrado insuficiente'],
    'Semáforos y tránsito': ['Semáforo apagado', 'Semáforo con funcionamiento incorrecto', 'Señal de tránsito dañada', 'Problema de demarcación vial'],
    'Áreas verdes': ['Árbol caído o peligroso', 'Poda requerida', 'Área verde deteriorada', 'Sistema de riego dañado'],
    'Ruido': ['Ruido de local/comercio', 'Ruido de construcción', 'Ruido en espacio público', 'Otro ruido molesto'],
    'Seguridad / espacio público': ['Elemento peligroso en vía pública', 'Daño a infraestructura pública', 'Obstrucción de vía pública', 'Situación de riesgo en espacio público']
  };

  /* Object.keys() devuelve un array con las claves de un objeto en este caso los nombres de las categorías sin las subcategorias*/
  readonly nombresCategorias = Object.keys(this.categorias);

  cambiarCategoria(): void {
    this.subcategoria = '';
  }

  continuar(formularioValido: boolean): void {
    if (formularioValido) {
      this.paso = this.paso + 1;
    }
  }

  volver(): void {
    this.paso = this.paso - 1;
  }

  /* metodo que cambia el string de fecha 2026-09-16T21:30, remplaza la T por un espacio */
  mostrarFechaHora(): string {
    return this.fechaHora.replace('T', ' ');
  }
}
