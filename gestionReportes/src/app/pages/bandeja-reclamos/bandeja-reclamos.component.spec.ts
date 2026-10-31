import { AgenteComboboxComponent } from '../../shared/components/agente-combobox/agente-combobox.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

import { BandejaReclamosComponent } from './bandeja-reclamos.component';

describe('BandejaReclamosComponent', () => {
  let component: BandejaReclamosComponent;
  let fixture: ComponentFixture<BandejaReclamosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BandejaReclamosComponent, StatusBadgeComponent, AgenteComboboxComponent ],
      imports: [ FormsModule, RouterTestingModule ]
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
    const selector = TestBed.createComponent(AgenteComboboxComponent).componentInstance;
    selector.agentes = [{id: 3, nombre: 'Ana Perez'}, {id: 2, nombre: 'Luis Soto'}];
    selector.texto = '  pEr  ';
    expect(selector.filtrados).toEqual([{id: 3, nombre: 'Ana Perez'}]);
    selector.texto = 'nadie';
    expect(selector.filtrados).toEqual([]);
    selector.texto = '';
    expect(selector.filtrados.length).toBe(2);
  });

});
