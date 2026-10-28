import { FechaNoFuturaDirective } from './shared/directives/fecha-no-futura.directive';
import { HttpClientModule } from '@angular/common/http';
import { DireccionAutocompleteComponent } from './shared/components/direccion-autocomplete/direccion-autocomplete.component';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Páginas
import { LoginComponent } from './pages/login/login.component';
import { RegistroComponent } from './pages/register/registro.component';
import { UserhomeComponent } from './pages/userhome/userhome.component';
import { AdminhomeComponent } from './pages/adminhome/adminhome.component';
import { CrearReclamoComponent } from './pages/crear-reclamo/crear-reclamo.component';
import { HistorialComponent } from './pages/historial/historial.component';
import { BandejaReclamosComponent } from './pages/bandeja-reclamos/bandeja-reclamos.component';
import { ReporteReclamosComponent } from './pages/reporte-reclamos/reporte-reclamos.component';
import { EstadoReclamoComponent } from './pages/estado-reclamo/estado-reclamo.component';
import { ModificarReclamoComponent } from './pages/modificar-reclamo/modificar-reclamo.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { GestionAgentesComponent } from './pages/gestion-agentes/gestion-agentes.component';

// Componentes Compartidos (Reutilizables)
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SubnavComponent } from './shared/components/subnav/subnav.component';
import { ReportesCarouselComponent } from './shared/components/reportes-carousel/reportes-carousel.component';
import { ComoHagoParaComponent } from './shared/components/como-hago-para/como-hago-para.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { StatusBadgeComponent } from './shared/components/status-badge/status-badge.component';
import { FaqComponent } from './shared/components/faq/faq.component';
import { RecuperarContrasenaComponent } from './pages/recuperar-contrasena/recuperar-contrasena/recuperar-contrasena.component';


@NgModule({
  declarations: [
    AppComponent,
    FechaNoFuturaDirective,
    LoginComponent,
    RegistroComponent,
    UserhomeComponent,
    AdminhomeComponent,
    CrearReclamoComponent,
    HistorialComponent,
    BandejaReclamosComponent,
    ReporteReclamosComponent,
    
    // REGISTRA AQUÍ LOS COMPONENTES COMPARTIDOS
    NavbarComponent,
    SubnavComponent,
    ReportesCarouselComponent,
    ComoHagoParaComponent,
    FooterComponent,
    StatusBadgeComponent,
    DireccionAutocompleteComponent,
    FaqComponent,
    EstadoReclamoComponent,
    ModificarReclamoComponent,
    PerfilComponent,
    RecuperarContrasenaComponent,
    GestionAgentesComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
