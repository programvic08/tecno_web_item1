import { RUTAS } from '../../core/config/navegacion.config';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReclamoService } from '../../core/services/reclamo.service';
import { AuthService } from '../../core/services/auth.service';
import { Reclamo } from '../../models/reclamo.model';
import { EstadoReclamo, PrioridadReclamo, RolUsuario } from '../../models/reclamo.enums';
import { AgenteAsignable, AgenteConCarga } from '../../models/usuario.model';
import { compararPorUrgencia, esReclamoAbierto } from '../../shared/utils/prioridad';

@Component({
  selector: 'app-bandeja-reclamos',
  templateUrl: './bandeja-reclamos.component.html',
  styleUrls: ['./bandeja-reclamos.component.css']
})
export class BandejaReclamosComponent implements OnInit, OnDestroy {
  readonly rutas = RUTAS;
  reclamos: Reclamo[] = [];
  
  filtroEstado: string = 'Todos';
  filtroCategoria: string = 'Todas';
  filtroPrioridad: string = 'Todas';
  filtroUbicacion: string = '';
  // Solo para el administrador: ver todos, los que faltan por asignar o los que tiene asignados él
  filtroAsignacion: string = 'Todos';
  readonly opcionesAsignacion: string[] = ['Todos', 'Sin asignar', 'Asignados a mí'];

  // Las listas se derivan de los enums y del servicio: si se agrega un estado o categoría, aparece sola.
  estados: string[] = ['Todos', ...Object.values(EstadoReclamo)];
  categorias: string[] = ['Todas'];
  prioridades: string[] = ['Todas', ...Object.values(PrioridadReclamo)];

  // Solo el administrador asigna; el agente ve únicamente los reclamos que tiene asignados
  esAdmin = false;
  agentes: AgenteAsignable[] = [];
  // Los mismos agentes con su cantidad de reclamos activos (lo que muestra el selector de asignación)
  agentesConCarga: AgenteConCarga[] = [];
  usuarioId: number | null = null;
  readonly EstadoReclamo = EstadoReclamo;

  private suscripciones = new Subscription();

  constructor(
    private reclamoService: ReclamoService,
    private authService: AuthService
  ) {
    this.categorias = ['Todas', ...this.reclamoService.getCategorias().map(c => c.nombre)];
    this.esAdmin = this.authService.obtenerRolActual() === RolUsuario.ADMINISTRADOR;
    this.agentes = this.authService.obtenerAgentes();
    this.usuarioId = this.authService.obtenerUsuarioActual()?.id ?? null;
    this.actualizarCarga();
  }

  ngOnInit(): void {
    // reclamosVisibles$ ya viene filtrado según el rol (admin: todos; agente: los suyos)
    this.suscripciones.add(
      this.reclamoService.reclamosVisibles$.subscribe(data => {
        this.reclamos = data;
        this.actualizarCarga();
      })
    );
  }

  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
  }

  // Los más urgentes (mayor puntaje) primero; los cerrados al final
  get reclamosFiltrados(): Reclamo[] {
    return this.reclamos.filter(r => {
      const cumpleEstado = this.filtroEstado === 'Todos' || r.estado === this.filtroEstado;
      const cumpleCat = this.filtroCategoria === 'Todas' || r.categoria === this.filtroCategoria;
      const cumplePrio = this.filtroPrioridad === 'Todas' || r.prioridad === this.filtroPrioridad;
      const cumpleUbi = !this.filtroUbicacion || r.ubicacion.toLowerCase().includes(this.filtroUbicacion.toLowerCase());
      const cumpleAsignacion = !this.esAdmin
        || this.filtroAsignacion === 'Todos'
        || (this.filtroAsignacion === 'Sin asignar' && !r.agenteId)
        || (this.filtroAsignacion === 'Asignados a mí' && this.usuarioId !== null && r.agenteId === this.usuarioId);

      return cumpleEstado && cumpleCat && cumplePrio && cumpleUbi && cumpleAsignacion;
    }).sort(compararPorUrgencia);
  }

  // Reclamos activos del agente: los que no están cerrados, resueltos ni rechazados
  reportesActivosDe(agenteId: number): number {
    return this.reclamos.filter(r => r.agenteId === agenteId && esReclamoAbierto(r)).length;
  }

  actualizarCarga(): void {
    this.agentesConCarga = this.agentes.map(a => ({ ...a, reportesActivos: this.reportesActivosDe(a.id) }));
  }

  // El nombre se toma del perfil vigente del agente (si cambió su nombre, aquí se refleja)
  nombreAgente(reclamo: Reclamo): string {
    return this.agentes.find(a => a.id === reclamo.agenteId)?.nombre ?? reclamo.agenteAsignado;
  }

  // Lo llama el selector de agente (combobox) del administrador al elegir una opción
  asignar(folio: string, agente: AgenteAsignable): void {
    this.reclamoService.asignarAgente(folio, agente);
  }

  asignarme(folio: string): void {
    const usuario = this.authService.obtenerUsuarioActual();
    if (usuario) {
      this.reclamoService.asignarAgente(folio, { id: usuario.id, nombre: usuario.nombre });
    }
  }
}