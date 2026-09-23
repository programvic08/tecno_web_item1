import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RolUsuario } from '../../models/reclamo.enums';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  public RolUsuario = RolUsuario;

  constructor(private authService: AuthService,private router: Router) {}

  // Método ejecutado al presionar "Ingresar" en el formulario
  onSubmit(): void {
    // Credencial Ciudadano
    if (this.email === 'ciudadano@gmail.com' && this.password === '123456') {
      this.authService.login(RolUsuario.CIUDADANO);
      this.router.navigate(['/userHome']);
    } 
    // Credencial Administrador / Agente
    else if (this.email === 'admin@gmail.com' && this.password === '123456') {
      this.authService.login(RolUsuario.ADMINISTRADOR);
      this.router.navigate(['/adminHome']);
    } 
    else {
      this.errorMessage = 'Credenciales inválidas. Usa ciudadano@munisantiago.cl o admin@munisantiago.cl con clave 123456';
    }
  }

  // Método ejecutado por los botones de cuentas de prueba
  ingresarComo(rol: RolUsuario): void {
    this.authService.login(rol);

    // Redirección según el rol
    if (rol === RolUsuario.ADMINISTRADOR) {
      this.router.navigate(['/adminHome']);
    } else {
      this.router.navigate(['/userHome']);
    }
  }
}