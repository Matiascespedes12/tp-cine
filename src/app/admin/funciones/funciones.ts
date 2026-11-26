import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FuncionesAdmin } from '../funciones-admin';
import { EsperaAdmin } from '../espera-admin/espera-admin';

@Component({
  selector: 'app-funciones',
  imports: [CommonModule, FormsModule, EsperaAdmin],
  templateUrl: './funciones.html',
  styleUrl: './funciones.scss'
})
export class Funciones implements OnInit {
  peliculas: { id: string; nombre: string; duracion_min: number }[] = [];
  proximas: any[] = [];

  peliculaId = '';
  fecha = '';
  hora = '';

  mensaje: string | null = null;
  error: string | null = null;
  guardando = false;
  hoy = new Date().toLocaleDateString('en-CA');

  constructor(
    private servicio: FuncionesAdmin,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.peliculas = await this.servicio.obtenerPeliculas();
    this.proximas = await this.servicio.obtenerProximasFunciones();
    this.cdr.detectChanges();
  }

  async crear() {
    this.mensaje = null;
    this.error = null;

    if (!this.peliculaId || !this.fecha || !this.hora) {
      this.error = 'Elegí película, fecha y hora.';
      return;
    }

    this.guardando = true;
    const resultado = await this.servicio.crearFuncion(this.peliculaId, this.fecha, this.hora);
    this.guardando = false;

    if (resultado.exito) {
      this.mensaje = `Función creada. El sistema le asignó la ${resultado.sala}.`;
      this.proximas = await this.servicio.obtenerProximasFunciones();
    } else {
      this.error = resultado.error || 'No se pudo crear la función.';
    }
    this.cdr.detectChanges();
  }

  async cancelar(funcion: any) {
    const pregunta =
      `¿Cancelar la función de "${funcion.peliculas.nombre}"? ` +
      'Todas las entradas vendidas pasan a crédito y se avisa a cada comprador. No se puede deshacer.';
    if (!confirm(pregunta)) return;

    this.mensaje = null;
    this.error = null;

    const resultado = await this.servicio.cancelarFuncion(funcion.id);

    if (resultado.exito && resultado.resumen) {
      const r = resultado.resumen;
      this.mensaje =
        `Función cancelada. Se acreditaron $${r.credito_total} a ${r.usuarios} usuario(s) (${r.entradas} entradas).` +
        (r.anonimas > 0
          ? ` ${r.anonimas} entrada(s) eran de compras anónimas y no se pueden acreditar.`
          : '');
      this.proximas = await this.servicio.obtenerProximasFunciones();
    } else {
      this.error = resultado.error || 'No se pudo cancelar la función.';
    }
    this.cdr.detectChanges();
  }
}