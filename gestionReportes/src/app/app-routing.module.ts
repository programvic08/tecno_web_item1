import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HistorialComponent } from './pages/historial/historial.component';
import { UserhomeComponent } from './pages/userhome/userhome/userhome.component';
import { LoginComponent } from './pages/login/login/login.component';
import { AdminhomeComponent } from './pages/adminhome/adminhome/adminhome.component';
import { ReporteReclamosComponent } from './components/admin/reporte-reclamos/reporte-reclamos.component';
 import { CrearReclamoComponent } from './pages/crear-reclamo/crear-reclamo.component';

  
const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' }, 
  { path: 'login', component: LoginComponent },
  { path: 'userHome', component: UserhomeComponent },
  { path: 'adminHome', component: AdminhomeComponent },
  { path: 'reporteReclamo', component: ReporteReclamosComponent },
  
  { path: 'crear-reclamo', component: CrearReclamoComponent },
  { path: 'prueba-reclamo', component: CrearReclamoComponent },
  { path: 'historial', component: HistorialComponent },
  { path: '**', redirectTo: 'login' }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }