import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth';
import { Supabase } from './supabase';

export const personalGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const supabase = inject(Supabase);
  const router = inject(Router);

  const perfil = await auth.obtenerPerfil();

  // Empleados y admins pasan directo
  if (perfil && (perfil.rol === 'empleado' || perfil.rol === 'admin')) {
    return true;
  }

  // El resto, solo si algún rol les dio el permiso de validación
  const { data } = await supabase.client.rpc('tiene_permiso', { p_permiso: 'validacion' });
  return data === true ? true : router.createUrlTree(['/']);
};

