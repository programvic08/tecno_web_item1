import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstadoReclamoComponent } from './estado-reclamo.component';

describe('EstadoReclamoComponent', () => {
  let component: EstadoReclamoComponent;
  let fixture: ComponentFixture<EstadoReclamoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EstadoReclamoComponent ]
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
