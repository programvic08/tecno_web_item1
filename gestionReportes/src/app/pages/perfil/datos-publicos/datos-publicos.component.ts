import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-datos-publicos',
  templateUrl: './datos-publicos.component.html',
  styleUrls: ['./datos-publicos.component.css']
})
export class DatosPublicosComponent implements OnInit {

  usuario = {
    nombre: '',
    apellido: '',
    direccion: '' // Inicia vacío ya que es un campo opcional
  };

  ngOnInit(): void {
    this.obtenerDatosUsuario();
  }

  obtenerDatosUsuario(): void {
    // Ejemplo de simulación: usuario sin dirección registrada
    this.usuario = {
      nombre: 'Juan',
      apellido: 'Pérez',
      direccion: '' // Si no la ha ingresado, se mantendrá vacía
    };
  }

  modificarDireccion(): void {
    console.log('Abrir formulario para agregar/modificar dirección');
  }
}