import { Directive, ElementRef, forwardRef, HostListener, OnDestroy, Renderer2 } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';
import { errorFechaNoFutura, fechaActualLocal, TipoFecha } from '../utils/fechas';

// Se aplica a todos los controles de fecha de Angular, sin repetir bindings por pagina.
@Directive({
  selector: 'input[type=date][ngModel], input[type=datetime-local][ngModel], input[type=date][formControl], input[type=datetime-local][formControl], input[type=date][formControlName], input[type=datetime-local][formControlName]',
  providers: [{ provide: NG_VALIDATORS, useExisting: forwardRef(() => FechaNoFuturaDirective), multi: true }]
})
export class FechaNoFuturaDirective implements Validator, OnDestroy {
  private mensaje: HTMLElement | null = null;
  constructor(private elemento: ElementRef<HTMLInputElement>, private renderer: Renderer2) {}

  @HostListener('focus') actualizarLimite(): void {
    this.renderer.setAttribute(this.elemento.nativeElement, 'max', fechaActualLocal(this.tipo));
  }

  private get tipo(): TipoFecha {
    return this.elemento.nativeElement.type as TipoFecha;
  }

  validate(control: AbstractControl): ValidationErrors | null {
    this.actualizarLimite();
    const input = this.elemento.nativeElement;
    const error = input.validity.badInput ? 'La fecha ingresada no es valida.' : errorFechaNoFutura(control.value, this.tipo);
    if (error && !this.mensaje) {
      this.mensaje = this.renderer.createElement('small');
      this.renderer.addClass(this.mensaje, 'error-fecha');
      this.renderer.setAttribute(this.mensaje, 'role', 'alert');
      this.renderer.insertBefore(input.parentNode, this.mensaje, input.nextSibling);
    }
    if (this.mensaje) {
      this.renderer.setProperty(this.mensaje, 'textContent', error);
      this.renderer.setProperty(this.mensaje, 'hidden', !error);
    }
    return error ? { fechaNoFutura: true } : null;
  }

  ngOnDestroy(): void {
    if (this.mensaje) this.renderer.removeChild(this.mensaje.parentNode, this.mensaje);
  }
}
