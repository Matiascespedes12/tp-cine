import { Injectable } from '@angular/core';
import { Supabase } from '../core/supabase';

export interface Pelicula {
  id: string;
  nombre: string;
  sinopsis: string;
  imagen_url: string;
  duracion_min: number;
  formato: string;
  idioma: string;
  restriccion_edad: number | null;
  fecha_estreno: string;
}

@Injectable({
  providedIn: 'root'
})
export class Peliculas {
  constructor(private supabase: Supabase) {}

  async obtenerCartelera(): Promise<Pelicula[]> {
    const { data, error } = await this.supabase.client
      .from('peliculas')
      .select('*')
      .order('fecha_estreno', { ascending: false });

    if (error) {
      console.error('Error al obtener películas:', error);
      return [];
    }

    return data as Pelicula[];
  }
}