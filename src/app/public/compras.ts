import { Injectable } from '@angular/core';
import { Supabase } from '../core/supabase';

export interface DetalleCompra {
  butacaId: string;
  precio: number;
}

@Injectable({
  providedIn: 'root'
})
export class Compras {
  constructor(private supabase: Supabase) {}

  generarCodigoQr(): string {
    return 'QR-' + crypto.randomUUID();
  }

  async confirmarCompra(
    funcionId: string,
    detalles: DetalleCompra[],
    usuarioId: string | null
  ): Promise<{ exito: boolean; error?: string }> {
    const entradas = detalles.map(d => ({
      funcion_id: funcionId,
      butaca_id: d.butacaId,
      usuario_id: usuarioId,
      qr_code: this.generarCodigoQr(),
      estado: 'activa',
      precio: d.precio
    }));

    const { error } = await this.supabase.client
      .from('entradas')
      .insert(entradas);

    if (error) {
      console.error('Error al confirmar la compra:', error);
      return { exito: false, error: error.message };
    }

    return { exito: true };
  }
}