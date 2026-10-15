import { identificarSectorNY } from '../config/sectores-ny.config';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

export interface DireccionSugerencia {
  lat: string;
  lon: string;
  textoCorto: string;
  displayName: string;
  sectorZona?: string;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string; street?: string; housenumber?: string;
    district?: string; city?: string; state?: string; countrycode?: string;
  };
}

// Photon admite busqueda por prefijos. El servidor publico es para uso moderado.
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly url = 'https://photon.komoot.io/api/';
  private readonly limitesNY = '-74.2591,40.4774,-73.7002,40.9176';

  constructor(private http: HttpClient) {}

  buscar(texto: string): Observable<DireccionSugerencia[]> {
    const consulta = (texto || '').trim();
    if (consulta.length < 3) return of([]);
    // No agregar New York al final: el ultimo termino conserva su prefijo.
    const params = new HttpParams()
      .set('q', consulta).set('bbox', this.limitesNY)
      .set('lat', '40.7128').set('lon', '-74.0060')
      .set('lang', 'en').set('limit', '5');
    return this.http.get<{ features: PhotonFeature[] }>(this.url, { params }).pipe(
      map(respuesta => {
        const vistos = new Set<string>();
        const sugerencias: DireccionSugerencia[] = [];
        for (const item of respuesta.features || []) {
          const p = item.properties;
          if (p.countrycode?.toLowerCase() !== 'us' || (p.state && p.state !== 'New York')) continue;
          const calle = p.street ? [p.housenumber, p.street].filter(Boolean).join(' ') : p.name;
          const partes = [calle, p.district, p.city || 'New York'].filter((v): v is string => !!v);
          const textoCorto = [...new Set(partes)].join(', ');
          if (!calle || vistos.has(textoCorto)) continue;
          vistos.add(textoCorto);
          sugerencias.push({
            lat: String(item.geometry.coordinates[1]), lon: String(item.geometry.coordinates[0]),
            textoCorto, displayName: textoCorto,
            sectorZona: identificarSectorNY(p.district, p.city)
          });
        }
        return sugerencias;
      })
    );
  }
}
