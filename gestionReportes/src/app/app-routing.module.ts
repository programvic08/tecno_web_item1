import { RUTAS } from './core/config/navegacion.config';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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
import { DetalleReclamoComponent } from './pages/detalle-reclamo/detalle-reclamo.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { RecuperarContrasenaComponent } from './pages/recuperar-contrasena/recuperar-contrasena/recuperar-contrasena.component';
import { GestionAgentesComponent } from './pages/gestion-agentes/gestion-agentes.component';

import { AuthGuard } from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/guest.guard';
import { RoleGuard } from './core/guards/role.guard';
import { ROLES_PERSONAL, RolUsuario } from './models/reclamo.enums';

const routes: Routes = [
  { path: '', redirectTo: RUTAS.login.slice(1), pathMatch: 'full' },
  { path: RUTAS.login.slice(1), component: LoginComponent, canActivate: [GuestGuard] },
  { path: RUTAS.registro.slice(1), component: RegistroComponent, canActivate: [GuestGuard] },
  { path: RUTAS.recuperarContrasena.slice(1), component: RecuperarContrasenaComponent },

  // --- RUTAS HIJAS DEL CIUDADANO ---
  {
    path: '',
    canActivate: [AuthGuard, RoleGuard],
    data: { rolesPermitidos: [RolUsuario.CIUDADANO] },
    children: [
      { path: RUTAS.inicioCiudadano.slice(1), component: UserhomeComponent },
      { path: RUTAS.crear.slice(1), component: CrearReclamoComponent },
      { path: RUTAS.historial.slice(1), component: HistorialComponent },
      { path: RUTAS.estado.slice(1), component: EstadoReclamoComponent }
    ]
  },

  // --- RUTAS HIJAS DEL PERSONAL MUNICIPAL (administrador y agente) ---
  // El filtrado de qué reclamos ve cada uno (todos / solo los asignados) lo hace ReclamoService.
  {
    path: '',
    canActivate: [AuthGuard, RoleGuard],
    data: { rolesPermitidos: ROLES_PERSONAL },
    children: [
      { path: RUTAS.inicioAdmin.slice(1), component: AdminhomeComponent },
      { path: RUTAS.bandeja.slice(1), component: BandejaReclamosComponent },
      { path: RUTAS.detalle.slice(1), component: DetalleReclamoComponent },
      { path: RUTAS.modificar.slice(1), component: ModificarReclamoComponent },
      { path: RUTAS.reportes.slice(1), component: ReporteReclamosComponent }
    ]
  },

  // --- RUTAS SOLO DEL ADMINISTRADOR ---
  {
    path: '',
    canActivate: [AuthGuard, RoleGuard],
    data: { rolesPermitidos: [RolUsuario.ADMINISTRADOR] },
    children: [
      { path: RUTAS.agentes.slice(1), component: GestionAgentesComponent }
    ]
  },

  // --- RUTA COMPARTIDA: perfil (cualquier usuario con sesión válida, sin importar el rol) ---
  { path: RUTAS.perfil.slice(1), component: PerfilComponent, canActivate: [AuthGuard] },

  { path: '**', redirectTo: RUTAS.login.slice(1) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
