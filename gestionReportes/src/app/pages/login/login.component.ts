import { RUTAS } from '../../core/config/navegacion.config';
import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, MOTIVO_CUENTA_CREADA, MOTIVO_SESION_EXPIRADA } from '../../core/services/auth.service';
import { CuentaPrueba } from '../../models/usuario.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  readonly rutas = RUTAS;
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  mensajeExito: string = '';
  cargando: boolean = false;
  cuentasPrueba: CuentaPrueba[];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.cuentasPrueba = this.authService.obtenerCuentasPrueba();

    // Avisos según de dónde llegó el usuario (snapshot: no hay suscripción)
    const motivo = this.route.snapshot.queryParamMap.get('motivo');
    if (motivo === MOTIVO_SESION_EXPIRADA) {
      this.errorMessage = 'Tu sesión expiró. Vuelve a iniciar sesión.';
    } else if (motivo === MOTIVO_CUENTA_CREADA) {
      this.mensajeExito = 'Cuenta creada con éxito. Ya puedes iniciar sesión.';
    }
  }

  // Método ejecutado al presionar "Ingresar" en el formulario
  onSubmit(formulario: NgForm): void {
    if (formulario.invalid) {
      // Muestra los mensajes de error de todos los campos
      formulario.control.markAllAsTouched();
      return;
    }
    this.autenticar();
  }

  // Botones de cuentas de prueba: rellenan las credenciales y pasan por
  // exactamente el mismo flujo de validación que el formulario.
  usarCuentaPrueba(cuenta: CuentaPrueba): void {
    this.email = cuenta.email;
    this.password = cuenta.password;
    this.autenticar();
  }

  private autenticar(): void {
    if (this.cargando) {
      return;
    }

    this.errorMessage = '';
    this.mensajeExito = '';
    this.cargando = true;

    // El Observable emite una sola vez y termina (o falla), así que no
    // queda ninguna suscripción abierta.
    this.authService.iniciarSesion({ email: this.email, password: this.password }).subscribe({
      next: usuario => {
        this.cargando = false;
        this.router.navigate(
          [this.authService.obtenerRutaInicio(usuario.rol)],
          { replaceUrl: true }
        );
      },
      error: (error: unknown) => {
        this.cargando = false;
        this.errorMessage = error instanceof Error
          ? error.message
          : 'No se pudo iniciar sesión. Inténtalo nuevamente.';
      }
    });
  }
}
