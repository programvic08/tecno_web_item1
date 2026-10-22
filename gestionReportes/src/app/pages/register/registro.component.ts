import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, MOTIVO_CUENTA_CREADA } from '../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent {
  nombre: string = '';
  email: string = '';
  password: string = '';
  confirmarPassword: string = '';
  errorMessage: string = '';
  cargando: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Se usa en la plantilla para avisar si las dos contraseñas no son iguales
  get passwordsCoinciden(): boolean {
    return this.password === this.confirmarPassword;
  }

  // Método ejecutado al presionar "Crear cuenta" en el formulario
  onSubmit(formulario: NgForm): void {
    if (formulario.invalid || !this.passwordsCoinciden) {
      // Muestra los mensajes de error de todos los campos
      formulario.control.markAllAsTouched();
      return;
    }

    if (this.cargando) {
      return;
    }

    this.errorMessage = '';
    this.cargando = true;

    // Aquí no se envía ningún rol: el servicio solo crea cuentas de ciudadano.
    // El Observable emite una sola vez y termina (o falla), así que no
    // queda ninguna suscripción abierta.
    this.authService.registrarCiudadano({
      nombre: this.nombre,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.cargando = false;
        // La cuenta no inicia sesión sola: se lleva al login con un aviso
        this.router.navigate(['/login'], { queryParams: { motivo: MOTIVO_CUENTA_CREADA } });
      },
      error: (error: unknown) => {
        this.cargando = false;
        this.errorMessage = error instanceof Error
          ? error.message
          : 'No se pudo crear la cuenta. Inténtalo nuevamente.';
      }
    });
  }
}
