import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FuncionesAdmin } from '../funciones-admin';

@Component({
  selector: 'app-funciones',
  imports: [CommonModule, FormsModule],
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

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}