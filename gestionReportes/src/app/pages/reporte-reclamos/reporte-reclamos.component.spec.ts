import { FechaNoFuturaDirective } from '../../shared/directives/fecha-no-futura.directive';
import { FormsModule } from '@angular/forms';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ReclamoService } from '../../core/services/reclamo.service';
import { AuthService } from '../../core/services/auth.service';
import { USUARIO_ADMIN_PRUEBA } from '../../testing/usuarios-prueba';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ReporteReclamosComponent } from './reporte-reclamos.component';

describe('ReporteReclamosComponent', () => {
  let component: ReporteReclamosComponent;
  let fixture: ComponentFixture<ReporteReclamosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReporteReclamosComponent, FechaNoFuturaDirective, StatusBadgeComponent ],
      imports: [FormsModule]
    })
    .compileComponents();

    // El reporte solo cuenta los reclamos que el usuario puede ver: se prueba con el administrador (ve todos)
    spyOn(TestBed.inject(AuthService), 'obtenerUsuarioActual').and.returnValue(USUARIO_ADMIN_PRUEBA);

    fixture = TestBed.createComponent(ReporteReclamosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('envia los filtros actuales al aplicar filtros y actualiza el reporte', () => {
    const service = TestBed.inject(ReclamoService);
    const obtener = spyOn(service, 'obtenerReporte').and.callThrough();
    component.filtroFechaDesde = '2026-09-10';
    component.filtroFechaHasta = '2026-09-12';
    component.filtroCategoria = service.getCategorias()[0].nombre;
    component.filtroEstado = 'En proceso';
    component.aplicarFiltros();
    expect(obtener).toHaveBeenCalledWith({
      fechaDesde: '2026-09-10', fechaHasta: '2026-09-12',
      categoria: component.filtroCategoria, estado: 'En proceso'
    });
    expect(component.reporte.totalReclamos).toBe(1);
    expect(component.isLoading).toBeFalse();
  });

  it('muestra Sin datos cuando no hay resoluciones y muestra cero como dato valido', () => {
    component.reporte.tiempoPromedioResolucionDias = null;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.metricas-resumen').textContent).toContain('Sin datos');
    component.reporte.tiempoPromedioResolucionDias = 0;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.metricas-resumen').textContent).toContain('0 d');
    expect(fixture.nativeElement.querySelector('.metricas-resumen').textContent).not.toContain('Sin datos');
  });

  for (const campo of ['fechaDesde', 'fechaHasta']) {
    it('rechaza fecha futura en ' + campo + ' y permite corregirla', fakeAsync(() => {
      tick();
      const obtener = spyOn(TestBed.inject(ReclamoService), 'obtenerReporte').and.callThrough();
      const input: HTMLInputElement = fixture.nativeElement.querySelector('#' + campo);
      expect(input.max).not.toBe('');
      input.value = '2999-01-01';
      input.dispatchEvent(new Event('input'));
      tick();
      fixture.detectChanges();
      expect(input.classList.contains('ng-invalid')).toBeTrue();
      expect(fixture.nativeElement.querySelector('.btn-filtrar').disabled).toBeTrue();
      expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('posterior');
      component.aplicarFiltros();
      expect(obtener).not.toHaveBeenCalled();
      input.value = '';
      input.dispatchEvent(new Event('input'));
      tick();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.btn-filtrar').disabled).toBeFalse();
      component.aplicarFiltros();
      expect(obtener).toHaveBeenCalled();
    }));
  }
});
