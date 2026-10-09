import { Component, Input } from '@angular/core';
import { PreguntaFrecuente } from '../../../models/pregunta-frecuente.model';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FaqComponent {
  @Input() preguntas: PreguntaFrecuente[] = [];
}
