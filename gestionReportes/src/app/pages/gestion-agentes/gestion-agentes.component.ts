import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ReclamoService } from '../../core/services/reclamo.service';
import { AgenteGestion, RegistroDto } from '../../models/usuario.model';

@Component({
  selector: 'app-gestion-agentes',
  templateUrl: './gestion-agentes.component.html',
  styleUrls: ['./gestion-agentes.component.css']
})
export class GestionAgentesComponent implements OnInit {
  agentes: AgenteGestion[] = [];

  mostrarFormulario = false;
  cargando = false;
  errorMessage = '';
  mensajeExito = '';
  agenteAEliminar: AgenteGestion | null = null;

  // Datos del formulario de alta
  nombre = '';
  email = '';
  password = '';
  confirmarPassword = '';

  usuarioActualId: number | null = null;

  constructor(
    private authService: AuthService,
    private reclamoService: ReclamoService
  ) {}

  ngOnInit(): void {
    this.usuarioActualId = this.authService.obtenerUsuarioActual()?.id ?? null;
    this.cargarAgentes();
  }

  // Se usa en la plantilla para avisar si las dos contraseñas no son iguales
  get passwordsCoinciden(): boolean {
    return this.password === this.confirmarPassword;
  }

  cargarAgentes(): void {
    this.agentes = this.authService.obtenerAgentesGestion();
  }

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    this.errorMessage = '';

    if (!this.mostrarFormulario) {
      this.limpiarFormulario();
    }
  }

  crearAgente(formulario: NgForm): void {
    if (formulario.invalid || !this.passwordsCoinciden) {
      formulario.control.markAllAsTouched();
      return;
    }

    if (this.cargando) {
      return;
    }

    this.errorMessage = '';
    this.mensajeExito = '';
    this.cargando = true;

    const datos: RegistroDto = {
      nombre: this.nombre,
      email: this.email,
      password: this.password
    };

    this.authService.registrarAgente(datos).subscribe({
      next: () => {
        this.cargando = false;
        this.mensajeExito = `Cuenta creada para ${this.nombre.trim()}. El agente ya puede iniciar sesión con su contraseña temporal.`;
        this.mostrarFormulario = false;
        this.limpiarFormulario();
        this.cargarAgentes();
      },
      error: (error: unknown) => {
        this.cargando = false;
        this.errorMessage = error instanceof Error
          ? error.message
          : 'No se pudo crear la cuenta del agente. Inténtalo nuevamente.';
      }
    });
  }

  pedirConfirmacion(agente: AgenteGestion): void {
    this.mensajeExito = '';
    this.errorMessage = '';
    this.agenteAEliminar = agente;
  }

  cancelarEliminacion(): void {
    this.agenteAEliminar = null;
  }

  confirmarEliminacion(): void {
    const agente = this.agenteAEliminar;
    if (!agente) {
      return;
    }

    try {
      // Primero se elimina la cuenta y después se liberan sus reclamos.
      this.authService.eliminarAgente(agente.id);
      const liberados = this.reclamoService.liberarReclamosDeAgente(agente.id);

      this.mensajeExito = `Se eliminó la cuenta de ${agente.nombre}.`
        + (liberados > 0 ? ` ${liberados} reclamo(s) quedaron sin asignar.` : '');
      this.errorMessage = '';
      this.agenteAEliminar = null;
      this.cargarAgentes();
    } catch (error) {
      this.agenteAEliminar = null;
      this.errorMessage = error instanceof Error
        ? error.message
        : 'No se pudo eliminar la cuenta. Inténtalo nuevamente.';
    }
  }

  // Solo las cuentas de administrador y la propia quedan fuera de la eliminación.
  puedeEliminar(agente: AgenteGestion): boolean {
    return !agente.esAdministrador && agente.id !== this.usuarioActualId;
  }

  esUsuarioActual(agente: AgenteGestion): boolean {
    return agente.id === this.usuarioActualId;
  }

  private limpiarFormulario(): void {
    this.nombre = '';
    this.email = '';
    this.password = '';
    this.confirmarPassword = '';
  }
}
