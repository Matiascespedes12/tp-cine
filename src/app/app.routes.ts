import { Routes } from '@angular/router';
import { Home } from './public/home/home';
import { PeliculaDetalle } from './public/pelicula-detalle/pelicula-detalle';
import { SeleccionButacas } from './public/seleccion-butacas/seleccion-butacas';
import { Checkout } from './public/checkout/checkout';
import { Perfil } from './public/perfil/perfil';
import { ProponerPelicula } from './public/proponer-pelicula/proponer-pelicula';
import { Login } from './auth/login/login';
import { Registro } from './auth/registro/registro';
import { Funciones } from './admin/funciones/funciones';
import { PeliculasForm } from './admin/peliculas-form/peliculas-form';
import { Propuestas } from './admin/propuestas/propuestas';
import { Roles } from './admin/roles/roles';
import { Validacion } from './empleado/validacion/validacion';
import { adminGuard } from './core/admin.guard';
import { permisoGuard } from './core/permiso.guard';
import { personalGuard } from './core/personal.guard';
import { salirSeleccionGuard } from './core/salir-seleccion.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'pelicula/:id', component: PeliculaDetalle },
  { path: 'funcion/:id/butacas', component: SeleccionButacas, canDeactivate: [salirSeleccionGuard] },
  { path: 'checkout', component: Checkout },
  { path: 'perfil', component: Perfil },
  { path: 'proponer', component: ProponerPelicula },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'admin/funciones', component: Funciones, canActivate: [permisoGuard('funciones')] },
  { path: 'admin/peliculas', component: PeliculasForm, canActivate: [permisoGuard('peliculas')] },
  { path: 'admin/propuestas', component: Propuestas, canActivate: [permisoGuard('propuestas')] },
  { path: 'admin/roles', component: Roles, canActivate: [adminGuard] },
  { path: 'validar', component: Validacion, canActivate: [personalGuard] },
];

