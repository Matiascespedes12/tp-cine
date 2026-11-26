import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Supabase } from './supabase';

// Fábrica de guards: permisoGuard('funciones') devuelve un guard para ese permiso
export const permisoGuard = (permiso: string): CanActivateFn => {
  return async () => {
    const supabase = inject(Supabase);
    const router = inject(Router);

    const { data, error } = await supabase.client.rpc('tiene_permiso', { p_permiso: permiso });

    if (!error && data === true) {
      return true;
    }
    return router.createUrlTree(['/']);
  };
};

