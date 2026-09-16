import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cuenta',
  templateUrl: './cuenta.component.html',
  styleUrls: ['./cuenta.component.css']
})
export class CuentaComponent implements OnInit {

  usuario = {
    username: '',
    correo: ''
  };

  ngOnInit(): void {
    this.obtenerDatosCuenta();
  }

  obtenerDatosCuenta(): void {
    this.usuario = {
      username: 'jperez2026',
      correo: 'juan.perez@ejemplo.com'
    };
  }
}