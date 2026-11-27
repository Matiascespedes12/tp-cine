import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Peliculas, Pelicula } from '../peliculas';
import { Resenas, Resena } from '../resenas';
import { Auth } from '../../core/auth';
import { RestriccionEdadPipe } from '../../shared/restriccion-edad-pipe';

@Component({
  selector: 'app-pelicula-detalle',
  imports: [CommonModule, FormsModule, RouterLink, RestriccionEdadPipe],
  templateUrl: './pelicula-detalle.html',
  styleUrl: './pelicula-detalle.scss'
})
export class PeliculaDetalle implements OnInit {
  pelicula: Pelicula | null = null;
  funciones: any[] = [];
  resenas: Resena[] = [];
  promedio: number | null = null;
  cargando = true;

  // Reseña propia
  usuarioId: string | null = null;
  miResena: Resena | null = null;
  estrellas = 0;
  comentario = '';
  guardando = false;
  error: string | null = null;
  mensaje: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private peliculasService: Peliculas,
    private resenasService: Resenas,
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.pelicula = await this.peliculasService.obtenerPorId(id);
    this.funciones = await this.peliculasService.obtenerFunciones(id);

    const usuario = await this.auth.obtenerUsuarioActual();
    this.usuarioId = usuario ? usuario.id : null;

    await this.cargarResenas(id);
    this.cargando = false;
    this.cdr.detectChanges();
  }

  private async cargarResenas(peliculaId: string) {
    this.resenas = await this.resenasService.obtenerPorPelicula(peliculaId);
    this.promedio = this.resenasService.promedio(this.resenas);

    // Si ya reseñó, el formulario arranca con su reseña para poder editarla
    this.miResena = this.resenas.find(r => r.usuario_id === this.usuarioId) ?? null;
    if (this.miResena) {
      this.estrellas = this.miResena.calificacion;
      this.comentario = this.miResena.comentario ?? '';
    }
  }

  elegirEstrellas(n: number) {
    this.estrellas = n;
  }

  async guardarResena() {
    if (!this.pelicula || !this.usuarioId) return;

    this.error = null;
    this.mensaje = null;

    if (this.estrellas < 1) {
      this.error = 'Elegí de 1 a 5 estrellas.';
      return;
    }
    if (this.comentario.length > 280) {
      this.error = 'El comentario puede tener hasta 280 caracteres.';
      return;
    }

    this.guardando = true;
    const r = await this.resenasService.guardar(
      this.pelicula.id,
      this.usuarioId,
      this.estrellas,
      this.comentario,
      !!this.miResena
    );
    this.guardando = false;

    if (r.exito) {
      this.mensaje = this.miResena ? 'Reseña actualizada.' : '¡Gracias por tu reseña!';
      await this.cargarResenas(this.pelicula.id);
    } else {
      this.error = r.error || 'No se pudo guardar la reseña.';
    }
    this.cdr.detectChanges();
  }
}

