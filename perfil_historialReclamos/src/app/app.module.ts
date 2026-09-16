import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { HistorialComponent } from './pages/historial/historial.component';
import { HomeComponent } from './pages/home/home.component';
import { DatosPublicosComponent } from './pages/perfil/datos-publicos/datos-publicos.component';
import { CuentaComponent } from './pages/perfil/cuenta/cuenta.component';

@NgModule({
  declarations: [
    AppComponent,
    PerfilComponent,
    HistorialComponent,
    HomeComponent,
    DatosPublicosComponent,
    CuentaComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
