import { Injectable } from '@angular/core';
import { Supabase } from '../core/supabase';

export interface EsperaActiva {
  funcion_id: string;
  pelicula: string;
  fecha_hora_inicio: string;
  estado: 'esperando' | 'ofrecida';
  oferta_hasta: string | null;
  posicion: number;
}

@Injectable({
  providedIn: 'root'
})
export class Espera {
  constructor(private supabase: Supabase) {}

  async anotarse(funcionId: string): Promise<{ exito: boolean; posicion?: number; error?: string }> {
    const { data, error } = await this.supabase.client
      .rpc('anotarse_en_espera', { p_funcion_id: funcionId });

    if (error) {
      return { exito: false, error: error.message };
    }
    return { exito: true, posicion: Number(data) };
  }

  async misEsperas(): Promise<EsperaActiva[]> {
    const { data, error } = await this.supabase.client.rpc('mis_esperas');

    if (error) {
      console.error('Error al obtener las esperas:', error);
      return [];
    }
    return (data as any[]).map(e => ({ ...e, posicion: Number(e.posicion) }));
  }

  // Butacas reservadas para otra persona de la lista: el mapa las muestra como ocupadas
  async butacasReservadas(funcionId: string): Promise<string[]> {
    const { data, error } = await this.supabase.client
      .rpc('butacas_reservadas', { p_funcion_id: funcionId });

    if (error) {
      console.error('Error al obtener las reservas:', error);
      return [];
    }
    return (data as string[]) ?? [];
  }
}


