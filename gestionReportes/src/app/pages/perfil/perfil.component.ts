import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ActualizarPerfilDto, Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent {
  // Se muestra con el async pipe en la plantilla (sin suscripción manual)
  usuario$: Observable<Usuario | null>;

  editando: boolean = false;
  guardadoExito: boolean = false;
  perfilEditable: ActualizarPerfilDto = { nombre: '', telefono: '', direccion: '' };

  constructor(private authService: AuthService) {
    this.usuario$ = this.authService.usuario$;
  }

  iniciarEdicion(usuario: Usuario): void {
    // Se edita una copia: si cancela, el perfil original no cambia
    this.perfilEditable = {
      nombre: usuario.nombre,
      telefono: usuario.telefono,
      direccion: usuario.direccion
    };
    this.guardadoExito = false;
    this.editando = true;
  }

  cancelarEdicion(): void {
    this.editando = false;
  }

  guardarCambios(formulario: NgForm): void {
    if (formulario.invalid) {
      formulario.control.markAllAsTouched();
      return;
    }

    this.authService.actualizarPerfil({
      nombre: this.perfilEditable.nombre.trim(),
      telefono: this.perfilEditable.telefono.trim(),
      direccion: this.perfilEditable.direccion.trim()
    });

    this.editando = false;
    this.guardadoExito = true;
  }

  obtenerIniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter(parte => parte.length > 0)
      .slice(0, 2)
      .map(parte => parte.charAt(0).toUpperCase())
      .join('');
  }
}
