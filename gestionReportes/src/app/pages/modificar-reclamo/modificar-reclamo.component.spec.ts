import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { Router } from '@angular/router';
import { ReclamoService } from '../../core/services/reclamo.service';
import { AuthService } from '../../core/services/auth.service';
import { USUARIO_ADMIN_PRUEBA, USUARIO_AGENTE_PRUEBA } from '../../testing/usuarios-prueba';

import { ModificarReclamoComponent } from './modificar-reclamo.component';

describe('ModificarReclamoComponent', () => {
  let component: ModificarReclamoComponent;
  let fixture: ComponentFixture<ModificarReclamoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModificarReclamoComponent, StatusBadgeComponent ],
      imports: [ FormsModule, RouterTestingModule ]
    })
    .compileComponents();

    spyOn(TestBed.inject(AuthService), 'obtenerUsuarioActual').and.returnValue(USUARIO_ADMIN_PRUEBA);
    fixture = TestBed.createComponent(ModificarReclamoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('muestra ciudadano y pendiente de asignacion sin controles de estado', () => {
    component.busquedaFolio = 'REC-2026-002';
    component.buscarReclamo();
    fixture.detectChanges();
    const html: HTMLElement = fixture.nativeElement;
    expect(html.textContent).toContain('Ciudadano de Prueba');
    expect(html.textContent).toContain('Pendiente de asignación');
    expect(html.querySelector('select')).toBeNull();
    expect(html.querySelector('textarea')).toBeNull();
  });

  it('ofrece acciones por estado y muestra resultado al cerrar', () => {
    const service = TestBed.inject(ReclamoService);
    service.asignarAgente('REC-2026-002', USUARIO_AGENTE_PRUEBA);
    component.busquedaFolio = 'REC-2026-002';
    component.buscarReclamo();
    fixture.detectChanges();
    const html: HTMLElement = fixture.nativeElement;
    expect(html.textContent).toContain('Registrar avance');
    expect(html.textContent).toContain('Rechazar reclamo');
    expect(html.textContent).not.toContain('Resolver reclamo');
    expect((html.querySelector('button[type=submit]') as HTMLButtonElement).disabled).toBeTrue();
    component.nuevaObservacion = 'Trabajo realizado';
    component.ejecutar('avance');
    fixture.detectChanges();
    expect(html.textContent).toContain('Agregar avance');
    expect(html.textContent).toContain('Resolver reclamo');
    expect(html.textContent).not.toContain('Rechazar reclamo');
    component.ejecutar('resolver');
    fixture.detectChanges();
    expect(html.textContent).toContain('Resultado del cierre:');
    expect(html.textContent).toContain('Resuelto');
    expect(html.querySelector('textarea')).toBeNull();
    expect(html.querySelector('select')).toBeNull();
    expect(html.textContent).toContain('Trabajo realizado');
  });

  for (const accion of ['resolver', 'rechazar'] as const) {
    it('vuelve a la bandeja tras ' + accion + ' el reclamo', fakeAsync(() => {
      const service = TestBed.inject(ReclamoService);
      const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      service.asignarAgente('REC-2026-002', USUARIO_AGENTE_PRUEBA);
      component.busquedaFolio = 'REC-2026-002';
      component.buscarReclamo();
      if (accion === 'resolver') {
        component.nuevaObservacion = 'Trabajo realizado';
        component.ejecutar('avance');
        tick(2000);
        expect(navegar).not.toHaveBeenCalled();
      }
      component.nuevaObservacion = 'Fuera de competencia';
      component.ejecutar(accion);
      expect(component.actualizadoExito).toBeTrue();
      tick(1999);
      expect(navegar).not.toHaveBeenCalled();
      tick(1);
      expect(navegar).toHaveBeenCalledWith(['/bandeja-reclamos']);
    }));
  }

});
