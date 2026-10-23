import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-recuperar-contrasena',
  templateUrl: './recuperar-contrasena.component.html',
  styleUrls: ['./recuperar-contrasena.component.css']
})
export class RecuperarContrasenaComponent {
  email: string = '';
  cargando: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      form.form.markAllAsTouched(); // <-- Cambiado de form.markAllAsTouched() a form.form.markAllAsTouched()
      return;
    }

    this.cargando = true;
    this.errorMessage = '';
    this.successMessage = '';

    setTimeout(() => {
      this.cargando = false;
      this.successMessage = 'Si el correo está registrado, recibirás las instrucciones para restablecer tu contraseña.';
      form.resetForm();
    }, 1500);
  }
}