import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; 


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HistorialComponent } from './pages/historial/historial.component';
import { CrearReclamoComponent } from './pages/crear-reclamo/crear-reclamo.component';
import { ReporteReclamosComponent } from './pages/reporte-reclamos/reporte-reclamos.component';

import { UserhomeComponent } from './pages/userhome/userhome/userhome.component';
import { AdminhomeComponent } from './pages/adminhome/adminhome/adminhome.component';

import { LoginComponent } from './pages/login/login/login.component';
import { BandejaReclamosComponent } from './pages/bandeja-reclamos/bandeja-reclamos.component';

@NgModule({
  declarations: [
    AppComponent,
    HistorialComponent,
    ReporteReclamosComponent,
    UserhomeComponent,
    AdminhomeComponent,
    
    LoginComponent,
    BandejaReclamosComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    CrearReclamoComponent,

    FormsModule 
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }