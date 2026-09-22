import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Peliculas, Pelicula } from '../peliculas';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule],
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

  constructor(private peliculasService: Peliculas) {}

  async ngOnInit() {
    this.peliculas = await this.peliculasService.obtenerCartelera();
    this.generosDisponibles = await this.peliculasService.obtenerGeneros();
    this.peliculasFiltradas = this.peliculas;
    this.cargando = false;
  }

  toggleGenero(nombre: string) {
    if (this.generosSeleccionados.includes(nombre)) {
      this.generosSeleccionados = this.generosSeleccionados.filter(g => g !== nombre);
    } else {
      this.generosSeleccionados = [...this.generosSeleccionados, nombre];
    }
    this.filtrar();
  }

  filtrar() {
    this.peliculasFiltradas = this.peliculas.filter(p => {
      const coincideTexto = p.nombre.toLowerCase().includes(this.busqueda.toLowerCase());
      const coincideGenero =
        this.generosSeleccionados.length === 0 ||
        p.generos.some(g => this.generosSeleccionados.includes(g));
      return coincideTexto && coincideGenero;
    });
  }
}