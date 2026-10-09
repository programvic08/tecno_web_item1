import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { CrearReclamoComponent } from './crear-reclamo.component';
import { ReclamoService } from '../../core/services/reclamo.service';
import { PLANTILLAS_RECLAMO } from '../../core/config/plantillas-reclamo.config';
import { RUTAS } from '../../core/config/navegacion.config';

describe('CrearReclamoComponent', () => {
  let fixture: ComponentFixture<CrearReclamoComponent>;
  let component: CrearReclamoComponent;
  let service: ReclamoService;
  let router: jasmine.SpyObj<Router>;
  let route: { snapshot: { queryParamMap: ReturnType<typeof convertToParamMap> } };

  beforeEach(async () => {
    route = { snapshot: { queryParamMap: convertToParamMap({}) } };
    router = jasmine.createSpyObj('Router', ['navigate']);
    await TestBed.configureTestingModule({
      declarations: [CrearReclamoComponent],
      imports: [FormsModule],
      providers: [
        ReclamoService,
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();
    service = TestBed.inject(ReclamoService);
  });

  function abrir(parametros: Record<string, string> = {}): void {
    route.snapshot.queryParamMap = convertToParamMap(parametros);
    fixture = TestBed.createComponent(CrearReclamoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  for (const plantilla of PLANTILLAS_RECLAMO) {
    it('precarga y abre Revision: ' + plantilla.id, () => {
      abrir({ plantilla: plantilla.id });
      expect(component.esPlantilla).toBeTrue();
      expect(component.paso).toBe(3);
      expect(component.categoria).toBe(plantilla.categoria);
      expect(component.subcategoria).toBe(plantilla.subcategoria);
      expect(component.subcategoriasDisponibles).toContain(plantilla.subcategoria);
      expect(component.descripcion).toBe(plantilla.descripcion);
      expect(component.esRecurrente).toBe(plantilla.esRecurrente);
      expect(component.formularioValido).toBeFalse();
      component.volver();
      expect(component.paso).toBe(3);
    });
  }

  it('conserva los tres pasos y la revision de solo lectura sin plantilla', () => {
    abrir();
    expect(component.esPlantilla).toBeFalse();
    expect(component.paso).toBe(1);
    component.continuar(true);
    expect(component.paso).toBe(2);
    component.continuar(true);
    fixture.detectChanges();
    expect(component.paso).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('input').length).toBe(0);
    component.volver();
    expect(component.paso).toBe(2);
  });

  it('mantiene el formulario normal para un id desconocido', () => {
    abrir({ plantilla: 'no-existe' });
    expect(component.esPlantilla).toBeFalse();
    expect(component.paso).toBe(1);
    expect(component.categoria).toBe('');
  });

  it('conserva la precarga por categoria y subcategoria de enlaces anteriores', () => {
    const plantilla = PLANTILLAS_RECLAMO[0];
    abrir({ categoria: plantilla.categoria, subcategoria: plantilla.subcategoria });
    expect(component.esPlantilla).toBeFalse();
    expect(component.paso).toBe(1);
    expect(component.categoria).toBe(plantilla.categoria);
    expect(component.subcategoria).toBe(plantilla.subcategoria);
  });

  it('permite editar solo los campos de contexto y bloquea el envio sin direccion', fakeAsync(() => {
    abrir({ plantilla: 'microbasural' });
    tick();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('select, textarea')).toBeNull();
    expect(element.querySelectorAll('input').length).toBe(5);
    const enviar = element.querySelector('.acciones button') as HTMLButtonElement;
    expect(enviar.disabled).toBeTrue();
    const direccion = element.querySelector('#direccionPlantilla') as HTMLInputElement;
    direccion.value = 'Av. Central 123';
    direccion.dispatchEvent(new Event('input'));
    tick();
    fixture.detectChanges();
    expect(component.direccion).toBe('Av. Central 123');
    expect(enviar.disabled).toBeFalse();
  }));

  it('envia plantilla y contexto mediante crearReclamo y redirige al historial', fakeAsync(() => {
    abrir({ plantilla: 'microbasural' });
    const crear = spyOn(service, 'crearReclamo').and.callThrough();
    component.direccion = '   ';
    component.enviarReclamo();
    expect(crear).not.toHaveBeenCalled();
    component.direccion = 'Av. Central 123';
    component.fechaHoraObservada = '2026-10-09T10:30';
    component.ubicacionReferencia = 'Frente a la plaza';
    component.sectorZona = 'Norte';
    component.onArchivoSeleccionado({ currentTarget: { files: [new File(['foto'], 'foto.png')] } } as unknown as Event);
    component.enviarReclamo();
    expect(crear).toHaveBeenCalledWith(jasmine.objectContaining({
      categoria: PLANTILLAS_RECLAMO[0].categoria,
      subcategoria: PLANTILLAS_RECLAMO[0].subcategoria,
      descripcion: PLANTILLAS_RECLAMO[0].descripcion,
      esRecurrente: true,
      direccion: 'Av. Central 123',
      fechaHoraObservada: '2026-10-09T10:30',
      ubicacion: 'Av. Central 123 (Frente a la plaza)',
      sectorZona: 'Norte',
      evidenciaNombre: 'foto.png'
    }));
    expect(component.enviado).toBeTrue();
    tick(2000);
    expect(router.navigate).toHaveBeenCalledWith([RUTAS.historial]);
  }));
});
