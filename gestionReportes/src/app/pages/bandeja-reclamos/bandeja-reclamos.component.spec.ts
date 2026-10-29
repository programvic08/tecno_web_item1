import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BandejaReclamosComponent } from './bandeja-reclamos.component';

describe('BandejaReclamosComponent', () => {
  let component: BandejaReclamosComponent;
  let fixture: ComponentFixture<BandejaReclamosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, RouterTestingModule],
      declarations: [ BandejaReclamosComponent, StatusBadgeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BandejaReclamosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('filtra agentes por parte del nombre sin distinguir mayusculas', () => {
    component.agentes = [{id: 3, nombre: 'Ana Perez'}, {id: 2, nombre: 'Luis Soto'}];
    component.busquedasAgente['caso'] = '  pEr  ';
    expect(component.agentesFiltrados('caso')).toEqual([{id: 3, nombre: 'Ana Perez'}]);
    component.busquedasAgente['caso'] = 'nadie';
    expect(component.agentesFiltrados('caso')).toEqual([]);
    component.busquedasAgente['caso'] = '';
    expect(component.agentesFiltrados('caso').length).toBe(2);
  });

});
