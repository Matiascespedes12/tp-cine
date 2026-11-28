import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ConsultaCandy,
  ResultadoEntrega,
  ResultadoValidacion,
  ValidacionEntradas
} from '../validacion-entradas';

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

  // Candy bar
  consulta: ConsultaCandy | null = null;
  entrega: ResultadoEntrega | null = null;
  consultando = false;
  entregando = false;

  mensajes: Record<ResultadoValidacion, string> = {
    ok: 'Entrada válida. Puede pasar.',
    ya_usada: 'Esta entrada ya fue utilizada.',
    no_existe: 'El código no existe.',
    cancelada: 'Esta entrada fue cancelada.',
    error: 'No se pudo validar. Verificá que tengas sesión de personal.'
  };

  mensajesCandy: Record<string, string> = {
    pendiente: 'Hay candy para entregar con este código.',
    ya_retirado: 'El candy de este código ya fue entregado.',
    sin_candy: 'Esta entrada no incluye candy bar.',
    cancelada: 'Esta entrada fue cancelada.',
    no_existe: 'El código no existe.',
    error: 'No se pudo consultar. Verificá que tengas sesión de personal.'
  };

  mensajesEntrega: Record<ResultadoEntrega, string> = {
    ok: 'Candy entregado. El código ya no sirve para retirarlo de nuevo.',
    ya_retirado: 'El candy de este código ya fue entregado.',
    sin_candy: 'Esta entrada no incluye candy bar.',
    cancelada: 'Esta entrada fue cancelada.',
    no_existe: 'El código no existe.',
    error: 'No se pudo entregar. Verificá que tengas sesión de personal.'
  };

  constructor(
    private servicio: ValidacionEntradas,
    private cdr: ChangeDetectorRef
  ) {}

  // Al cambiar el código se limpian los resultados anteriores
  alCambiarCodigo() {
    this.resultado = null;
    this.consulta = null;
    this.entrega = null;
  }

  async validar() {
    if (!this.codigo.trim()) return;

    this.validando = true;
    this.resultado = null;
    this.resultado = await this.servicio.validar(this.codigo);
    this.validando = false;
    this.cdr.detectChanges();
  }

  async consultarCandy() {
    if (!this.codigo.trim()) return;

    this.consultando = true;
    this.entrega = null;
    this.consulta = await this.servicio.consultarCandy(this.codigo);
    this.consultando = false;
    this.cdr.detectChanges();
  }

  async entregarCandy() {
    if (!this.codigo.trim()) return;

    this.entregando = true;
    this.entrega = await this.servicio.entregarCandy(this.codigo);
    this.entregando = false;

    // Se vuelve a consultar para mostrar el estado real después de la entrega
    this.consulta = await this.servicio.consultarCandy(this.codigo);
    this.cdr.detectChanges();
  }
}




