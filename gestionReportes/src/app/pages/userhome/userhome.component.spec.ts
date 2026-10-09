import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { UserhomeComponent } from './userhome.component';
import { ReportesCarouselComponent } from '../../shared/components/reportes-carousel/reportes-carousel.component';
import { FaqComponent } from '../../shared/components/faq/faq.component';
import { ReclamoService } from '../../core/services/reclamo.service';
import { RUTAS } from '../../core/config/navegacion.config';

describe('UserhomeComponent', () => {
  let component: UserhomeComponent;
  let fixture: ComponentFixture<UserhomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [UserhomeComponent, ReportesCarouselComponent, FaqComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserhomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('mantiene cuatro accesos informativos independientes del ranking', () => {
    expect(component.diapositivas.length).toBe(4);
    expect(component.diapositivas.slice(0, 3).map(d => d.ruta)).toEqual([RUTAS.crear, RUTAS.estado, RUTAS.historial]);
    const anteriores = component.diapositivas;
    TestBed.inject(ReclamoService).actualizarReclamo('REC-2026-001', { subcategoria: 'Escombros' });
    expect(component.diapositivas).toBe(anteriores);
    expect(component.frecuentes.length).toBe(6);
  });

  it('conserva el enlace a la plantilla del reporte frecuente', () => {
    expect(component.parametrosReporte(component.frecuentes[0])).toEqual({ plantilla: 'microbasural' });
  });

  it('el cuarto slide desplaza hacia la seccion de reportes frecuentes', () => {
    const seccion = component.reportesFrecuentes!.nativeElement;
    const scroll = spyOn(seccion, 'scrollIntoView');
    const carrusel = fixture.debugElement.children[0].componentInstance as ReportesCarouselComponent;
    carrusel.seleccionar(3);
    fixture.detectChanges();
    const boton = fixture.nativeElement.querySelector('.accion-seccion') as HTMLButtonElement;
    boton.click();
    expect(scroll).toHaveBeenCalledWith(jasmine.objectContaining({ block: 'start' }));
  });

  it('agrupa los seis estados y mantiene las otras preguntas separadas', () => {
    const faq: HTMLElement = fixture.nativeElement.querySelector('app-faq');
    const preguntas = faq.querySelectorAll('details');
    expect(preguntas.length).toBe(5);
    expect(preguntas[1].querySelectorAll('dt').length).toBe(6);
    expect(preguntas[1].querySelectorAll('dd').length).toBe(6);
    const primera = preguntas[0];
    const resumen = primera.querySelector('summary')!;
    expect(primera.open).toBeFalse();
    resumen.click();
    expect(primera.open).toBeTrue();
    resumen.click();
    expect(primera.open).toBeFalse();
  });
});
