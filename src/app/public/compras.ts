import { Injectable } from '@angular/core';
import { Supabase } from '../core/supabase';

export interface DetalleCompra {
  butacaId: string;
  precio: number;
}

export interface EntradaComprada {
  qr_code: string;
  butaca_id: string;
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
  ): Promise<{ exito: boolean; error?: string; entradas?: EntradaComprada[] }> {
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
      // 23505 = violación de la restricción única: alguien compró esa butaca antes
      if (error.code === '23505') {
        return { exito: false, error: 'Alguna de las butacas ya fue comprada por otra persona. Volvé al mapa y elegí otras.' };
      }
      // 42501 = la política de seguridad rechazó la compra (restricción de edad)
        if (error.code === '42501' || error.message.includes('row-level security')) {
        return {
          exito: false,
          error: usuarioId
            ? 'No podés comprar entradas para esta película: no alcanzás la edad mínima.'
            : 'Esta película tiene restricción de edad. Iniciá sesión para poder comprar la entrada.'
        };
      }
      console.error('Error al confirmar la compra:', error);
      return { exito: false, error: error.message };
    }

    return {
      exito: true,
      entradas: entradas.map(e => ({ qr_code: e.qr_code, butaca_id: e.butaca_id, precio: e.precio }))
    };
  }
}