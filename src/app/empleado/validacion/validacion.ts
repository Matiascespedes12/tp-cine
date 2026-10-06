import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ValidacionEntradas, ResultadoValidacion } from '../validacion-entradas';

@Component({
  selector: 'app-validacion',
  imports: [CommonModule, FormsModule],
  templateUrl: './validacion.html',
  styleUrl: './validacion.scss'
})
export class Validacion {
  codigo = '';
  resultado: ResultadoValidacion | null = null;
  validando = false;

  mensajes: Record<ResultadoValidacion, string> = {
    ok: 'Entrada válida. Puede pasar.',
    ya_usada: 'Esta entrada ya fue utilizada.',
    no_existe: 'El código no existe.',
    cancelada: 'Esta entrada fue cancelada.',
    error: 'No se pudo validar. Verificá que tengas sesión de personal.'
  };

  constructor(
    private servicio: ValidacionEntradas,
    private cdr: ChangeDetectorRef
  ) {}

  async validar() {
    if (!this.codigo.trim()) return;

    this.validando = true;
    this.resultado = null;
    this.resultado = await this.servicio.validar(this.codigo);
    this.validando = false;

    if (this.resultado === 'ok') {
      this.codigo = '';
    }
    this.cdr.detectChanges();
  }
}