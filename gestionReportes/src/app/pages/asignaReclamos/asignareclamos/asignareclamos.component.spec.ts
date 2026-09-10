import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignareclamosComponent } from './asignareclamos.component';

describe('AsignareclamosComponent', () => {
  let component: AsignareclamosComponent;
  let fixture: ComponentFixture<AsignareclamosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AsignareclamosComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsignareclamosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
