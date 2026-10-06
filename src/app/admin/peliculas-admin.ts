import { Injectable } from '@angular/core';
import { Supabase } from '../core/supabase';

export interface DatosPelicula {
  nombre: string;
  sinopsis: string;
  duracionMin: number;
  formato: string;
  idioma: string;
  restriccionEdad: number | null;
  fechaEstreno: string;
  generosIds: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PeliculasAdmin {
  constructor(private supabase: Supabase) {}

  async obtenerGeneros(): Promise<{ id: string; nombre: string }[]> {
    const { data, error } = await this.supabase.client
      .from('generos')
      .select('id, nombre')
      .order('nombre');

    if (error) {
      console.error('Error al obtener géneros:', error);
      return [];
    }
    return data;
  }

  async obtenerPeliculas(): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('peliculas')
      .select('id, nombre, duracion_min, formato, idioma, imagen_url')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener películas:', error);
      return [];
    }
    return data;
  }

  async crearPelicula(datos: DatosPelicula, poster: File | null): Promise<{ exito: boolean; error?: string }> {
    let imagenUrl: string | null = null;

    // 1. Subir el póster a Storage (si el admin eligió uno)
    if (poster) {
      const extension = poster.name.split('.').pop() || 'jpg';
      const nombreArchivo = `${crypto.randomUUID()}.${extension}`;

      const { error: errorSubida } = await this.supabase.client.storage
        .from('posters')
        .upload(nombreArchivo, poster);

      if (errorSubida) {
        return { exito: false, error: 'No se pudo subir el póster: ' + errorSubida.message };
      }

      const { data } = this.supabase.client.storage.from('posters').getPublicUrl(nombreArchivo);
      imagenUrl = data.publicUrl;
    }

    // 2. Guardar la película
    const { data: pelicula, error: errorPelicula } = await this.supabase.client
      .from('peliculas')
      .insert({
        nombre: datos.nombre,
        sinopsis: datos.sinopsis,
        imagen_url: imagenUrl,
        duracion_min: datos.duracionMin,
        formato: datos.formato,
        idioma: datos.idioma,
        restriccion_edad: datos.restriccionEdad,
        fecha_estreno: datos.fechaEstreno
      })
      .select('id')
      .single();

    if (errorPelicula || !pelicula) {
      return { exito: false, error: errorPelicula?.message || 'No se pudo crear la película.' };
    }

    // 3. Asociar los géneros (relación N a N)
    if (datos.generosIds.length > 0) {
      const { error: errorGeneros } = await this.supabase.client
        .from('pelicula_genero')
        .insert(datos.generosIds.map(generoId => ({ pelicula_id: pelicula.id, genero_id: generoId })));

      if (errorGeneros) {
        return { exito: false, error: 'La película se creó pero fallaron los géneros: ' + errorGeneros.message };
      }
    }

    return { exito: true };
  }
}