import { Routes } from '@angular/router';
import { Home } from './public/home/home';
import { PeliculaDetalle } from './public/pelicula-detalle/pelicula-detalle';
import { SeleccionButacas } from './public/seleccion-butacas/seleccion-butacas';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'pelicula/:id', component: PeliculaDetalle },
  { path: 'funcion/:id/butacas', component: SeleccionButacas },
];