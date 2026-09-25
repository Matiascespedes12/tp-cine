import { Injectable } from '@angular/core';
import { Supabase } from '../core/supabase';

export interface Butaca {
  id: string;
  fila: string;
  numero: number;
  tipo: string;
}

export interface Funcion {
  id: string;
  fecha_hora_inicio: string;
  sala_id: string;
  peliculas: { nombre: string; duracion_min: number };
  salas: { nombre: string };
}

@Injectable({
  providedIn: 'root'
})
export class Butacas {
  constructor(private supabase: Supabase) {}

  async obtenerFuncion(funcionId: string): Promise<Funcion | null> {
    const { data, error } = await this.supabase.client
      .from('funciones')
      .select('*, peliculas(nombre, duracion_min), salas(nombre)')
      .eq('id', funcionId)
      .single();

    if (error) {
      console.error('Error al obtener la función:', error);
      return null;
    }

    return data as unknown as Funcion;
  }

  async obtenerButacasDeSala(salaId: string): Promise<Butaca[]> {
    const { data, error } = await this.supabase.client
      .from('butacas')
      .select('*')
      .eq('sala_id', salaId)
      .order('fila')
      .order('numero');

    if (error) {
      console.error('Error al obtener butacas:', error);
      return [];
    }

    return data;
  }

  async obtenerButacasOcupadas(funcionId: string): Promise<string[]> {
    const { data, error } = await this.supabase.client
      .from('entradas')
      .select('butaca_id')
      .eq('funcion_id', funcionId)
      .neq('estado', 'cancelada');

    if (error) {
      console.error('Error al obtener butacas ocupadas:', error);
      return [];
    }

    return data.map((e: any) => e.butaca_id);
  }
}