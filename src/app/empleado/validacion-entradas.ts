import { Injectable } from '@angular/core';
import { Supabase } from '../core/supabase';

export type ResultadoValidacion = 'ok' | 'ya_usada' | 'no_existe' | 'cancelada' | 'error';

@Injectable({
  providedIn: 'root'
})
export class ValidacionEntradas {
  constructor(private supabase: Supabase) {}

  async validar(codigo: string): Promise<ResultadoValidacion> {
    const { data, error } = await this.supabase.client
      .rpc('validar_entrada', { p_codigo: codigo.trim() });

    if (error) {
      console.error('Error al validar la entrada:', error);
      return 'error';
    }

    return data as ResultadoValidacion;
  }
}