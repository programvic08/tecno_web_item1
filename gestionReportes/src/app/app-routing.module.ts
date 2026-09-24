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

  // --- VISTAS EXCLUSIVAS DEL CIUDADANO ---
  { path: 'userHome', component: UserhomeComponent, canActivate: [AuthGuard, RoleGuard], data: { rolRequerido: RolUsuario.CIUDADANO } },
  { path: 'crear-reclamo', component: CrearReclamoComponent, canActivate: [AuthGuard, RoleGuard], data: { rolRequerido: RolUsuario.CIUDADANO } },
  { path: 'historial', component: HistorialComponent, canActivate: [AuthGuard, RoleGuard], data: { rolRequerido: RolUsuario.CIUDADANO } },
  { path: 'estado-reclamo', component: EstadoReclamoComponent, canActivate: [AuthGuard, RoleGuard], data: { rolRequerido: RolUsuario.CIUDADANO } },

  // --- VISTAS EXCLUSIVAS DEL ADMINISTRADOR / AGENTE ---
  { path: 'adminHome', component: AdminhomeComponent, canActivate: [AuthGuard, RoleGuard], data: { rolRequerido: RolUsuario.ADMINISTRADOR } },
  { path: 'bandeja-reclamos', component: BandejaReclamosComponent, canActivate: [AuthGuard, RoleGuard], data: { rolRequerido: RolUsuario.ADMINISTRADOR } },
  { path: 'modificar-reclamo', component: ModificarReclamoComponent, canActivate: [AuthGuard, RoleGuard], data: { rolRequerido: RolUsuario.ADMINISTRADOR } },
  { path: 'reporteReclamo', component: ReporteReclamosComponent, canActivate: [AuthGuard, RoleGuard], data: { rolRequerido: RolUsuario.ADMINISTRADOR } },
  // --- VISTA COMPARTIDA (cualquier usuario con sesión iniciada) ---
  { path: 'perfil', component: PerfilComponent, canActivate: [AuthGuard] },

  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }