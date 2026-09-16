import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { HistorialComponent } from './pages/historial/historial.component';
import { DatosPublicosComponent } from './pages/perfil/datos-publicos/datos-publicos.component';
import { CuentaComponent } from './pages/perfil/cuenta/cuenta.component';

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  {
    path: 'perfil',
    component: PerfilComponent,
    children: [
      { path: 'datos', component: DatosPublicosComponent },
      { path: 'cuenta', component: CuentaComponent },
      { path: '', redirectTo: 'datos', pathMatch: 'full' } // Carga 'datos' por defecto al entrar a /perfil
    ]
  },
  { path: 'historial', component: HistorialComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }