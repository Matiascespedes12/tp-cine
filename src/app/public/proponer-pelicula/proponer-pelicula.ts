import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth } from '../../core/auth';
import { Propuesta, PropuestasPeliculas } from '../propuestas-peliculas';

@Component({
  selector: 'app-proponer-pelicula',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './proponer-pelicula.html',
  styleUrl: './proponer-pelicula.scss'
})
export class ProponerPelicula implements OnInit {
  sinSesion = false;
  cargando = true;
  enviando = false;
  usuarioId: string | null = null;
  propuestas: Propuesta[] = [];
  error: string | null = null;
  mensaje: string | null = null;

  form = new FormGroup({
    titulo: new FormControl('', [Validators.required, Validators.maxLength(120)]),
    descripcion: new FormControl('', [Validators.required, Validators.maxLength(1000)]),
    motivo: new FormControl('', [Validators.required, Validators.maxLength(1000)])
  });

  constructor(
    private auth: Auth,
    private servicio: PropuestasPeliculas,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const usuario = await this.auth.obtenerUsuarioActual();

    if (!usuario) {
      this.sinSesion = true;
    } else {
      this.usuarioId = usuario.id;
      this.propuestas = await this.servicio.obtenerMisPropuestas(usuario.id);
    }

    this.cargando = false;
    this.cdr.detectChanges();
  }

  // El cliente solo puede tener una propuesta pendiente a la vez
  get hayPendiente(): boolean {
    return this.propuestas.some(p => p.estado === 'pendiente');
  }

  invalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  tieneError(campo: string, error: string): boolean {
    return !!this.form.get(campo)?.hasError(error);
  }

  estadoTexto(estado: string): string {
    if (estado === 'pendiente') return 'Pendiente';
    if (estado === 'aceptada') return 'Aceptada';
    return 'Rechazada';
  }

  async enviar() {
    this.error = null;
    this.mensaje = null;

    if (!this.usuarioId || this.hayPendiente) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    this.enviando = true;
    const resultado = await this.servicio.enviar(this.usuarioId, {
      titulo: v.titulo!,
      descripcion: v.descripcion!,
      motivo: v.motivo!
    });
    this.enviando = false;

    if (resultado.exito) {
      this.mensaje = '¡Gracias! Recibimos tu propuesta y te vamos a avisar cuando la revisemos.';
      this.form.reset();
      this.propuestas = await this.servicio.obtenerMisPropuestas(this.usuarioId);
    } else {
      this.error = resultado.error || 'No se pudo enviar la propuesta.';
    }
    this.cdr.detectChanges();
  }
}

