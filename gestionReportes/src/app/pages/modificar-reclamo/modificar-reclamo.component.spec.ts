import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

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

    fixture = TestBed.createComponent(ModificarReclamoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
