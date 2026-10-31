import { RUTAS } from '../../../core/config/navegacion.config';
import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-recuperar-contrasena',
  templateUrl: './recuperar-contrasena.component.html',
  styleUrls: ['./recuperar-contrasena.component.css']
})
export class RecuperarContrasenaComponent {
  readonly rutas = RUTAS;
  // Control de pasos: 1 = Email, 2 = Código, 3 = Nueva Contraseña
  paso: number = 1;

  email: string = '';
  codigo: string = '';
  nuevaPassword: string = '';
  confirmarPassword: string = '';

  cargando: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onEnviarCorreo(form: NgForm): void {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.solicitarRecuperacion(this.email).subscribe({
      next: () => {
        this.cargando = false;
        this.successMessage = 'Código enviado. (Revisa la consola F12 para ver el código simulado).';
        setTimeout(() => {
          this.successMessage = '';
          this.paso = 2;
          
        }, 1500);
      },
      error: (err) => {
        this.cargando = false;
        this.errorMessage = err.message || 'Ocurrió un error al procesar tu solicitud.';
      }
    });
  }

  onVerificarCodigo(form: NgForm): void {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.errorMessage = '';

    this.authService.verificarCodigoRecuperacion(this.email, this.codigo).subscribe({
      next: () => {
        this.cargando = false;
        this.paso = 3; // Avanzar al paso 3 para cambiar contraseña
        form.resetForm();
      },
      error: (err) => {
        this.cargando = false;
        this.errorMessage = err.message || 'El código es incorrecto o ha expirado.';
      }
    });
  }

  onCambiarPassword(form: NgForm): void {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }

    if (this.nuevaPassword !== this.confirmarPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.cargando = true;
    this.errorMessage = '';

    this.authService.actualizarPassword(this.email, this.nuevaPassword).subscribe({
      next: () => {
        this.cargando = false;
        this.successMessage = 'Contraseña actualizada con éxito. Redirigiendo al login...';
        setTimeout(() => {
          this.router.navigate([RUTAS.login]);
        }, 2000);
      },
      error: (err) => {
        this.cargando = false;
        this.errorMessage = err.message || 'No se pudo actualizar la contraseña.';
      }
    });
  }
}