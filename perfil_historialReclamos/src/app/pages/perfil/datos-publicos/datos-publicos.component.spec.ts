import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatosPublicosComponent } from './datos-publicos.component';

describe('DatosPublicosComponent', () => {
  let component: DatosPublicosComponent;
  let fixture: ComponentFixture<DatosPublicosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DatosPublicosComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatosPublicosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
