import { Component, EventEmitter, forwardRef, Input, Output, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { Subject, of, timer } from 'rxjs';
import { catchError, switchMap, takeUntil, tap } from 'rxjs/operators';
import { DireccionSugerencia, GeocodingService } from '../../../core/services/geocoding.service';

// Autocompletado reutilizable de direcciones de New York.
// Se usa con ngModel; al elegir una sugerencia pone su texto en el input.
@Component({
  selector: 'app-direccion-autocomplete',
  host: { '[attr.required]': "required ? '' : null" },
  templateUrl: './direccion-autocomplete.component.html',
  styleUrls: ['./direccion-autocomplete.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DireccionAutocompleteComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DireccionAutocompleteComponent),
      multi: true
    }
  ]
})
export class DireccionAutocompleteComponent implements OnInit, OnDestroy, ControlValueAccessor, Validator {
  @Output() direccionSeleccionada = new EventEmitter<DireccionSugerencia>();

  @Input() inputId = 'direccion';
  @Input() placeholder = 'Escribe una calle y número...';
  @Input() required = false;
  @Input() disabled = false;

  valor = '';
  sugerencias: DireccionSugerencia[] = [];
  cargando = false;
  errorBusqueda = '';
  sinResultados = false;
  listaAbierta = false;
  indiceActivo = -1;

  private buscador = new Subject<string>();
  private destruir = new Subject<void>();
  private temporizadorBlur: ReturnType<typeof setTimeout> | null = null;
  private onChange: (valor: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor(private geocoding: GeocodingService) {}

  ngOnInit(): void {
    this.buscador.pipe(
      switchMap(texto => {
        this.errorBusqueda = '';
        this.sinResultados = false;
        if (texto.trim().length < 3) {
          this.cargando = false;
          return of([]);
        }
        return timer(350).pipe(
          tap(() => this.cargando = true),
          switchMap(() => this.geocoding.buscar(texto)),
          tap(resultados => this.sinResultados = resultados.length === 0),
          catchError(() => {
            this.errorBusqueda = 'No se pudo consultar. Puedes escribir la direccion manualmente.';
            return of([]);
          })
        );
      }),
      takeUntil(this.destruir)
    ).subscribe(resultados => {
      this.sugerencias = resultados;
      this.cargando = false;
      this.listaAbierta = resultados.length > 0;
      this.indiceActivo = -1;
    });
  }

  ngOnDestroy(): void {
    if (this.temporizadorBlur !== null) {
      clearTimeout(this.temporizadorBlur);
    }
    this.destruir.next();
    this.destruir.complete();
  }

  // ControlValueAccessor
  writeValue(valor: string | null): void {
    this.valor = valor ?? '';
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(estaDeshabilitado: boolean): void {
    this.disabled = estaDeshabilitado;
  }

  validate(): ValidationErrors | null {
    if (this.required && !this.valor.trim()) {
      return { required: true };
    }
    return null;
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.valor = input.value;
    this.onChange(this.valor);
    this.sugerencias = [];
    this.listaAbierta = false;
    this.indiceActivo = -1;
    this.buscador.next(this.valor);
  }

  onFocus(): void {
    if (this.sugerencias.length > 0) {
      this.listaAbierta = true;
    }
  }

  onBlur(): void {
    this.onTouched();
    // Retraso para permitir el mousedown en la sugerencia antes de cerrar.
    this.temporizadorBlur = setTimeout(() => {
      this.listaAbierta = false;
      this.temporizadorBlur = null;
    }, 150);
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.listaAbierta || this.sugerencias.length === 0) {
      if (event.key === 'Escape') {
        this.listaAbierta = false;
      }
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.indiceActivo = (this.indiceActivo + 1) % this.sugerencias.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.indiceActivo = (this.indiceActivo - 1 + this.sugerencias.length) % this.sugerencias.length;
    } else if (event.key === 'Enter' && this.indiceActivo >= 0) {
      event.preventDefault();
      this.seleccionar(this.sugerencias[this.indiceActivo]);
    } else if (event.key === 'Escape') {
      this.listaAbierta = false;
    }
  }

  seleccionar(item: DireccionSugerencia): void {
    this.buscador.next('');
    this.valor = item.textoCorto;
    this.direccionSeleccionada.emit(item);
    this.onChange(this.valor);
    this.onTouched();
    this.sugerencias = [];
    this.listaAbierta = false;
    this.indiceActivo = -1;
  }
}
