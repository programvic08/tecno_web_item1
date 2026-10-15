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

  for (const parametros of [{}, { plantilla: 'microbasural' }] as Record<string, string>[]) {
    it('precarga hora local actual y permite editarla: ' + JSON.stringify(parametros), fakeAsync(() => {
      const ahora = new Date(2026, 9, 15, 12, 34, 56);
      spyOn(Date, 'now').and.returnValue(ahora.getTime());
      jasmine.clock().mockDate(ahora);
      abrir(parametros);
      expect(component.fechaHoraObservada).toBe('2026-10-15T12:34');
      if (!component.esPlantilla) component.paso = 2;
      fixture.detectChanges();
      tick();
      const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="datetime-local"]');
      expect(input.value).toBe('2026-10-15T12:34');
      expect(input.readOnly).toBeFalse();
      expect(input.disabled).toBeFalse();
      input.value = '2020-01-01T10:30';
      input.dispatchEvent(new Event('input'));
      tick();
      component.validarFecha();
      expect(component.fechaHoraObservada).toBe('2020-01-01T10:30');
      expect(component.errorFecha).toBe('');
      component.fechaHoraObservada = '';
      expect(component.validarFecha()).toBeTrue();
    }));
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
    component.fechaHoraObservada = '2020-01-01T10:30';
    component.ubicacionReferencia = 'Frente a la plaza';
    component.sectorZona = 'Norte';
    component.evidenciaNombre = 'foto.png';
    component.enviarReclamo();
    expect(crear).toHaveBeenCalledWith(jasmine.objectContaining({
      categoria: PLANTILLAS_RECLAMO[0].categoria,
      subcategoria: PLANTILLAS_RECLAMO[0].subcategoria,
      descripcion: PLANTILLAS_RECLAMO[0].descripcion,
      esRecurrente: true,
      direccion: 'Av. Central 123',
      fechaHoraObservada: '2020-01-01T10:30',
      ubicacion: 'Av. Central 123 (Frente a la plaza)',
      sectorZona: 'Norte',
      evidenciaNombre: 'foto.png'
    }));
    expect(component.enviado).toBeTrue();
    tick(2000);
    expect(router.navigate).toHaveBeenCalledWith([RUTAS.historial]);
  }));

  function seleccionar(archivo: File): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    const transferencia = new DataTransfer();
    transferencia.items.add(archivo);
    input.files = transferencia.files;
    component.onArchivoSeleccionado({ target: input } as unknown as Event);
    return input;
  }

  function terminarLectura(): Promise<void> {
    return new Promise((resolve, reject) => {
      const limite = Date.now() + 3000;
      const revisar = () => {
        if (!component.leyendoEvidencia) resolve();
        else if (Date.now() > limite) reject(new Error('La lectura no termino'));
        else setTimeout(revisar, 10);
      };
      revisar();
    });
  }

  it('rechaza fecha futura y bloquea el avance normal', () => {
    abrir();
    component.paso = 2;
    component.fechaHoraObservada = '2999-01-01T12:00';
    component.continuar(true);
    expect(component.paso).toBe(2);
    expect(component.errorFecha).not.toBe('');
  });

  for (const parametros of [{}, { plantilla: 'microbasural' }] as Record<string, string>[]) {
    it('valida la fecha antes de enviar: ' + JSON.stringify(parametros), () => {
      abrir(parametros);
      component.categoria = PLANTILLAS_RECLAMO[0].categoria;
      component.subcategoria = PLANTILLAS_RECLAMO[0].subcategoria;
      component.descripcion = 'Descripcion';
      component.direccion = 'Av. Central 123';
      component.fechaHoraObservada = '2999-01-01T12:00';
      const crear = spyOn(service, 'crearReclamo').and.callThrough();
      component.enviarReclamo();
      expect(crear).not.toHaveBeenCalled();
      expect(component.errorFecha).not.toBe('');
    });
  }

  it('acepta fecha pasada y fecha opcional, y rechaza fecha invalida', () => {
    abrir();
    component.fechaHoraObservada = '2020-01-01T10:00';
    expect(component.validarFecha()).toBeTrue();
    component.paso = 2;
    component.continuar(true);
    expect(component.paso).toBe(3);
    component.fechaHoraObservada = 'invalida';
    expect(component.validarFecha()).toBeFalse();
    component.fechaHoraObservada = '';
    expect(component.validarFecha()).toBeTrue();
    expect(component.errorFecha).toBe('');
  });

  it('valida fecha editada en la interfaz de plantilla', fakeAsync(() => {
    abrir({ plantilla: 'microbasural' });
    tick();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#fechaPlantilla');
    input.value = '2999-01-01T12:00';
    input.dispatchEvent(new Event('input'));
    tick();
    fixture.detectChanges();
    expect(component.errorFecha).not.toBe('');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  }));

  for (const tipo of ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']) {
    for (const plantilla of [false, true]) {
      it('lee evidencia ' + tipo + ', plantilla=' + plantilla, async () => {
        abrir(plantilla ? { plantilla: 'microbasural' } : {});
        if (!plantilla) component.paso = 2;
        fixture.detectChanges();
        const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
        const transferencia = new DataTransfer();
        transferencia.items.add(new File(['contenido'], 'evidencia', { type: tipo }));
        input.files = transferencia.files;
        input.dispatchEvent(new Event('change'));
        await terminarLectura();
        fixture.detectChanges();
        expect(component.evidenciaNombre).toBe('evidencia');
        expect(component.evidenciaTipo).toBe(tipo);
        expect(component.evidenciaDataUrl).toBe('data:' + tipo + ';base64,Y29udGVuaWRv');
        expect(!!fixture.nativeElement.querySelector('img')).toBe(tipo.startsWith('image/'));
        const quitar = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
          .find(button => button.textContent?.trim() === 'Quitar')!;
        quitar.click();
        fixture.detectChanges();
        expect(component.evidenciaNombre).toBe('');
        expect(component.evidenciaTipo).toBe('');
        expect(component.evidenciaDataUrl).toBe('');
        expect(input.value).toBe('');
        expect(fixture.nativeElement.querySelector('img')).toBeNull();
      });
    }
  }

  it('rechaza formato invalido y limpia evidencia anterior e input', () => {
    abrir();
    component.evidenciaNombre = 'anterior.pdf';
    component.evidenciaTipo = 'application/pdf';
    component.evidenciaDataUrl = 'data:application/pdf;base64,YQ==';
    const input = seleccionar(new File(['texto'], 'archivo.txt', { type: 'text/plain' }));
    expect(component.errorArchivo).not.toBe('');
    expect(input.value).toBe('');
    expect(component.evidenciaNombre).toBe('');
    expect(component.evidenciaTipo).toBe('');
    expect(component.evidenciaDataUrl).toBe('');
  });

  it('rechaza archivos mayores de 5 MB', () => {
    abrir();
    const input = seleccionar(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'grande.pdf', { type: 'application/pdf' }));
    expect(component.errorArchivo).toContain('5 MB');
    expect(component.evidenciaNombre).toBe('');
    expect(input.value).toBe('');
  });

  it('acepta exactamente 5 MB', async () => {
    abrir();
    seleccionar(new File([new Uint8Array(5 * 1024 * 1024)], 'limite.pdf', { type: 'application/pdf' }));
    await terminarLectura();
    expect(component.errorArchivo).toBe('');
    expect(component.evidenciaNombre).toBe('limite.pdf');
  });

  it('quitar evidencia cancela una lectura pendiente', async () => {
    abrir();
    const input = seleccionar(new File(['foto'], 'foto.png', { type: 'image/png' }));
    component.quitarEvidencia(input);
    await terminarLectura();
    expect(component.evidenciaNombre).toBe('');
    expect(component.evidenciaDataUrl).toBe('');
    expect(component.leyendoEvidencia).toBeFalse();
  });

  it('envia el tipo y contenido de evidencia y espera a que se lea', async () => {
    abrir({ plantilla: 'microbasural' });
    component.direccion = 'Av. Central 123';
    const crear = spyOn(service, 'crearReclamo').and.callThrough();
    const timeout = spyOn(window, 'setTimeout').and.callThrough();
    seleccionar(new File(['contenido'], 'foto.png', { type: 'image/png' }));
    component.enviarReclamo();
    expect(crear).not.toHaveBeenCalled();
    await terminarLectura();
    timeout.and.stub();
    component.enviarReclamo();
    expect(crear).toHaveBeenCalledWith(jasmine.objectContaining({
      evidenciaNombre: 'foto.png', evidenciaTipo: 'image/png',
      evidenciaDataUrl: 'data:image/png;base64,Y29udGVuaWRv'
    }));
  });
});
