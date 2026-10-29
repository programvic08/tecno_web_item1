import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReclamoService } from '../../core/services/reclamo.service';
import { AuthService } from '../../core/services/auth.service';
import { Reclamo } from '../../models/reclamo.model';
import { EstadoReclamo, PrioridadReclamo, RolUsuario } from '../../models/reclamo.enums';
import { AgenteAsignable } from '../../models/usuario.model';

@Component({
  selector: 'app-bandeja-reclamos',
  templateUrl: './bandeja-reclamos.component.html',
  styleUrls: ['./bandeja-reclamos.component.css']
})
export class BandejaReclamosComponent implements OnInit, OnDestroy {
  reclamos: Reclamo[] = [];
  
  filtroEstado: string = 'Todos';
  filtroCategoria: string = 'Todas';
  filtroPrioridad: string = 'Todas';
  filtroUbicacion: string = '';

  // Las listas se derivan de los enums y del servicio: si se agrega un estado o categoría, aparece sola.
  estados: string[] = ['Todos', ...Object.values(EstadoReclamo)];
  categorias: string[] = ['Todas'];
  prioridades: string[] = ['Todas', ...Object.values(PrioridadReclamo)];

  // Solo el administrador asigna; el agente ve únicamente los reclamos que tiene asignados
  esAdmin = false;
  agentes: AgenteAsignable[] = [];
  busquedasAgente: Record<string, string> = {};
  readonly EstadoReclamo = EstadoReclamo;

  agentesFiltrados(folio: string): AgenteAsignable[] {
    const texto = (this.busquedasAgente[folio] ?? '').trim().toLocaleLowerCase();
    return this.agentes.filter(agente => agente.nombre.toLocaleLowerCase().includes(texto));
  }

  private suscripciones = new Subscription();

  constructor(
    private reclamoService: ReclamoService,
    private authService: AuthService
  ) {
    this.categorias = ['Todas', ...this.reclamoService.getCategorias().map(c => c.nombre)];
    this.esAdmin = this.authService.obtenerRolActual() === RolUsuario.ADMINISTRADOR;
    this.agentes = this.authService.obtenerAgentes();
  }

  ngOnInit(): void {
    // reclamosVisibles$ ya viene filtrado según el rol (admin: todos; agente: los suyos)
    this.suscripciones.add(
      this.reclamoService.reclamosVisibles$.subscribe(data => {
        this.reclamos = data;
      })
    );
  }

  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
  }

  get reclamosFiltrados(): Reclamo[] {
    return this.reclamos.filter(r => {
      const cumpleEstado = this.filtroEstado === 'Todos' || r.estado === this.filtroEstado;
      const cumpleCat = this.filtroCategoria === 'Todas' || r.categoria === this.filtroCategoria;
      const cumplePrio = this.filtroPrioridad === 'Todas' || r.prioridad === this.filtroPrioridad;
      const cumpleUbi = !this.filtroUbicacion || r.ubicacion.toLowerCase().includes(this.filtroUbicacion.toLowerCase());

      return cumpleEstado && cumpleCat && cumplePrio && cumpleUbi;
    });
  }

  // El nombre se toma del perfil vigente del agente (si cambió su nombre, aquí se refleja)
  nombreAgente(reclamo: Reclamo): string {
    return this.agentes.find(a => a.id === reclamo.agenteId)?.nombre ?? reclamo.agenteAsignado;
  }

  // Selector del administrador. valor === '' significa "Sin asignar".
  asignar(folio: string, valor: string): void {
    const agente = this.agentes.find(a => String(a.id) === String(valor)) ?? null;
    this.reclamoService.asignarAgente(folio, agente);
  }

  asignarme(folio: string): void {
    const usuario = this.authService.obtenerUsuarioActual();
    if (usuario) {
      this.reclamoService.asignarAgente(folio, { id: usuario.id, nombre: usuario.nombre });
    }
  }
}