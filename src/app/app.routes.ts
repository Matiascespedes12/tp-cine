import { Routes } from '@angular/router';
import { Home } from './public/home/home';
import { PeliculaDetalle } from './public/pelicula-detalle/pelicula-detalle';
import { SeleccionButacas } from './public/seleccion-butacas/seleccion-butacas';
import { Checkout } from './public/checkout/checkout';
import { Login } from './auth/login/login';
import { Registro } from './auth/registro/registro';
import { Funciones } from './admin/funciones/funciones';
import { PeliculasForm } from './admin/peliculas-form/peliculas-form';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'pelicula/:id', component: PeliculaDetalle },
  { path: 'funcion/:id/butacas', component: SeleccionButacas },
  { path: 'checkout', component: Checkout },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'admin/funciones', component: Funciones, canActivate: [adminGuard] },
  { path: 'admin/peliculas', component: PeliculasForm, canActivate: [adminGuard] },
];