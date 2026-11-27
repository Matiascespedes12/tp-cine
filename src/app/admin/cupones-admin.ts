import { Injectable } from '@angular/core';
import { Supabase } from '../core/supabase';

export interface CuponAdmin {
  id: string;
  codigo: string;
  porcentaje: number;
  tipo: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CuponesAdmin {
  constructor(private supabase: Supabase) {}

  async obtener(): Promise<CuponAdmin[]> {
    const { data, error } = await this.supabase.client
      .from('cupones')
      .select('id, codigo, porcentaje, tipo, activo')
      .order('codigo');

    if (error) {
      console.error('Error al obtener los cupones:', error);
      return [];
    }
    return data as CuponAdmin[];
  }

  async actualizar(id: string, porcentaje: number, activo: boolean): Promise<{ exito: boolean; error?: string }> {
    const { data, error } = await this.supabase.client
      .from('cupones')
      .update({ porcentaje, activo })
      .eq('id', id)
      .select('id');

    if (error) {
      return { exito: false, error: error.message };
    }
    // Si la política de seguridad no deja actualizar, no hay error pero tampoco filas
    if (!data || data.length === 0) {
      return { exito: false, error: 'No tenés permiso para modificar este cupón.' };
    }
    return { exito: true };
  }
}


