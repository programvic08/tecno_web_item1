import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService, MOTIVO_CUENTA_CREADA } from '../../core/services/auth.service';
import { RegistroComponent } from './registro.component';

describe('RegistroComponent', () => {
  let component: RegistroComponent;
  let fixture: ComponentFixture<RegistroComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const crearFormulario = (invalid: boolean): NgForm => {
    const control = new FormGroup({});
    spyOn(control, 'markAllAsTouched');
    const formulario: Partial<NgForm> = {
      invalid,
      control
    };
    return formulario as NgForm;
  };

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['registrarCiudadano']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [RegistroComponent],
      imports: [FormsModule],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
    TestBed.overrideComponent(RegistroComponent, { set: { template: '' } });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(RegistroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should report whether the passwords match', () => {
    component.password = 'secreto';
    component.confirmarPassword = 'secreto';
    expect(component.passwordsCoinciden).toBeTrue();

    component.confirmarPassword = 'diferente';
    expect(component.passwordsCoinciden).toBeFalse();
  });

  it('should mark the form as touched and avoid registering an invalid form', () => {
    const formulario = crearFormulario(true);

    component.onSubmit(formulario);

    expect(formulario.control.markAllAsTouched).toHaveBeenCalled();
    expect(authService.registrarCiudadano).not.toHaveBeenCalled();
  });

  it('should avoid registering when passwords do not match', () => {
    const formulario = crearFormulario(false);
    component.password = 'secreto';
    component.confirmarPassword = 'diferente';

    component.onSubmit(formulario);

    expect(formulario.control.markAllAsTouched).toHaveBeenCalled();
    expect(authService.registrarCiudadano).not.toHaveBeenCalled();
  });

  it('should register the citizen and navigate to login after success', () => {
    authService.registrarCiudadano.and.returnValue(of(void 0));
    component.nombre = 'Ana Pérez';
    component.email = 'ana@example.com';
    component.password = 'secreto';
    component.confirmarPassword = 'secreto';
    const formulario = crearFormulario(false);

    component.onSubmit(formulario);

    expect(authService.registrarCiudadano).toHaveBeenCalledWith({
      nombre: 'Ana Pérez',
      email: 'ana@example.com',
      password: 'secreto'
    });
    expect(component.cargando).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { motivo: MOTIVO_CUENTA_CREADA }
    });
  });

  it('should show the service error when registration fails', () => {
    authService.registrarCiudadano.and.returnValue(
      throwError(() => new Error('El correo ya está registrado.'))
    );
    component.password = 'secreto';
    component.confirmarPassword = 'secreto';
    const formulario = crearFormulario(false);

    component.onSubmit(formulario);

    expect(component.cargando).toBeFalse();
    expect(component.errorMessage).toBe('El correo ya está registrado.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should ignore a submission while registration is in progress', () => {
    authService.registrarCiudadano.and.returnValue(of(void 0));
    component.cargando = true;
    const formulario = crearFormulario(false);

    component.onSubmit(formulario);

    expect(authService.registrarCiudadano).not.toHaveBeenCalled();
  });
});
