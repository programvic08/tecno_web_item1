import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { UserhomeComponent } from './pages/userhome/userhome.component';
import { AdminhomeComponent } from './pages/adminhome/adminhome.component';
import { CrearReclamoComponent } from './pages/crear-reclamo/crear-reclamo.component';
import { HistorialComponent } from './pages/historial/historial.component';
import { BandejaReclamosComponent } from './pages/bandeja-reclamos/bandeja-reclamos.component';
import { ReporteReclamosComponent } from './pages/reporte-reclamos/reporte-reclamos.component';
import { EstadoReclamoComponent } from './pages/estado-reclamo/estado-reclamo.component';
import { ModificarReclamoComponent } from './pages/modificar-reclamo/modificar-reclamo.component';
import { PerfilComponent } from './pages/perfil/perfil.component';

import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { RolUsuario } from './models/reclamo.enums';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  // --- RUTAS HIJAS DEL CIUDADANO ---
  {
    path: '',
    canActivate: [AuthGuard, RoleGuard],
    data: { rolRequerido: RolUsuario.CIUDADANO },
    children: [
      { path: 'userHome', component: UserhomeComponent },
      { path: 'crear-reclamo', component: CrearReclamoComponent },
      { path: 'historial', component: HistorialComponent },
      { path: 'estado-reclamo', component: EstadoReclamoComponent }
    ]
  },

  // --- RUTAS HIJAS DEL ADMINISTRADOR / AGENTE ---
  {
    path: '',
    canActivate: [AuthGuard, RoleGuard],
    data: { rolRequerido: RolUsuario.ADMINISTRADOR },
    children: [
      { path: 'adminHome', component: AdminhomeComponent },
      { path: 'bandeja-reclamos', component: BandejaReclamosComponent },
      { path: 'modificar-reclamo', component: ModificarReclamoComponent },
      { path: 'reporteReclamo', component: ReporteReclamosComponent }
    ]
  },

  // --- RUTA COMPARTIDA: perfil (cualquier usuario con sesión válida, sin importar el rol) ---
  { path: 'perfil', component: PerfilComponent, canActivate: [AuthGuard] },

  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }