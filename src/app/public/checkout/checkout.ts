import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import QRCode from 'qrcode';
import { Compras, DetalleCompra } from '../compras';
import { Butacas } from '../butacas';
import { Auth } from '../../core/auth';

interface ButacaCheckout {
  id: string;
  fila: string;
  numero: number;
  tipo: string;
}

interface EntradaConQr {
  etiqueta: string;
  codigo: string;
  imagenQr: string;
}

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss'
})
export class Checkout implements OnInit {
  funcionId: string | null = null;
  butacas: ButacaCheckout[] = [];
  precioBase = 0;
  porcentajeDescuento = 0;
  comprando = false;
  compraExitosa = false;
  error: string | null = null;
  entradasConQr: EntradaConQr[] = [];

  // Crédito del usuario y si decidió usarlo
  credito = 0;
  usarCredito = false;

  // Lo que realmente se descontó y lo que queda por pagar (para la pantalla final)
  creditoUsadoFinal = 0;
  aPagarFinal = 0;

  constructor(
    private router: Router,
    private comprasService: Compras,
    private butacasService: Butacas,
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state || (history.state as any);

    if (!state || !state.funcionId || !state.butacas || state.butacas.length === 0) {
      this.router.navigate(['/']);
      return;
    }

    this.funcionId = state.funcionId;
    this.butacas = state.butacas;

    const funcion = await this.butacasService.obtenerFuncion(this.funcionId!);
    this.precioBase = (funcion as any)?.precio_base || 2000;
    this.porcentajeDescuento = await this.comprasService.obtenerDescuentoPrimeraCompra();

    // Solo si hay sesión se consulta el crédito
    const usuario = await this.auth.obtenerUsuarioActual();
    if (usuario) {
      this.credito = await this.comprasService.obtenerCredito(usuario.id);
    }

    this.cdr.detectChanges();
  }

  precioButaca(butaca: ButacaCheckout): number {
    if (butaca.tipo === 'vip') return this.precioBase * 1.5;
    return this.precioBase;
  }

  get subtotal(): number {
    return this.butacas.reduce((acc, b) => acc + this.precioButaca(b), 0);
  }

  get descuento(): number {
    return Math.round(this.subtotal * this.porcentajeDescuento / 100);
  }

  get total(): number {
    return this.subtotal - this.descuento;
  }

  // Cuánto crédito se aplicaría: nunca más que el total ni más que el saldo
  get creditoAplicado(): number {
    return this.usarCredito ? Math.min(this.credito, this.total) : 0;
  }

  get aPagar(): number {
    return this.total - this.creditoAplicado;
  }

  get hayVip(): boolean {
    return this.butacas.some(b => b.tipo === 'vip');
  }

  alternarCredito() {
    this.usarCredito = !this.usarCredito;
  }

  async confirmarCompra() {
    if (!this.funcionId) return;

    this.comprando = true;
    this.error = null;
    this.cdr.detectChanges();

    let entradas: { qr_code: string; butaca_id: string }[] | undefined;
    let errorCompra: string | undefined;

    if (this.usarCredito && this.credito > 0) {
      // Camino con crédito: la base calcula precios y descuenta todo en una transacción
      const r = await this.comprasService.confirmarCompraConCredito(
        this.funcionId,
        this.butacas.map(b => b.id)
      );
      if (r.exito) {
        entradas = r.entradas;
        this.creditoUsadoFinal = r.creditoUsado ?? 0;
        this.aPagarFinal = r.aPagar ?? 0;
        this.credito -= this.creditoUsadoFinal;
      } else {
        errorCompra = r.error;
      }
    } else {
      // Camino de siempre (con o sin sesión, sin crédito)
      const factor = 1 - this.porcentajeDescuento / 100;
      const detalles: DetalleCompra[] = this.butacas.map(b => ({
        butacaId: b.id,
        precio: Math.round(this.precioButaca(b) * factor)
      }));

      const usuario = await this.auth.obtenerUsuarioActual();
      const usuarioId = usuario ? usuario.id : null;

      const r = await this.comprasService.confirmarCompra(this.funcionId, detalles, usuarioId);
      if (r.exito) {
        entradas = r.entradas;
        this.creditoUsadoFinal = 0;
        this.aPagarFinal = this.total;
      } else {
        errorCompra = r.error;
      }
    }

    if (entradas) {
      this.entradasConQr = [];
      for (const entrada of entradas) {
        const butaca = this.butacas.find(b => b.id === entrada.butaca_id);
        this.entradasConQr.push({
          etiqueta: butaca ? `Butaca ${butaca.fila}${butaca.numero}` : 'Entrada',
          codigo: entrada.qr_code,
          imagenQr: await QRCode.toDataURL(entrada.qr_code, { width: 220, margin: 1 })
        });
      }
      this.compraExitosa = true;
    } else {
      this.error = errorCompra || 'Ocurrió un error al procesar la compra.';
    }

    this.comprando = false;
    this.cdr.detectChanges();
  }
}