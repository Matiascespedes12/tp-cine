import { Injectable } from '@angular/core';
import { Supabase } from '../core/supabase';

@Injectable({
  providedIn: 'root'
})
export class FuncionesAdmin {
  constructor(private supabase: Supabase) {}

  async obtenerPeliculas(): Promise<{ id: string; nombre: string; duracion_min: number }[]> {
    const { data, error } = await this.supabase.client
      .from('peliculas')
      .select('id, nombre, duracion_min')
      .order('nombre');

    if (error) {
      console.error('Error al obtener películas:', error);
      return [];
    }
    return data;
  }

  async obtenerProximasFunciones(): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('funciones')
      .select('id, fecha_hora_inicio, fecha_hora_fin, peliculas(nombre), salas(nombre)')
      .gte('fecha_hora_inicio', new Date().toISOString())
      .order('fecha_hora_inicio');

    if (error) {
      console.error('Error al obtener funciones:', error);
      return [];
    }
    return data;
  }

  async crearFuncion(
    peliculaId: string,
    fecha: string,
    hora: string
  ): Promise<{ exito: boolean; sala?: string; error?: string }> {
    // Argentina no tiene horario de verano: siempre es UTC-3
    const inicio = `${fecha}T${hora}:00-03:00`;

    const { data: funcionId, error } = await this.supabase.client
      .rpc('crear_funcion', { p_pelicula_id: peliculaId, p_inicio: inicio });

    if (error) {
      return { exito: false, error: error.message };
    }

    const { data } = await this.supabase.client
      .from('funciones')
      .select('salas(nombre)')
      .eq('id', funcionId)
      .single();

    return { exito: true, sala: (data as any)?.salas?.nombre };
  }
}