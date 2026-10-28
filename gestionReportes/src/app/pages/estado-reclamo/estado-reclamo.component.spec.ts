import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

import { EstadoReclamoComponent } from './estado-reclamo.component';

describe('EstadoReclamoComponent', () => {
  let component: EstadoReclamoComponent;
  let fixture: ComponentFixture<EstadoReclamoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EstadoReclamoComponent, StatusBadgeComponent ],
      imports: [ FormsModule, RouterTestingModule ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstadoReclamoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
