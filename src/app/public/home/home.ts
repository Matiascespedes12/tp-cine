import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Peliculas, Pelicula } from '../peliculas';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  peliculas: Pelicula[] = [];
  peliculasFiltradas: Pelicula[] = [];
  generosDisponibles: { id: string; nombre: string }[] = [];
  generosSeleccionados: string[] = [];
  busqueda = '';
  cargando = true;

  // Ids de las más vendidas, en orden; el puesto es la posición en esta lista + 1
  masVendidas: string[] = [];

  constructor(
    private peliculasService: Peliculas,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.peliculas = await this.peliculasService.obtenerCartelera();
    this.generosDisponibles = await this.peliculasService.obtenerGeneros();
    this.masVendidas = await this.peliculasService.obtenerMasVendidas(3);
    this.peliculasFiltradas = this.ordenar(this.peliculas);
    this.cargando = false;
    this.cdr.detectChanges();
  }

  // Las más vendidas van primero; el resto conserva su orden de siempre
  private ordenar(lista: Pelicula[]): Pelicula[] {
    const puesto = (p: Pelicula) => {
      const i = this.masVendidas.indexOf(p.id);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    return [...lista].sort((a, b) => puesto(a) - puesto(b));
  }

  // 1, 2 o 3 si está entre las más vendidas; null si no
  puestoDe(p: Pelicula): number | null {
    const i = this.masVendidas.indexOf(p.id);
    return i === -1 ? null : i + 1;
  }

  toggleGenero(nombre: string) {
    if (this.generosSeleccionados.includes(nombre)) {
      this.generosSeleccionados = this.generosSeleccionados.filter(g => g !== nombre);
    } else {
      this.generosSeleccionados = [...this.generosSeleccionados, nombre];
    }
    this.filtrar();
    this.cdr.detectChanges();
  }

  filtrar() {
    const filtradas = this.peliculas.filter(p => {
      const coincideTexto = p.nombre.toLowerCase().includes(this.busqueda.toLowerCase());
      const coincideGenero =
        this.generosSeleccionados.length === 0 ||
        p.generos.some(g => this.generosSeleccionados.includes(g));
      return coincideTexto && coincideGenero;
    });
    this.peliculasFiltradas = this.ordenar(filtradas);
    this.cdr.detectChanges();
  }
}