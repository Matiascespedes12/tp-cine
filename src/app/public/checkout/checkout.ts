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
  comprando = false;
  compraExitosa = false;
  error: string | null = null;
  entradasConQr: EntradaConQr[] = [];

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
    this.cdr.detectChanges();
  }

  precioButaca(butaca: ButacaCheckout): number {
    if (butaca.tipo === 'vip') return this.precioBase * 1.5;
    return this.precioBase;
  }

  get total(): number {
    return this.butacas.reduce((acc, b) => acc + this.precioButaca(b), 0);
  }

  get hayVip(): boolean {
    return this.butacas.some(b => b.tipo === 'vip');
  }

  async confirmarCompra() {
    if (!this.funcionId) return;

    this.comprando = true;
    this.cdr.detectChanges();

    const detalles: DetalleCompra[] = this.butacas.map(b => ({
      butacaId: b.id,
      precio: this.precioButaca(b)
    }));

    // Si hay sesión, la entrada queda a nombre del usuario; si no, es compra anónima
    const usuario = await this.auth.obtenerUsuarioActual();
    const usuarioId = usuario ? usuario.id : null;

    const resultado = await this.comprasService.confirmarCompra(this.funcionId, detalles, usuarioId);

    if (resultado.exito && resultado.entradas) {
      // Generamos una imagen QR por cada entrada comprada
      this.entradasConQr = [];
      for (const entrada of resultado.entradas) {
        const butaca = this.butacas.find(b => b.id === entrada.butaca_id);
        this.entradasConQr.push({
          etiqueta: butaca ? `Butaca ${butaca.fila}${butaca.numero}` : 'Entrada',
          codigo: entrada.qr_code,
          imagenQr: await QRCode.toDataURL(entrada.qr_code, { width: 220, margin: 1 })
        });
      }
      this.compraExitosa = true;
    } else {
      this.error = resultado.error || 'Ocurrió un error al procesar la compra.';
    }

    this.comprando = false;
    this.cdr.detectChanges();
  }
}