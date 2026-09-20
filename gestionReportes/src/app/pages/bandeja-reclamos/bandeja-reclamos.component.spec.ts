import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BandejaReclamosComponent } from './bandeja-reclamos.component';

describe('BandejaReclamosComponent', () => {
  let component: BandejaReclamosComponent;
  let fixture: ComponentFixture<BandejaReclamosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BandejaReclamosComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BandejaReclamosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
