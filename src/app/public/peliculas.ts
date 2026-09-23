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
  generos: string[];
  ventas?: number;
}

@Injectable({
  providedIn: 'root'
})
export class Peliculas {
  constructor(private supabase: Supabase) {}

  async obtenerCartelera(): Promise<Pelicula[]> {
    const { data, error } = await this.supabase.client
      .from('peliculas')
      .select(`
        *,
        pelicula_genero (
          generos ( nombre )
        )
      `)
      .order('fecha_estreno', { ascending: false });

    if (error) {
      console.error('Error al obtener películas:', error);
      return [];
    }

    return data.map((p: any) => ({
      ...p,
      generos: p.pelicula_genero.map((pg: any) => pg.generos.nombre)
    }));
  }

  async obtenerGeneros(): Promise<{ id: string; nombre: string }[]> {
    const { data, error } = await this.supabase.client
      .from('generos')
      .select('*')
      .order('nombre');

    if (error) {
      console.error('Error al obtener géneros:', error);
      return [];
    }

    return data;
  }

  async obtenerPorId(id: string): Promise<Pelicula | null> {
    const { data, error } = await this.supabase.client
      .from('peliculas')
      .select(`
        *,
        pelicula_genero (
          generos ( nombre )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error al obtener la película:', error);
      return null;
    }

    return {
      ...data,
      generos: data.pelicula_genero.map((pg: any) => pg.generos.nombre)
    };
  }

  async obtenerFunciones(peliculaId: string) {
    const { data, error } = await this.supabase.client
      .from('funciones')
      .select('*, salas(nombre)')
      .eq('pelicula_id', peliculaId)
      .gte('fecha_hora_inicio', new Date().toISOString())
      .order('fecha_hora_inicio');

    if (error) {
      console.error('Error al obtener funciones:', error);
      return [];
    }

    return data;
  }
}