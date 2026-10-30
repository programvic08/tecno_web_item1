import { Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { AgenteAsignable, AgenteConCarga } from '../../../models/usuario.model';

let contador = 0;

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

// Selector de agente tipo combobox: al hacer click (o enfocar) se despliega la lista y,
// en el mismo cuadro, lo que se escribe filtra los agentes por nombre.
// Teclado: flechas para moverse, Enter para elegir, Escape para cerrar.
@Component({
  selector: 'app-agente-combobox',
  templateUrl: './agente-combobox.component.html',
  styleUrls: ['./agente-combobox.component.css']
})
export class AgenteComboboxComponent implements OnDestroy {
  @Input() agentes: AgenteConCarga[] = [];
  @Input() seleccionadoId: number | null | undefined = null;
  // Texto que leen los lectores de pantalla (por ejemplo, "Agente del reclamo REC-2026-001")
  @Input() etiqueta = 'Agente';
  @Output() seleccionado = new EventEmitter<AgenteAsignable>();

  @ViewChild('entrada') entrada?: ElementRef<HTMLInputElement>;

  readonly id = 'agente-combobox-' + (++contador);
  abierto = false;
  texto = '';
  indiceActivo = 0;

  // La lista es "fixed" para que no la recorte el contenedor con scroll de la tabla;
  // por eso su posición se calcula con la del campo.
  arriba = false;
  izquierda = 0;
  superior = 0;
  inferior = 0;
  ancho = 0;

  private readonly alturaLista = 220;

  private readonly alHacerClickFuera = (evento: Event): void => {
    const destino = evento.target as Node | null;
    if (destino && !this.contiene(destino)) {
      this.cerrar();
    }
  };

  private readonly alMoverPagina = (evento: Event): void => {
    const destino = evento.target as Node | null;
    // El scroll de la propia lista no debe mover ni cerrar nada
    if (destino && this.contiene(destino)) return;
    this.posicionar();
  };

  constructor(private host: ElementRef<HTMLElement>) {}

  get nombreSeleccionado(): string {
    return this.agentes.find(a => a.id === this.seleccionadoId)?.nombre ?? '';
  }

  get filtrados(): AgenteConCarga[] {
    const consulta = normalizar(this.texto);
    return this.agentes.filter(a => normalizar(a.nombre).includes(consulta));
  }

  idOpcion(indice: number): string {
    return `${this.id}-opcion-${indice}`;
  }

  abrir(): void {
    if (this.abierto) return;
    this.abierto = true;
    this.texto = '';
    const posicion = this.filtrados.findIndex(a => a.id === this.seleccionadoId);
    this.indiceActivo = posicion >= 0 ? posicion : 0;
    this.posicionar();
    document.addEventListener('mousedown', this.alHacerClickFuera);
    document.addEventListener('scroll', this.alMoverPagina, true);
    window.addEventListener('resize', this.alMoverPagina);
  }

  cerrar(): void {
    if (!this.abierto) return;
    this.abierto = false;
    this.texto = '';
    this.quitarEscuchas();
  }

  escribir(evento: Event): void {
    this.texto = (evento.target as HTMLInputElement).value;
    this.indiceActivo = 0;
  }

  elegir(agente: AgenteConCarga): void {
    this.cerrar();
    this.seleccionado.emit({ id: agente.id, nombre: agente.nombre });
  }

  // "3 activos" / "1 activo": cantidad de reclamos que el agente tiene en curso
  textoCarga(agente: AgenteConCarga): string {
    const n = agente.reportesActivos ?? 0;
    return n === 1 ? '1 activo' : `${n} activos`;
  }

  // Lo que leen los lectores de pantalla: el nombre y, si se conoce, su carga
  etiquetaOpcion(agente: AgenteConCarga): string {
    if (agente.reportesActivos === undefined) return agente.nombre;
    const n = agente.reportesActivos;
    return `${agente.nombre}, ${n} ${n === 1 ? 'reporte activo' : 'reportes activos'}`;
  }

  teclear(evento: KeyboardEvent): void {
    const cantidad = this.filtrados.length;
    switch (evento.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        evento.preventDefault();
        if (!this.abierto) {
          this.abrir();
          return;
        }
        if (cantidad === 0) return;
        this.indiceActivo = evento.key === 'ArrowDown'
          ? Math.min(cantidad - 1, this.indiceActivo + 1)
          : Math.max(0, this.indiceActivo - 1);
        this.mostrarActiva();
        break;
      case 'Enter':
        if (this.abierto) {
          evento.preventDefault();
          const agente = this.filtrados[this.indiceActivo];
          if (agente) this.elegir(agente);
        }
        break;
      case 'Escape':
        if (this.abierto) {
          evento.preventDefault();
          this.cerrar();
        }
        break;
      case 'Tab':
        this.cerrar();
        break;
    }
  }

  ngOnDestroy(): void {
    this.quitarEscuchas();
  }

  private contiene(nodo: Node): boolean {
    return this.host.nativeElement.contains(nodo);
  }

  private quitarEscuchas(): void {
    document.removeEventListener('mousedown', this.alHacerClickFuera);
    document.removeEventListener('scroll', this.alMoverPagina, true);
    window.removeEventListener('resize', this.alMoverPagina);
  }

  // Mantiene visible la opción activa cuando se navega con el teclado
  private mostrarActiva(): void {
    document.getElementById(this.idOpcion(this.indiceActivo))?.scrollIntoView({ block: 'nearest' });
  }

  private posicionar(): void {
    const campo = this.entrada?.nativeElement ?? this.host.nativeElement;
    const caja = campo.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - caja.bottom;
    this.arriba = espacioAbajo < this.alturaLista && caja.top > espacioAbajo;
    this.izquierda = caja.left;
    this.superior = caja.bottom + 2;
    this.inferior = window.innerHeight - caja.top + 2;
    this.ancho = caja.width;
  }
}
