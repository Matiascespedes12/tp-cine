import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Peliculas, Pelicula } from '../peliculas';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  peliculas: Pelicula[] = [];
  cargando = true;

  constructor(private peliculasService: Peliculas) {}

  async ngOnInit() {
    this.peliculas = await this.peliculasService.obtenerCartelera();
    this.cargando = false;
  }
}