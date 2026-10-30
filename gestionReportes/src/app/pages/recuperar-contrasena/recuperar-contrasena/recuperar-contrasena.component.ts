import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service'; // Ajusta tu ruta

@Component({
  selector: 'app-recuperar-contrasena',
  templateUrl: './recuperar-contrasena.component.html',
  styleUrls: ['./recuperar-contrasena.component.css']
})
export class RecuperarContrasenaComponent {
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

  // Paso 1: Enviar solicitud de correo
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
        // Avanzar al paso 2 después de un breve momento
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

  // Paso 2: Verificar el código ingresado
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

  // Paso 3: Guardar la nueva contraseña
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
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.cargando = false;
        this.errorMessage = err.message || 'No se pudo actualizar la contraseña.';
      }
    });
  }
}