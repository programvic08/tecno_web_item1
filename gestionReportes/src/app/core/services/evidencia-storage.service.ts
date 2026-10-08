import { Injectable } from '@angular/core';

export interface EvidenciaLocal {
  id: string;
  nombre: string;
  tipo: string;        // 'application/pdf' | 'image/jpeg'
  tamano: number;      // bytes
  fechaSubida: string; // ISO
  contenidoBase64: string; // data URL
}

export type ResultadoValidacion = { valido: true } | { valido: false; motivo: string };

@Injectable({ providedIn: 'root' })
export class EvidenciaStorageService {
  private readonly CLAVE = 'evidencias_reclamos';
  private readonly TIPOS_PERMITIDOS = ['application/pdf', 'image/jpeg'];
  private readonly EXTENSIONES_PERMITIDAS = ['.pdf', '.jpg', '.jpeg'];
  readonly TAMANO_MAXIMO_BYTES = 2 * 1024 * 1024; // 2 MB (localStorage tiene ~5 MB en total)

  validar(archivo: File): ResultadoValidacion {
    const nombre = archivo.name.toLowerCase();
    const extensionOk = this.EXTENSIONES_PERMITIDAS.some(ext => nombre.endsWith(ext));
    const tipoOk = this.TIPOS_PERMITIDOS.includes(archivo.type);

    if (!extensionOk || !tipoOk) {
      return { valido: false, motivo: 'Solo se permiten archivos PDF o JPG.' };
    }
    if (archivo.size > this.TAMANO_MAXIMO_BYTES) {
      return { valido: false, motivo: 'El archivo supera el tamaño máximo de 2 MB.' };
    }
    return { valido: true };
  }

  /** Lee el archivo y lo guarda localmente. Devuelve el registro guardado. */
  guardar(archivo: File): Promise<EvidenciaLocal> {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();

      lector.onload = () => {
        const evidencia: EvidenciaLocal = {
          id: `ev-${Date.now()}`,
          nombre: archivo.name,
          tipo: archivo.type,
          tamano: archivo.size,
          fechaSubida: new Date().toISOString(),
          contenidoBase64: lector.result as string
        };

        try {
          const lista = this.obtenerTodas();
          lista.push(evidencia);
          localStorage.setItem(this.CLAVE, JSON.stringify(lista));
          resolve(evidencia);
        } catch (e) {
          // Normalmente: QuotaExceededError (almacenamiento lleno)
          reject(new Error('No se pudo guardar el archivo localmente (almacenamiento lleno).'));
        }
      };

      lector.onerror = () => reject(new Error('No se pudo leer el archivo.'));
      lector.readAsDataURL(archivo);
    });
  }

  obtenerTodas(): EvidenciaLocal[] {
    try {
      const raw = localStorage.getItem(this.CLAVE);
      return raw ? (JSON.parse(raw) as EvidenciaLocal[]) : [];
    } catch {
      return [];
    }
  }

  obtenerPorId(id: string): EvidenciaLocal | undefined {
    return this.obtenerTodas().find(e => e.id === id);
  }

  eliminar(id: string): void {
    const lista = this.obtenerTodas().filter(e => e.id !== id);
    localStorage.setItem(this.CLAVE, JSON.stringify(lista));
  }
}
