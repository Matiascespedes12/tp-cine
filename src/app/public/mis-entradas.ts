import { Injectable } from '@angular/core';
import { Supabase } from '../core/supabase';

export interface MiEntrada {
  id: string;
  qr_code: string;
  estado: 'activa' | 'validada' | 'cancelada';
  precio: number;
  funcion_id: string;
  butacas: { fila: string; numero: number };
  funciones: {
    fecha_hora_inicio: string;
    cancelada: boolean;
    peliculas: { nombre: string };
    salas: { nombre: string };
  };
}

@Injectable({
  providedIn: 'root'
})
export class MisEntradas {
  constructor(private supabase: Supabase) {}

  async obtener(usuarioId: string): Promise<MiEntrada[]> {
    const { data, error } = await this.supabase.client
      .from('entradas')
      .select('id, qr_code, estado, precio, funcion_id, butacas(fila, numero), funciones(fecha_hora_inicio, cancelada, peliculas(nombre), salas(nombre))')
      .eq('usuario_id', usuarioId)
      .order('fecha_compra', { ascending: false });

    if (error) {
      console.error('Error al obtener las entradas:', error);
      return [];
    }
    return data as unknown as MiEntrada[];
  }

  async cancelar(entradaId: string): Promise<{ exito: boolean; credito?: number; ofrecida?: boolean; error?: string }> {
    const { data, error } = await this.supabase.client
      .rpc('cancelar_entrada', { p_entrada_id: entradaId });

    if (error) {
      return { exito: false, error: error.message };
    }
    return { exito: true, credito: Number(data.credito), ofrecida: !!data.ofrecida_a_la_lista };
  }
}


