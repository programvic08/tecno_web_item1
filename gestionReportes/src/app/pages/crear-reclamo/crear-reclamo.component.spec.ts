import { FechaNoFuturaDirective } from '../../shared/directives/fecha-no-futura.directive';
import { of, Subject, throwError } from 'rxjs';
import { DireccionSugerencia, GeocodingService } from '../../core/services/geocoding.service';
import { DireccionAutocompleteComponent } from '../../shared/components/direccion-autocomplete/direccion-autocomplete.component';
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
      declarations: [FechaNoFuturaDirective, CrearReclamoComponent, DireccionAutocompleteComponent],
      imports: [FormsModule],
      providers: [
        ReclamoService,
        { provide: GeocodingService, useValue: { buscar: jasmine.createSpy('buscar').and.returnValue(of([])) } },
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
    component.sectorZona = 'Manhattan';
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
    expect(element.querySelector('#categoria, #subcategoria, textarea')).toBeNull();
    component.sectorZona = 'Manhattan';
    expect(element.querySelectorAll('input').length).toBe(4);
    const enviar = element.querySelector('.acciones button') as HTMLButtonElement;
    expect(enviar.disabled).toBeTrue();
    const direccion = element.querySelector('#direccionPlantilla') as HTMLInputElement;
    direccion.value = 'Av. Central 123';
    direccion.dispatchEvent(new Event('input'));
    tick(350);
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
    component.sectorZona = 'Manhattan';
    component.fechaHoraObservada = '2020-01-01T10:30';
    component.ubicacionReferencia = 'Frente a la plaza';
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
      sectorZona: 'Manhattan',
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
      component.sectorZona = 'Manhattan';
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
    component.sectorZona = 'Manhattan';
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
      it((tipo.startsWith('image/') ? 'lee evidencia ' : 'rechaza evidencia ') + tipo + ', plantilla=' + plantilla, async () => {
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
        if (!tipo.startsWith('image/')) {
          expect(component.errorArchivo).toContain('Solo se aceptan imágenes');
          expect(component.evidenciaNombre).toBe('');
          expect(component.evidenciaTipo).toBe('');
          expect(component.evidenciaDataUrl).toBe('');
          expect(input.value).toBe('');
          expect(fixture.nativeElement.querySelector('img')).toBeNull();
          return;
        }
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
    const input = seleccionar(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'grande.png', { type: 'image/png' }));
    expect(component.errorArchivo).toContain('5 MB');
    expect(component.evidenciaNombre).toBe('');
    expect(input.value).toBe('');
  });

  it('acepta exactamente 5 MB', async () => {
    abrir();
    seleccionar(new File([new Uint8Array(5 * 1024 * 1024)], 'limite.png', { type: 'image/png' }));
    await terminarLectura();
    expect(component.errorArchivo).toBe('');
    expect(component.evidenciaNombre).toBe('limite.png');
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
    component.sectorZona = 'Manhattan';
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

  for (const plantilla of [false, true]) {
    it('muestra los cinco boroughs y conserva seleccion manual, plantilla=' + plantilla, fakeAsync(() => {
      abrir(plantilla ? { plantilla: 'microbasural' } : {});
      if (!plantilla) component.paso = 2;
      fixture.detectChanges();
      tick();
      const select: HTMLSelectElement = fixture.nativeElement.querySelector(plantilla ? '#sectorPlantilla' : '#sectorZona');
      expect(Array.from(select.options).map(option => option.value)).toEqual([
        '', 'Manhattan', 'Brooklyn', 'Queens', 'The Bronx', 'Staten Island'
      ]);
      expect(select.options[0].disabled).toBeTrue();
      expect(select.required).toBeTrue();
      expect(component.sectorZona).toBe('');
      select.value = 'Queens';
      select.dispatchEvent(new Event('change'));
      tick();
      expect(component.sectorZona).toBe('Queens');
      expect(component.boroughValido).toBeTrue();
      if (plantilla) expect(component.paso).toBe(3);
    }));

    it('bloquea envio sin borough o con valor fuera del listado, plantilla=' + plantilla, () => {
      abrir(plantilla ? { plantilla: 'microbasural' } : {});
      component.categoria = PLANTILLAS_RECLAMO[0].categoria;
      component.subcategoria = PLANTILLAS_RECLAMO[0].subcategoria;
      component.descripcion = 'Descripcion';
      component.direccion = '215 E 68th St';
      const crear = spyOn(service, 'crearReclamo').and.callThrough();
      for (const borough of ['', 'Norte']) {
        component.sectorZona = borough;
        expect(component.formularioValido).toBeFalse();
        component.enviarReclamo();
        expect(crear).not.toHaveBeenCalled();
      }
    });

    it('guarda borough separado de direccion y referencia, plantilla=' + plantilla, fakeAsync(() => {
      abrir(plantilla ? { plantilla: 'microbasural' } : {});
      component.categoria = PLANTILLAS_RECLAMO[0].categoria;
      component.subcategoria = PLANTILLAS_RECLAMO[0].subcategoria;
      component.descripcion = 'Descripcion';
      component.direccion = '215 E 68th St';
      component.sectorZona = 'Manhattan';
      component.ubicacionReferencia = 'Frente a la entrada del parque';
      const crear = spyOn(service, 'crearReclamo').and.callThrough();
      component.enviarReclamo();
      expect(crear).toHaveBeenCalledWith(jasmine.objectContaining({
        direccion: '215 E 68th St', sectorZona: 'Manhattan',
        ubicacion: '215 E 68th St (Frente a la entrada del parque)'
      }));
      tick(2000);
      expect(router.navigate).toHaveBeenCalledWith([RUTAS.historial]);
    }));
  }

  it('bloquea avance del paso 2 sin borough y permite avanzar al seleccionarlo', fakeAsync(() => {
    abrir();
    component.paso = 2;
    component.direccion = '215 E 68th St';
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const siguiente: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(siguiente.disabled).toBeTrue();
    component.continuar(true);
    expect(component.paso).toBe(2);
    const borough: HTMLSelectElement = fixture.nativeElement.querySelector('#sectorZona');
    borough.value = 'Brooklyn';
    borough.dispatchEvent(new Event('change'));
    tick();
    fixture.detectChanges();
    expect(siguiente.disabled).toBeFalse();
    siguiente.click();
    expect(component.paso).toBe(3);
  }));

  for (const plantilla of [false, true]) {
    it('busca y selecciona direccion de NY, plantilla=' + plantilla, fakeAsync(() => {
      const geocoding = TestBed.inject(GeocodingService);
      (geocoding.buscar as jasmine.Spy).and.returnValue(of([{
        lat: '40.76', lon: '-73.96', textoCorto: '215 E 68th St, New York', displayName: 'Direccion completa'
      }]));
      abrir(plantilla ? { plantilla: 'microbasural' } : {});
      if (!plantilla) component.paso = 2;
      fixture.detectChanges();
      tick();
      const input: HTMLInputElement = fixture.nativeElement.querySelector('app-direccion-autocomplete input');
      input.value = '215 E 68';
      input.dispatchEvent(new Event('input'));
      tick(349);
      expect(geocoding.buscar).not.toHaveBeenCalled();
      tick(1);
      fixture.detectChanges();
      expect(geocoding.buscar).toHaveBeenCalledWith('215 E 68');
      const sugerencia: HTMLElement = fixture.nativeElement.querySelector('[role="option"]');
      expect(sugerencia.textContent).toContain('215 E 68th St');
      sugerencia.dispatchEvent(new MouseEvent('mousedown'));
      tick();
      fixture.detectChanges();
      expect(component.direccion).toBe('215 E 68th St, New York');
      expect(input.value).toBe(component.direccion);
      expect(fixture.nativeElement.querySelector('[role="listbox"]')).toBeNull();
      expect(component.paso).toBe(plantilla ? 3 : 2);
      component.sectorZona = 'Manhattan';
      component.categoria = PLANTILLAS_RECLAMO[0].categoria;
      component.subcategoria = PLANTILLAS_RECLAMO[0].subcategoria;
      component.descripcion = 'Descripcion';
      const crear = spyOn(service, 'crearReclamo').and.callThrough();
      component.enviarReclamo();
      expect(crear).toHaveBeenCalledWith(jasmine.objectContaining({ direccion: '215 E 68th St, New York' }));
      tick(2000);
    }));
  }

  it('distingue errores de ausencia de coincidencias y permite reintentar', fakeAsync(() => {
    const buscar = TestBed.inject(GeocodingService).buscar as jasmine.Spy;
    buscar.and.returnValue(throwError(() => new Error('Sin conexion')));
    abrir({ plantilla: 'microbasural' });
    tick();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('app-direccion-autocomplete input');
    input.value = 'Broadw';
    input.dispatchEvent(new Event('input'));
    tick(350);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se pudo consultar');
    expect(component.direccion).toBe('Broadw');
    buscar.and.returnValue(of([]));
    input.value = 'Broadwa';
    input.dispatchEvent(new Event('input'));
    tick(350);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin coincidencias');
    expect(fixture.nativeElement.textContent).not.toContain('No se pudo consultar');
  }));

  it('descarta respuestas anteriores cuando el usuario borra el texto', fakeAsync(() => {
    const pendiente = new Subject<DireccionSugerencia[]>();
    (TestBed.inject(GeocodingService).buscar as jasmine.Spy).and.returnValue(pendiente);
    abrir({ plantilla: 'microbasural' });
    tick();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('app-direccion-autocomplete input');
    input.value = 'Broadw';
    input.dispatchEvent(new Event('input'));
    tick(350);
    input.value = '';
    input.dispatchEvent(new Event('input'));
    pendiente.next([{ textoCorto: 'Broadway', displayName: 'Broadway, New York', lat: '40.7', lon: '-74' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="option"]')).toBeNull();
    expect(component.direccion).toBe('');
  }));

  for (const plantilla of [false, true]) {
    it('completa sector al seleccionar direccion y permite corregirlo, plantilla=' + plantilla, fakeAsync(() => {
      const buscar = TestBed.inject(GeocodingService).buscar as jasmine.Spy;
      buscar.and.returnValue(of([{ lat: '40.7', lon: '-74', textoCorto: 'Calle, Manhattan',
        displayName: 'Calle, Manhattan', sectorZona: 'Manhattan' }]));
      abrir(plantilla ? { plantilla: 'microbasural' } : {});
      if (!plantilla) component.paso = 2;
      fixture.detectChanges();
      tick();
      const input: HTMLInputElement = fixture.nativeElement.querySelector('app-direccion-autocomplete input');
      input.value = 'Calle';
      input.dispatchEvent(new Event('input'));
      tick(350);
      fixture.detectChanges();
      (fixture.nativeElement.querySelector('[role="option"]') as HTMLElement).dispatchEvent(new MouseEvent('mousedown'));
      tick();
      fixture.detectChanges();
      expect(component.sectorZona).toBe('Manhattan');
      tick();
      fixture.detectChanges();
      const select: HTMLSelectElement = fixture.nativeElement.querySelector(plantilla ? '#sectorPlantilla' : '#sectorZona');
      expect(select.value).toBe('Manhattan');
      expect(select.disabled).toBeFalse();
      select.value = 'Queens';
      select.dispatchEvent(new Event('change'));
      tick();
      expect(component.sectorZona).toBe('Queens');
    }));
  }

  it('no reemplaza la seleccion manual si la direccion no identifica un sector', () => {
    abrir({ plantilla: 'microbasural' });
    component.sectorZona = 'Brooklyn';
    component.completarSectorDesdeDireccion({ lat: '40.7', lon: '-74', textoCorto: 'Calle', displayName: 'Calle' });
    expect(component.sectorZona).toBe('Brooklyn');
    component.sectorZona = '';
    component.completarSectorDesdeDireccion({ lat: '40.7', lon: '-74', textoCorto: 'Calle', displayName: 'Calle' });
    expect(component.sectorZona).toBe('');
  });
});
