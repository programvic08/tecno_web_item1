import { TestBed } from '@angular/core/testing';

import { AutentificacionGuard } from './autentificacion.guard';

describe('AutentificacionGuard', () => {
  let guard: AutentificacionGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(AutentificacionGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
