import { Injectable } from '@angular/core';
import { Supabase } from '../core/supabase';

export type ResultadoValidacion = 'ok' | 'ya_usada' | 'no_existe' | 'cancelada' | 'error';

export interface ProductoRetiro {
  nombre: string;
  cantidad: number;
}

export interface ConsultaCandy {
  estado: 'pendiente' | 'ya_retirado' | 'sin_candy' | 'cancelada' | 'no_existe' | 'error';
  productos: ProductoRetiro[];
}

export type ResultadoEntrega = 'ok' | 'ya_retirado' | 'sin_candy' | 'cancelada' | 'no_existe' | 'error';

@Injectable({
  providedIn: 'root'
})
export class ValidacionEntradas {
  constructor(private supabase: Supabase) {}

  async validar(codigo: string): Promise<ResultadoValidacion> {
    const { data, error } = await this.supabase.client
      .rpc('validar_entrada', { p_codigo: codigo.trim() });

    if (error) {
      console.error('Error al validar la entrada:', error);
      return 'error';
    }

    return data as ResultadoValidacion;
  }

  // Qué hay para entregar con este código (no marca nada)
  async consultarCandy(codigo: string): Promise<ConsultaCandy> {
    const { data, error } = await this.supabase.client
      .rpc('consultar_candy', { p_codigo: codigo.trim() });

    if (error) {
      console.error('Error al consultar el candy:', error);
      return { estado: 'error', productos: [] };
    }

    return { estado: data.estado, productos: data.productos ?? [] };
  }

  // Confirma la entrega: solo funciona una vez
  async entregarCandy(codigo: string): Promise<ResultadoEntrega> {
    const { data, error } = await this.supabase.client
      .rpc('entregar_candy', { p_codigo: codigo.trim() });

    if (error) {
      console.error('Error al entregar el candy:', error);
      return 'error';
    }

    return data as ResultadoEntrega;
  }
}





