import { Injectable } from '@angular/core';
import { Supabase } from '../core/supabase';

export interface FilaFacturacion {
  dia: string;
  entradas: number;
  facturado: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportesAdmin {
  constructor(private supabase: Supabase) {}

  async facturacion(dias: number): Promise<{ filas: FilaFacturacion[]; error?: string }> {
    const { data, error } = await this.supabase.client
      .rpc('reporte_facturacion', { p_dias: dias });

    if (error) {
      return { filas: [], error: error.message };
    }

    return {
      filas: (data as any[]).map(f => ({
        dia: f.dia,
        entradas: Number(f.cantidad_entradas),
        facturado: Number(f.total_facturado)
      }))
    };
  }
}

