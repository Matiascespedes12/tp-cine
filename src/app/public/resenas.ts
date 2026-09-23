import { Injectable } from '@angular/core';
import { Supabase } from '../core/supabase';

export interface Resena {
  id: string;
  calificacion: number;
  comentario: string;
  fecha: string;
  usuarios: { nombre: string } | null;
}

@Injectable({
  providedIn: 'root'
})
export class Resenas {
  constructor(private supabase: Supabase) {}

  async obtenerPorPelicula(peliculaId: string): Promise<Resena[]> {
    const { data, error } = await this.supabase.client
      .from('resenas')
      .select('*, usuarios(nombre)')
      .eq('pelicula_id', peliculaId)
      .order('fecha', { ascending: false });

    if (error) {
      console.error('Error al obtener reseñas:', error);
      return [];
    }

    return data as unknown as Resena[];
  }

  async obtenerPromedio(peliculaId: string): Promise<number | null> {
    const resenas = await this.obtenerPorPelicula(peliculaId);
    if (resenas.length === 0) return null;

    const suma = resenas.reduce((acc, r) => acc + r.calificacion, 0);
    return Math.round((suma / resenas.length) * 10) / 10;
  }
}