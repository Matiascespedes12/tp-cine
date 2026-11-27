import { Injectable } from '@angular/core';
import { Supabase } from '../core/supabase';

export interface Resena {
  id: string;
  usuario_id: string;
  calificacion: number;
  comentario: string | null;
  fecha: string;
  nombre: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class Resenas {
  constructor(private supabase: Supabase) {}

  // Reseñas con el nombre de quien las escribió (lo resuelve una función de la base)
  async obtenerPorPelicula(peliculaId: string): Promise<Resena[]> {
    const { data, error } = await this.supabase.client
      .rpc('resenas_pelicula', { p_pelicula_id: peliculaId });

    if (error) {
      console.error('Error al obtener reseñas:', error);
      return [];
    }
    return data as Resena[];
  }

  promedio(resenas: Resena[]): number | null {
    if (resenas.length === 0) return null;
    const suma = resenas.reduce((acc, r) => acc + r.calificacion, 0);
    return Math.round((suma / resenas.length) * 10) / 10;
  }

  // Crea la reseña o, si ya existía una de este usuario, la actualiza
  async guardar(
    peliculaId: string,
    usuarioId: string,
    calificacion: number,
    comentario: string,
    existente: boolean
  ): Promise<{ exito: boolean; error?: string }> {
    const texto = comentario.trim() || null;

    const { error } = existente
      ? await this.supabase.client
          .from('resenas')
          .update({ calificacion, comentario: texto })
          .eq('pelicula_id', peliculaId)
          .eq('usuario_id', usuarioId)
      : await this.supabase.client
          .from('resenas')
          .insert({ pelicula_id: peliculaId, usuario_id: usuarioId, calificacion, comentario: texto });

    if (error) {
      if (error.code === '23505') {
        return { exito: false, error: 'Ya reseñaste esta película.' };
      }
      return { exito: false, error: error.message };
    }
    return { exito: true };
  }
}

