import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgenteComboboxComponent } from './agente-combobox.component';
import { AgenteAsignable } from '../../../models/usuario.model';

describe('AgenteComboboxComponent', () => {
  let fixture: ComponentFixture<AgenteComboboxComponent>;
  let component: AgenteComboboxComponent;
  const agentes: AgenteAsignable[] = [
    { id: 3, nombre: 'Agente Pérez' },
    { id: 2, nombre: 'Agente Municipal de Prueba' },
    { id: 1002, nombre: 'Agente Gómez' }
  ];

  const campo = (): HTMLInputElement => fixture.nativeElement.querySelector('input');
  const opciones = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('[role="option"]'));
  const escribir = (texto: string): void => {
    campo().value = texto;
    campo().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const tecla = (key: string): void => {
    campo().dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [AgenteComboboxComponent] }).compileComponents();
    fixture = TestBed.createComponent(AgenteComboboxComponent);
    component = fixture.componentInstance;
    component.agentes = agentes;
    fixture.detectChanges();
  });

  it('empieza cerrado y con el texto "Seleccionar agente"', () => {
    expect(opciones().length).toBe(0);
    expect(campo().placeholder).toBe('Seleccionar agente');
    expect(campo().getAttribute('aria-expanded')).toBe('false');
  });

  it('despliega toda la lista al hacer click en el campo', () => {
    campo().click();
    fixture.detectChanges();
    expect(campo().getAttribute('aria-expanded')).toBe('true');
    expect(opciones().map(o => o.textContent!.trim())).toEqual(agentes.map(a => a.nombre));
  });

  it('filtra en el mismo campo mientras se escribe, sin distinguir tildes ni mayúsculas', () => {
    campo().click();
    escribir('pEREz');
    expect(opciones().map(o => o.textContent!.trim())).toEqual(['Agente Pérez']);
    escribir('gomez');
    expect(opciones().map(o => o.textContent!.trim())).toEqual(['Agente Gómez']);
  });

  it('avisa cuando ningún agente coincide', () => {
    campo().click();
    escribir('zzz');
    expect(opciones().length).toBe(1);
    expect(opciones()[0].textContent).toContain('No hay agentes que coincidan');
  });

  it('emite el agente elegido con un click y se cierra', () => {
    const elegidos: AgenteAsignable[] = [];
    component.seleccionado.subscribe(a => elegidos.push(a));
    campo().click();
    fixture.detectChanges();
    opciones()[2].click();
    fixture.detectChanges();
    expect(elegidos).toEqual([agentes[2]]);
    expect(opciones().length).toBe(0);
  });

  it('se maneja con el teclado: flechas, Enter y Escape', () => {
    const elegidos: AgenteAsignable[] = [];
    component.seleccionado.subscribe(a => elegidos.push(a));
    tecla('ArrowDown');
    expect(opciones().length).toBe(3);
    tecla('ArrowDown');
    tecla('ArrowDown');
    tecla('ArrowUp');
    tecla('Enter');
    expect(elegidos).toEqual([agentes[1]]);

    tecla('ArrowDown');
    expect(opciones().length).toBe(3);
    tecla('Escape');
    expect(opciones().length).toBe(0);
    expect(elegidos.length).toBe(1);
  });

  it('se cierra al hacer click fuera', () => {
    campo().click();
    fixture.detectChanges();
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    fixture.detectChanges();
    expect(opciones().length).toBe(0);
  });

  it('muestra el agente seleccionado cuando está cerrado y lo marca al abrir', () => {
    component.seleccionadoId = 3;
    fixture.detectChanges();
    expect(campo().value).toBe('Agente Pérez');
    campo().click();
    fixture.detectChanges();
    expect(campo().value).toBe('');
    expect(campo().placeholder).toBe('Agente Pérez');
    expect(opciones()[0].getAttribute('aria-selected')).toBe('true');
  });
});
