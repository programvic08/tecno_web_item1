import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
 import { CrearReclamoComponent } from './pages/crear-reclamo/crear-reclamo.component';
const routes: Routes = [
  { path: 'crear-reclamo', component: CrearReclamoComponent },
   { path: 'prueba-reclamo', component: CrearReclamoComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
