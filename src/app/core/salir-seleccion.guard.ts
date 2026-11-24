import { CanDeactivateFn } from '@angular/router';

export interface TieneCambiosPendientes {
  hayCambiosPendientes(): boolean;
}

export const salirSeleccionGuard: CanDeactivateFn<TieneCambiosPendientes> = (componente) => {
  if (componente.hayCambiosPendientes()) {
    return confirm('Tenés butacas seleccionadas que se van a perder. ¿Querés salir igual?');
  }
  return true;
};