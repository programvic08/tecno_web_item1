import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Páginas
import { LoginComponent } from './pages/login/login.component';
import { UserhomeComponent } from './pages/userhome/userhome.component';
import { AdminhomeComponent } from './pages/adminhome/adminhome.component';
import { CrearReclamoComponent } from './pages/crear-reclamo/crear-reclamo.component';
import { HistorialComponent } from './pages/historial/historial.component';
import { BandejaReclamosComponent } from './pages/bandeja-reclamos/bandeja-reclamos.component';
import { ReporteReclamosComponent } from './pages/reporte-reclamos/reporte-reclamos.component';
import { EstadoReclamoComponent } from './pages/estado-reclamo/estado-reclamo.component';
import { ModificarReclamoComponent } from './pages/modificar-reclamo/modificar-reclamo.component';

// Componentes Compartidos (Reutilizables)
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { StatusBadgeComponent } from './shared/components/status-badge/status-badge.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    UserhomeComponent,
    AdminhomeComponent,
    CrearReclamoComponent,
    HistorialComponent,
    BandejaReclamosComponent,
    ReporteReclamosComponent,
    
    // REGISTRA AQUÍ LOS COMPONENTES COMPARTIDOS
    HeaderComponent,
    FooterComponent,
    StatusBadgeComponent,
    EstadoReclamoComponent,
    ModificarReclamoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }