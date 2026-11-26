import { Injectable } from '@angular/core';
import { Supabase } from '../core/supabase';

export interface Propuesta {
  id: string;
  titulo: string;
  descripcion: string;
  motivo: string;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  fecha: string;
}

export interface DatosPropuesta {
  titulo: string;
  descripcion: string;
  motivo: string;
}

@Injectable({
  providedIn: 'root'
})
export class PropuestasPeliculas {
  constructor(private supabase: Supabase) {}

  async obtenerMisPropuestas(usuarioId: string): Promise<Propuesta[]> {
    const { data, error } = await this.supabase.client
      .from('propuestas_peliculas')
      .select('id, titulo, descripcion, motivo, estado, fecha')
      .eq('usuario_id', usuarioId)
      .order('fecha', { ascending: false });

    if (error) {
      console.error('Error al obtener las propuestas:', error);
      return [];
    }
    return data as Propuesta[];
  }

  async enviar(usuarioId: string, datos: DatosPropuesta): Promise<{ exito: boolean; error?: string }> {
    const { error } = await this.supabase.client
      .from('propuestas_peliculas')
      .insert({
        usuario_id: usuarioId,
        titulo: datos.titulo.trim(),
        descripcion: datos.descripcion.trim(),
        motivo: datos.motivo.trim()
      });

    if (error) {
      // 23505 = el índice único: ya hay una propuesta pendiente de este usuario
      if (error.code === '23505') {
        return { exito: false, error: 'Ya tenés una propuesta pendiente. Esperá a que el cine la resuelva para enviar otra.' };
      }
      console.error('Error al enviar la propuesta:', error);
      return { exito: false, error: error.message };
    }
    return { exito: true };
  }
}
