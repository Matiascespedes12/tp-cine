import { Routes } from '@angular/router';
import { Home } from './public/home/home';
import { PeliculaDetalle } from './public/pelicula-detalle/pelicula-detalle';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'pelicula/:id', component: PeliculaDetalle },
];