import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PeliculasAdmin } from '../peliculas-admin';
import { PropuestasAdmin } from '../propuestas-admin';

@Component({
  selector: 'app-peliculas-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './peliculas-form.html',
  styleUrl: './peliculas-form.scss'
})
export class PeliculasForm implements OnInit {
  generos: { id: string; nombre: string }[] = [];
  peliculas: any[] = [];

  nombre = '';
  sinopsis = '';
  duracionMin: number | null = null;
  formato = '2D';
  idioma = 'doblada';
  restriccionEdad = '';
  fechaEstreno = '';
  generosSeleccionados: string[] = [];
  poster: File | null = null;

  formatos = ['2D', '3D', '4D', '5D'];

  // Si la película viene de una propuesta, la guardamos para aceptarla al crear
  propuestaId: string | null = null;

  error: string | null = null;
  mensaje: string | null = null;
  guardando = false;

  constructor(
    private servicio: PeliculasAdmin,
    private propuestas: PropuestasAdmin,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    // Datos enviados desde la pantalla de propuestas (si los hay)
    const estado = history.state as any;
    if (estado && estado.propuestaId) {
      this.propuestaId = estado.propuestaId;
      this.nombre = estado.titulo || '';
      this.sinopsis = estado.descripcion || '';
    }

    this.generos = await this.servicio.obtenerGeneros();
    this.peliculas = await this.servicio.obtenerPeliculas();
    this.cdr.detectChanges();
  }

  elegirPoster(evento: Event) {
    const input = evento.target as HTMLInputElement;
    this.poster = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  toggleGenero(id: string) {
    if (this.generosSeleccionados.includes(id)) {
      this.generosSeleccionados = this.generosSeleccionados.filter(g => g !== id);
    } else {
      this.generosSeleccionados = [...this.generosSeleccionados, id];
    }
  }

  async alternarVisibilidad(p: any) {
    this.error = null;
    this.mensaje = null;

    const nueva = !p.visible;
    const r = await this.servicio.cambiarVisibilidad(p.id, nueva);

    if (r.exito) {
      p.visible = nueva;
      this.mensaje = nueva
        ? `"${p.nombre}" vuelve a aparecer en la cartelera.`
        : `"${p.nombre}" ya no aparece en la cartelera.`;
    } else {
      this.error = r.error || 'No se pudo cambiar la visibilidad.';
    }
    this.cdr.detectChanges();
  }

  async crear() {
    this.error = null;
    this.mensaje = null;

    if (!this.nombre || !this.sinopsis || !this.duracionMin || !this.fechaEstreno) {
      this.error = 'Completá nombre, sinopsis, duración y fecha de estreno.';
      return;
    }

    if (this.generosSeleccionados.length === 0) {
      this.error = 'Elegí al menos un género.';
      return;
    }

    this.guardando = true;
    const resultado = await this.servicio.crearPelicula(
      {
        nombre: this.nombre,
        sinopsis: this.sinopsis,
        duracionMin: this.duracionMin,
        formato: this.formato,
        idioma: this.idioma,
        restriccionEdad: this.restriccionEdad ? Number(this.restriccionEdad) : null,
        fechaEstreno: this.fechaEstreno,
        generosIds: this.generosSeleccionados
      },
      this.poster
    );
    this.guardando = false;

    if (resultado.exito) {
      this.mensaje = `Película "${this.nombre}" creada.`;

      // Si venía de una propuesta, ahora sí se marca como aceptada (y se avisa al cliente)
      if (this.propuestaId) {
        const r = await this.propuestas.resolver(this.propuestaId, 'aceptada');
        this.mensaje += r.exito
          ? ' La propuesta quedó aceptada y se avisó al cliente.'
          : ' Ojo: no se pudo marcar la propuesta como aceptada.';
        this.propuestaId = null;
      }

      this.nombre = '';
      this.sinopsis = '';
      this.duracionMin = null;
      this.restriccionEdad = '';
      this.fechaEstreno = '';
      this.generosSeleccionados = [];
      this.poster = null;
      this.peliculas = await this.servicio.obtenerPeliculas();
    } else {
      this.error = resultado.error || 'No se pudo crear la película.';
    }
    this.cdr.detectChanges();
  }
}



