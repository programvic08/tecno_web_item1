import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { ReclamoService } from '../../core/services/reclamo.service';
import { Reclamo } from '../../models/reclamo.model';

@Component({
  selector: 'app-detalle-reclamo',
  templateUrl: './detalle-reclamo.component.html',
  styleUrls: ['./detalle-reclamo.component.css']
})
export class DetalleReclamoComponent implements OnInit {
  reclamo: Reclamo | null = null;
  buscado = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reclamoService: ReclamoService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const folio = params.get('folio');
      if (folio) {
        this.buscar(folio);
      }
    });
  }

  descargarEvidencia(): void {
    if (!this.reclamo?.evidenciaDataUrl || !this.reclamo.evidenciaNombre) {
      return;
    }

    const enlace = document.createElement('a');
    enlace.href = this.reclamo.evidenciaDataUrl;
    enlace.download = this.reclamo.evidenciaNombre;
    enlace.click();
  }

  volver(): void {
    this.router.navigate(['/bandeja-reclamos']);
  }

  private buscar(folio: string): void {
    this.buscado = true;
    this.reclamoService.reclamosVisibles$.pipe(take(1)).subscribe(reclamos => {
      const termino = folio.trim().toLowerCase();
      this.reclamo = reclamos.find(reclamo =>
        reclamo.folio.toLowerCase() === termino ||
        reclamo.id.toString() === termino
      ) ?? null;
    });
  }
}
