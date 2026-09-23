import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Peliculas, Pelicula } from '../peliculas';
import { Resenas, Resena } from '../resenas';

@Component({
  selector: 'app-pelicula-detalle',
  imports: [CommonModule, RouterLink],
  templateUrl: './pelicula-detalle.html',
  styleUrl: './pelicula-detalle.scss'
})
export class PeliculaDetalle implements OnInit {
  pelicula: Pelicula | null = null;
  funciones: any[] = [];
  resenas: Resena[] = [];
  promedio: number | null = null;
  cargando = true;

  constructor(
    private route: ActivatedRoute,
    private peliculasService: Peliculas,
    private resenasService: Resenas,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.pelicula = await this.peliculasService.obtenerPorId(id);
    this.funciones = await this.peliculasService.obtenerFunciones(id);
    this.resenas = await this.resenasService.obtenerPorPelicula(id);
    this.promedio = await this.resenasService.obtenerPromedio(id);
    this.cargando = false;
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