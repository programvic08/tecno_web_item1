import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface DireccionSugerencia {
  lat: string;
  lon: string;
  textoCorto: string;
  displayName: string;
}

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  street?: string;
  house_number?: string;
  neighbourhood?: string;
  suburb?: string;
  borough?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  county?: string;
  state?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  address?: NominatimAddress;
}

// Búsqueda de calles de New York con OpenStreetMap (Nominatim).
@Injectable({
  providedIn: 'root'
})
export class GeocodingService {
  private readonly url = 'https://nominatim.openstreetmap.org/search';

  constructor(private http: HttpClient) {}

  buscar(texto: string): Observable<DireccionSugerencia[]> {
    const consulta = (texto || '').trim();
    if (consulta.length < 3) {
      return of([]);
    }

    const params = new HttpParams()
      .set('format', 'json')
      .set('q', `${consulta}, New York`)
      .set('countrycodes', 'us')
      .set('addressdetails', '1')
      .set('limit', '5');

    return this.http.get<NominatimResult[]>(this.url, { params }).pipe(
      map(resultados => {
        const vistos = new Set<string>();
        const sugerencias: DireccionSugerencia[] = [];
        for (const item of resultados || []) {
          const textoCorto = this.formatearDireccion(item.address, item.name, item.display_name);
          // Evita filas repetidas como "Nueva York, Nueva York".
          if (vistos.has(textoCorto)) {
            continue;
          }
          vistos.add(textoCorto);
          sugerencias.push({
            lat: item.lat,
            lon: item.lon,
            displayName: item.display_name,
            textoCorto
          });
        }
        return sugerencias;
      }),
      catchError(() => of([]))
    );
  }

  // Formato estilo USA: "215 E 68th St, Upper East Side, New York".
  // Si no hay calle (barrios, islas, condados), usa el nombre del lugar.
  private formatearDireccion(address: NominatimAddress | undefined, name: string | undefined, fallback: string): string {
    if (!address) {
      return fallback;
    }
    const calle = address.road || address.pedestrian || address.street || '';
    const numero = (address.house_number || '').trim();
    const vecindario = address.neighbourhood || address.borough || address.suburb || address.city_district || (name || '').trim() || '';
    const ciudad = address.city || address.town || address.village || address.hamlet || address.county || address.state || 'New York';

    const partes: string[] = [];
    if (calle) {
      partes.push(numero ? `${numero} ${calle}` : calle);
    }
    if (vecindario && vecindario !== calle) {
      partes.push(vecindario);
    }
    if (ciudad && ciudad !== vecindario) {
      partes.push(ciudad);
    }
    return partes.length > 0 ? partes.join(', ') : fallback;
  }
}
