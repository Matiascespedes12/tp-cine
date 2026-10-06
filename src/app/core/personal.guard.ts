import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth';

export const personalGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  const perfil = await auth.obtenerPerfil();

  if (perfil && (perfil.rol === 'empleado' || perfil.rol === 'admin')) {
    return true;
  }

  return router.createUrlTree(['/']);
};