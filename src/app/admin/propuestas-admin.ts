import { Injectable } from '@angular/core';
import { Supabase } from '../core/supabase';

export interface PropuestaPendiente {
  id: string;
  titulo: string;
  descripcion: string;
  motivo: string;
  fecha: string;
}

@Injectable({
  providedIn: 'root'
})
export class PropuestasAdmin {
  constructor(private supabase: Supabase) {}

  async obtenerPendientes(): Promise<PropuestaPendiente[]> {
    const { data, error } = await this.supabase.client
      .from('propuestas_peliculas')
      .select('id, titulo, descripcion, motivo, fecha')
      .eq('estado', 'pendiente')
      .order('fecha');

    if (error) {
      console.error('Error al obtener las propuestas:', error);
      return [];
    }
    return data as PropuestaPendiente[];
  }

  async resolver(id: string, estado: 'aceptada' | 'rechazada'): Promise<{ exito: boolean; error?: string }> {
    const { error } = await this.supabase.client
      .rpc('resolver_propuesta', { p_id: id, p_estado: estado });

    if (error) {
      return { exito: false, error: error.message };
    }
    return { exito: true };
  }
}

