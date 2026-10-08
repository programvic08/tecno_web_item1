import { Component, ElementRef, ViewChild } from '@angular/core';

interface ReporteDestacado {
  id: number;
  titulo: string;
  descripcion: string;
  textoBoton: string;
}

@Component({
  selector: 'app-userhome',
  templateUrl: './userhome.component.html',
  styleUrls: ['./userhome.component.css']
})
export class UserhomeComponent {
  @ViewChild('pistaCarrusel') pistaCarrusel!: ElementRef<HTMLElement>;

  reportesDestacados: ReporteDestacado[] = [
    {
      id: 1,
      titulo: 'Alumbrado público',
      descripcion: 'Luminarias apagadas o dañadas en calles, plazas y pasajes de su sector.',
      textoBoton: 'Ver reporte'
    },
    {
      id: 2,
      titulo: 'Baches en calzada',
      descripcion: 'Hoyos y deterioro del pavimento que afectan el tránsito de vehículos y peatones.',
      textoBoton: 'Ver reporte'
    },
    {
      id: 3,
      titulo: 'Aseo y recolección',
      descripcion: 'Acumulación de basura, microbasurales y retrasos en el retiro de residuos.',
      textoBoton: 'Ver reporte'
    },
    {
      id: 4,
      titulo: 'Áreas verdes',
      descripcion: 'Mantención de plazas, parques y arbolado urbano en mal estado.',
      textoBoton: 'Ver reporte'
    }
  ];

  desplazarCarrusel(direccion: 1 | -1): void {
    const pista = this.pistaCarrusel.nativeElement;
    pista.scrollBy({ left: direccion * pista.clientWidth * 0.8, behavior: 'smooth' });
  }
}