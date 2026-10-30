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
      declarations: [ BandejaReclamosComponent, StatusBadgeComponent ],
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
});
