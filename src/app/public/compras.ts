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

export interface ResultadoCompraCredito {
  exito: boolean;
  error?: string;
  entradas?: EntradaComprada[];
  total?: number;
  creditoUsado?: number;
  aPagar?: number;
}

@Injectable({
  providedIn: 'root'
})
export class Compras {
  constructor(private supabase: Supabase) {}

  generarCodigoQr(): string {
    return 'QR-' + crypto.randomUUID();
  }

  async obtenerDescuentoPrimeraCompra(): Promise<number> {
    const { data, error } = await this.supabase.client.rpc('descuento_primera_compra');

    if (error) {
      console.error('Error al consultar el descuento:', error);
      return 0;
    }
    return Number(data) || 0;
  }

  // Crédito disponible del usuario logueado (0 si no hay sesión)
  async obtenerCredito(usuarioId: string): Promise<number> {
    const { data, error } = await this.supabase.client
      .from('usuarios')
      .select('credito')
      .eq('id', usuarioId)
      .single();

    if (error) {
      console.error('Error al consultar el crédito:', error);
      return 0;
    }
    return Number(data?.credito) || 0;
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

  // Compra usando la función de la base: descuenta el crédito y crea las
  // entradas en una sola transacción, con los precios calculados en la base
  async confirmarCompraConCredito(
    funcionId: string,
    butacaIds: string[]
  ): Promise<ResultadoCompraCredito> {
    const { data, error } = await this.supabase.client.rpc('comprar_con_credito', {
      p_funcion_id: funcionId,
      p_butacas: butacaIds,
      p_usar_credito: true
    });

    if (error) {
      if (error.code === '23505') {
        return { exito: false, error: 'Alguna de las butacas ya fue comprada por otra persona. Volvé al mapa y elegí otras.' };
      }
      console.error('Error al comprar con crédito:', error);
      return { exito: false, error: error.message };
    }

    return {
      exito: true,
      entradas: data.entradas,
      total: Number(data.total),
      creditoUsado: Number(data.credito_usado),
      aPagar: Number(data.a_pagar)
    };
  }
}