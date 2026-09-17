import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReporteReclamosComponent } from './components/admin/reporte-reclamos/reporte-reclamos.component';

const routes: Routes = [
  { path: '', component: ReporteReclamosComponent },
  { path: 'admin/reportes', component: ReporteReclamosComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }