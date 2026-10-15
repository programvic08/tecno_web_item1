import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { GeocodingService } from './geocoding.service';

describe('GeocodingService', () => {
  let service: GeocodingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(GeocodingService);
    http = TestBed.inject(HttpTestingController);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  afterEach(() => http.verify());

  it('no consulta textos de menos de tres caracteres', () => {
    service.buscar(' ab ').subscribe(resultados => expect(resultados).toEqual([]));
    http.expectNone(() => true);
  });

  it('busca en New York y formatea y deduplica direcciones', () => {
    service.buscar(' 215 E 68 ').subscribe(resultados => {
      expect(resultados.length).toBe(1);
      expect(resultados[0].textoCorto).toBe('215 E 68th St, Manhattan, New York');
    });
    const req = http.expectOne(r => r.url === 'https://photon.komoot.io/api/');
    expect(req.request.params.get('q')).toBe('215 E 68');
    expect(req.request.params.get('bbox')).toBe('-74.2591,40.4774,-73.7002,40.9176');
    expect(req.request.params.get('limit')).toBe('5');
    const resultado = { geometry: { coordinates: [-73.96, 40.76] },
      properties: { street: 'E 68th St', housenumber: '215', district: 'Manhattan', city: 'New York', countrycode: 'US', state: 'New York' } };
    req.flush({ features: [resultado, resultado] });
  });

  it('comunica fallos para diferenciarlos de busquedas sin resultados', () => {
    service.buscar('Central Park').subscribe({
      next: () => fail('Debe comunicar el error al componente'),
      error: error => expect(error.status).toBe(503)
    });
    http.expectOne(() => true).flush('Error', { status: 503, statusText: 'Unavailable' });
  });

  it('envia el prefijo incompleto sin agregar palabras al final', () => {
    service.buscar('Broadw').subscribe(resultados => expect(resultados.length).toBe(1));
    const req = http.expectOne(() => true);
    expect(req.request.params.get('q')).toBe('Broadw');
    req.flush({ features: [{ geometry: { coordinates: [-74, 40.7] },
      properties: { name: 'Broadway', city: 'New York', state: 'New York', countrycode: 'US' } }] });
  });

  for (const [district, city, esperado] of [
    ['Manhattan', 'New York', 'Manhattan'], ['Brooklyn', 'New York', 'Brooklyn'],
    ['Queens', 'New York', 'Queens'], ['Bronx', 'New York', 'The Bronx'],
    ['The Bronx', 'New York', 'The Bronx'], ['Staten Island', 'New York', 'Staten Island'],
    ['Astoria', 'Queens', 'Queens'], ['Astoria', 'New York', undefined],
    ['Manhattan', 'Brooklyn', undefined]
  ]) {
    it('identifica solo sectores explicitos: ' + district + ', ' + city, () => {
      service.buscar('calle').subscribe(resultados => expect(resultados[0].sectorZona).toBe(esperado));
      http.expectOne(() => true).flush({ features: [{ geometry: { coordinates: [-74, 40.7] },
        properties: { name: 'Calle', district, city, countrycode: 'US', state: 'New York' } }] });
    });
  }
});
